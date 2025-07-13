<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

// Solo empresas pueden acceder
if (!isset($_SESSION['company_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como empresa']);
    exit;
}

if (!isset($_GET['assignment_id'])) {
    echo json_encode(['success' => false, 'message' => 'ID de asignación requerido']);
    exit;
}

$assignmentId = intval($_GET['assignment_id']);

// Verificar que la asignación pertenece a un test de la empresa
$stmt = $conn->prepare('
    SELECT ta.id, ta.user_id, ta.test_id, st.title as test_title, u.name as user_name, u.email as user_email
    FROM test_assignments ta
    JOIN skill_tests st ON ta.test_id = st.id
    JOIN users u ON ta.user_id = u.id
    WHERE ta.id = ? AND st.company_id = ?
');
$stmt->bind_param('ii', $assignmentId, $_SESSION['company_id']);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'No autorizado o asignación no encontrada']);
    exit;
}
$assignment = $result->fetch_assoc();
$stmt->close();

// Obtener preguntas y respuestas
$stmt = $conn->prepare('
    SELECT q.id as question_id, q.question_text, q.points, q.is_required,
           r.answer_text, r.points_earned, r.reviewer_notes
    FROM test_questions q
    LEFT JOIN test_responses r ON q.id = r.question_id AND r.assignment_id = ?
    WHERE q.test_id = ?
    ORDER BY q.order_index ASC, q.id ASC
');
$stmt->bind_param('ii', $assignmentId, $assignment['test_id']);
$stmt->execute();
$result = $stmt->get_result();
$questions = [];
while ($row = $result->fetch_assoc()) {
    $questions[] = $row;
}
$stmt->close();

echo json_encode([
    'success' => true,
    'assignment' => $assignment,
    'questions' => $questions
]); 