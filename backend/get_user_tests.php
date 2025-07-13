<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

// Verificar autenticación de usuario
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como usuario']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Obtener tests asignados al usuario
    $stmt = $conn->prepare("
        SELECT 
            ta.id as assignment_id,
            ta.status,
            ta.assigned_at,
            ta.started_at,
            ta.completed_at,
            ta.due_date,
            ta.total_score,
            ta.max_score,
            st.id as test_id,
            st.title as test_title,
            st.description as test_description,
            st.time_limit,
            st.instructions,
            c.company_name as company_name,
            j.title as job_title,
            COUNT(tq.id) as questions_count
        FROM test_assignments ta
        JOIN skill_tests st ON ta.test_id = st.id
        LEFT JOIN companies c ON ta.assigned_by = c.id
        LEFT JOIN jobs j ON ta.job_id = j.id
        LEFT JOIN test_questions tq ON st.id = tq.test_id
        WHERE ta.user_id = ?
        GROUP BY ta.id
        ORDER BY ta.assigned_at DESC
    ");
    
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tests = [];
    while ($row = $result->fetch_assoc()) {
        // Verificar si el test ha expirado
        $isExpired = false;
        if ($row['due_date'] && strtotime($row['due_date']) < time() && $row['status'] !== 'completed') {
            $isExpired = true;
            // Actualizar estado a expirado si es necesario
            if ($row['status'] !== 'expired') {
                $updateStmt = $conn->prepare("UPDATE test_assignments SET status = 'expired' WHERE id = ?");
                $updateStmt->bind_param("i", $row['assignment_id']);
                $updateStmt->execute();
                $updateStmt->close();
                $row['status'] = 'expired';
            }
        }
        
        $tests[] = [
            'assignment_id' => $row['assignment_id'],
            'test_id' => $row['test_id'],
            'test_title' => $row['test_title'],
            'test_description' => $row['test_description'],
            'time_limit' => (int)$row['time_limit'],
            'instructions' => $row['instructions'],
            'status' => $row['status'],
            'assigned_at' => $row['assigned_at'],
            'started_at' => $row['started_at'],
            'completed_at' => $row['completed_at'],
            'due_date' => $row['due_date'],
            'total_score' => $row['total_score'],
            'max_score' => $row['max_score'],
            'score_percentage' => $row['max_score'] > 0 ? round(($row['total_score'] / $row['max_score']) * 100, 2) : 0,
            'company_name' => $row['company_name'],
            'job_title' => $row['job_title'],
            'questions_count' => (int)$row['questions_count'],
            'is_expired' => $isExpired
        ];
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'tests' => $tests
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_user_tests.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener tests: ' . $e->getMessage()]);
}
?> 