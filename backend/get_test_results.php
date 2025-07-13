<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

// Verificar autenticación de empresa
if (!isset($_SESSION['company_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como empresa']);
    exit;
}

$companyId = $_SESSION['company_id'];

if (!isset($_GET['test_id'])) {
    echo json_encode(['success' => false, 'message' => 'ID de test requerido']);
    exit;
}

$testId = intval($_GET['test_id']);

try {
    // Verificar que el test pertenece a la empresa
    $stmt = $conn->prepare("
        SELECT id, title, description 
        FROM skill_tests 
        WHERE id = ? AND company_id = ?
    ");
    
    $stmt->bind_param("ii", $testId, $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Test no encontrado o no autorizado']);
        exit;
    }
    
    $test = $result->fetch_assoc();
    $stmt->close();
    
    // Obtener asignaciones con resultados
    $stmt = $conn->prepare("
        SELECT 
            ta.id as assignment_id,
            ta.status,
            ta.assigned_at,
            ta.started_at,
            ta.completed_at,
            ta.total_score,
            ta.max_score,
            ta.due_date,
            u.id as user_id,
            u.name as user_name,
            u.email as user_email,
            j.title as job_title
        FROM test_assignments ta
        JOIN users u ON ta.user_id = u.id
        LEFT JOIN jobs j ON ta.job_id = j.id
        WHERE ta.test_id = ?
        ORDER BY ta.completed_at DESC, ta.assigned_at DESC
    ");
    
    $stmt->bind_param("i", $testId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $assignments = [];
    while ($row = $result->fetch_assoc()) {
        $assignments[] = [
            'assignment_id' => $row['assignment_id'],
            'status' => $row['status'],
            'assigned_at' => $row['assigned_at'],
            'started_at' => $row['started_at'],
            'completed_at' => $row['completed_at'],
            'total_score' => $row['total_score'],
            'max_score' => $row['max_score'],
            'score_percentage' => $row['max_score'] > 0 ? round(($row['total_score'] / $row['max_score']) * 100, 2) : 0,
            'due_date' => $row['due_date'],
            'user' => [
                'id' => $row['user_id'],
                'name' => $row['user_name'],
                'email' => $row['user_email']
            ],
            'job_title' => $row['job_title']
        ];
    }
    
    $stmt->close();
    
    // Obtener estadísticas
    $totalAssignments = count($assignments);
    $completedAssignments = count(array_filter($assignments, fn($a) => $a['status'] === 'completed'));
    $inProgressAssignments = count(array_filter($assignments, fn($a) => $a['status'] === 'in_progress'));
    $assignedAssignments = count(array_filter($assignments, fn($a) => $a['status'] === 'assigned'));
    
    $averageScore = 0;
    if ($completedAssignments > 0) {
        $totalScore = array_sum(array_map(fn($a) => $a['total_score'], array_filter($assignments, fn($a) => $a['status'] === 'completed')));
        $averageScore = round($totalScore / $completedAssignments, 2);
    }
    
    echo json_encode([
        'success' => true,
        'test' => $test,
        'assignments' => $assignments,
        'statistics' => [
            'total_assignments' => $totalAssignments,
            'completed' => $completedAssignments,
            'in_progress' => $inProgressAssignments,
            'assigned' => $assignedAssignments,
            'average_score' => $averageScore
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_test_results.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener resultados: ' . $e->getMessage()]);
}
?> 