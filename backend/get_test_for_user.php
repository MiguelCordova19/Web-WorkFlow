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

if (!isset($_GET['test_id']) || !isset($_GET['assignment_id'])) {
    echo json_encode(['success' => false, 'message' => 'ID de test y asignación requeridos']);
    exit;
}

$testId = intval($_GET['test_id']);
$assignmentId = intval($_GET['assignment_id']);

try {
    // Verificar que la asignación pertenece al usuario
    $stmt = $conn->prepare("
        SELECT 
            ta.id,
            ta.status,
            ta.started_at,
            ta.completed_at,
            ta.due_date,
            st.id as test_id,
            st.title,
            st.description,
            st.instructions,
            st.time_limit,
            st.is_active
        FROM test_assignments ta
        JOIN skill_tests st ON ta.test_id = st.id
        WHERE ta.id = ? AND ta.user_id = ? AND st.is_active = TRUE
    ");
    
    $stmt->bind_param("ii", $assignmentId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Asignación no encontrada o no autorizada']);
        exit;
    }
    
    $assignment = $result->fetch_assoc();
    $stmt->close();
    
    // Verificar que el test no haya expirado
    if ($assignment['due_date'] && strtotime($assignment['due_date']) < time()) {
        echo json_encode(['success' => false, 'message' => 'El test ha expirado']);
        exit;
    }
    
    // Verificar que el test no esté completado
    if ($assignment['status'] === 'completed') {
        echo json_encode(['success' => false, 'message' => 'Este test ya ha sido completado']);
        exit;
    }
    
    // Obtener las preguntas del test
    $stmt = $conn->prepare("
        SELECT 
            id,
            question_text,
            question_type,
            points,
            order_index,
            is_required
        FROM test_questions 
        WHERE test_id = ?
        ORDER BY order_index
    ");
    
    $stmt->bind_param("i", $testId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $questions = [];
    while ($row = $result->fetch_assoc()) {
        $questions[] = [
            'id' => $row['id'],
            'question_text' => $row['question_text'],
            'question_type' => $row['question_type'],
            'points' => (int)$row['points'],
            'order_index' => (int)$row['order_index'],
            'is_required' => (bool)$row['is_required']
        ];
    }
    
    $stmt->close();
    
    // Si el test está en progreso, obtener las respuestas guardadas
    $answers = [];
    if ($assignment['status'] === 'in_progress') {
        $stmt = $conn->prepare("
            SELECT 
                question_id,
                answer_text
            FROM test_responses 
            WHERE assignment_id = ?
        ");
        
        $stmt->bind_param("i", $assignmentId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $answers[$row['question_id']] = $row['answer_text'];
        }
        
        $stmt->close();
    }
    
    // Calcular tiempo restante si el test está en progreso
    $timeRemaining = null;
    if ($assignment['status'] === 'in_progress' && $assignment['started_at']) {
        $elapsedTime = time() - strtotime($assignment['started_at']);
        $timeRemaining = max(0, ($assignment['time_limit'] * 60) - $elapsedTime);
    }
    
    echo json_encode([
        'success' => true,
        'test' => [
            'id' => $assignment['test_id'],
            'title' => $assignment['title'],
            'description' => $assignment['description'],
            'instructions' => $assignment['instructions'],
            'time_limit' => (int)$assignment['time_limit']
        ],
        'questions' => $questions,
        'assignment' => [
            'id' => $assignment['id'],
            'status' => $assignment['status'],
            'started_at' => $assignment['started_at'],
            'completed_at' => $assignment['completed_at'],
            'due_date' => $assignment['due_date'],
            'time_remaining' => $timeRemaining,
            'answers' => $answers
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_test_for_user.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener test: ' . $e->getMessage()]);
}
?> 