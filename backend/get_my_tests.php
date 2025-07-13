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

try {
    // Obtener tests con estadísticas
    $stmt = $conn->prepare("
        SELECT 
            st.id,
            st.title,
            st.description,
            st.instructions,
            st.time_limit,
            st.is_active,
            st.created_at,
            st.updated_at,
            COUNT(tq.id) as questions_count,
            COUNT(DISTINCT ta.id) as assignments_count,
            COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END) as completed_count
        FROM skill_tests st
        LEFT JOIN test_questions tq ON st.id = tq.test_id
        LEFT JOIN test_assignments ta ON st.id = ta.test_id
        WHERE st.company_id = ?
        GROUP BY st.id
        ORDER BY st.created_at DESC
    ");
    
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tests = [];
    while ($row = $result->fetch_assoc()) {
        $tests[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'instructions' => $row['instructions'],
            'time_limit' => (int)$row['time_limit'],
            'is_active' => (bool)$row['is_active'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'questions_count' => (int)$row['questions_count'],
            'assignments_count' => (int)$row['assignments_count'],
            'completed_count' => (int)$row['completed_count']
        ];
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'tests' => $tests
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_my_tests.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener tests: ' . $e->getMessage()]);
}
?> 