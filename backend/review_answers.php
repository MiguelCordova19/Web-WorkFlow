<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['company_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como empresa']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['assignment_id']) || !isset($input['reviews']) || !is_array($input['reviews'])) {
    echo json_encode(['success' => false, 'message' => 'Datos requeridos faltantes']);
    exit;
}

$assignmentId = intval($input['assignment_id']);
$reviews = $input['reviews']; // Array de {question_id, points_earned, reviewer_notes}

// Verificar que la asignación pertenece a un test de la empresa
$stmt = $conn->prepare('
    SELECT ta.id
    FROM test_assignments ta
    JOIN skill_tests st ON ta.test_id = st.id
    WHERE ta.id = ? AND st.company_id = ?
');
$stmt->bind_param('ii', $assignmentId, $_SESSION['company_id']);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'No autorizado o asignación no encontrada']);
    exit;
}
$stmt->close();

$conn->begin_transaction();
try {
    $stmt = $conn->prepare('
        UPDATE test_responses
        SET points_earned = ?, reviewer_notes = ?, reviewed_by = ?, reviewed_at = NOW()
        WHERE assignment_id = ? AND question_id = ?
    ');
    $totalScore = 0;
    foreach ($reviews as $review) {
        $points = isset($review['points_earned']) ? floatval($review['points_earned']) : 0;
        $notes = isset($review['reviewer_notes']) ? $review['reviewer_notes'] : '';
        $questionId = intval($review['question_id']);
        $stmt->bind_param('dsiii', $points, $notes, $_SESSION['company_id'], $assignmentId, $questionId);
        $stmt->execute();
        $totalScore += $points;
    }
    $stmt->close();
    // Actualizar total_score en la asignación
    $stmt = $conn->prepare('UPDATE test_assignments SET total_score = ? WHERE id = ?');
    $stmt->bind_param('di', $totalScore, $assignmentId);
    $stmt->execute();
    $stmt->close();
    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Revisión guardada correctamente']);
} catch (Exception $e) {
    $conn->rollback();
    error_log('Error en review_answers.php: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al guardar revisión: ' . $e->getMessage()]);
} 