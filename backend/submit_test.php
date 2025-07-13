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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['assignment_id']) || !isset($input['answers'])) {
        echo json_encode(['success' => false, 'message' => 'Datos requeridos faltantes']);
        exit;
    }
    
    $assignmentId = intval($input['assignment_id']);
    $answers = $input['answers'];
    
    try {
        // Verificar que la asignación pertenece al usuario y está en progreso
        $stmt = $conn->prepare("
            SELECT 
                ta.id,
                ta.status,
                ta.started_at,
                st.time_limit,
                st.id as test_id
            FROM test_assignments ta
            JOIN skill_tests st ON ta.test_id = st.id
            WHERE ta.id = ? AND ta.user_id = ? AND ta.status = 'in_progress'
        ");
        
        $stmt->bind_param("ii", $assignmentId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Asignación no encontrada o no en progreso']);
            exit;
        }
        
        $assignment = $result->fetch_assoc();
        $stmt->close();
        
        // Calcular tiempo utilizado
        $startTime = strtotime($assignment['started_at']);
        $endTime = time();
        $timeUsed = $endTime - $startTime;
        
        // Obtener preguntas del test para calcular puntuación
        $stmt = $conn->prepare("
            SELECT id, points, is_required
            FROM test_questions 
            WHERE test_id = ?
        ");
        
        $stmt->bind_param("i", $assignment['test_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $questions = [];
        while ($row = $result->fetch_assoc()) {
            $questions[$row['id']] = $row;
        }
        
        $stmt->close();
        
        $conn->begin_transaction();
        
        // Guardar respuestas
        $stmt = $conn->prepare("
            INSERT INTO test_responses (assignment_id, question_id, answer_text, max_points)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE answer_text = VALUES(answer_text)
        ");
        
        $totalPoints = 0;
        $maxPoints = 0;
        $questionsAnswered = 0;
        
        foreach ($answers as $questionId => $answerText) {
            if (isset($questions[$questionId])) {
                $question = $questions[$questionId];
                $maxPoints += $question['points'];
                
                if (!empty(trim($answerText))) {
                    $questionsAnswered++;
                    // Para preguntas abiertas, asignar puntos automáticamente (puede ser revisado después)
                    $pointsEarned = $question['points'];
                    $totalPoints += $pointsEarned;
                }
                
                $stmt->bind_param("iisi", $assignmentId, $questionId, $answerText, $question['points']);
                $stmt->execute();
            }
        }
        
        $stmt->close();
        
        // Actualizar asignación como completada
        $stmt = $conn->prepare("
            UPDATE test_assignments 
            SET status = 'completed', 
                completed_at = NOW(),
                total_score = ?,
                max_score = ?
            WHERE id = ?
        ");
        
        $stmt->bind_param("ddi", $totalPoints, $maxPoints, $assignmentId);
        $stmt->execute();
        $stmt->close();
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Test enviado correctamente',
            'results' => [
                'time_used' => $timeUsed,
                'questions_answered' => $questionsAnswered,
                'total_questions' => count($questions),
                'score' => $totalPoints,
                'max_score' => $maxPoints
            ]
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error en submit_test.php: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al enviar test: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?> 