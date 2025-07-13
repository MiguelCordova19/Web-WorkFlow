<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_GET['template_id'])) {
    echo json_encode(['success' => false, 'message' => 'ID de plantilla requerido']);
    exit;
}

$templateId = intval($_GET['template_id']);

try {
    // Verificar que la plantilla existe y es pública
    $stmt = $conn->prepare("
        SELECT id, name, category, description 
        FROM test_templates 
        WHERE id = ? AND is_public = TRUE
    ");
    
    $stmt->bind_param("i", $templateId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Plantilla no encontrada']);
        exit;
    }
    
    $template = $result->fetch_assoc();
    $stmt->close();
    
    // Obtener las preguntas de la plantilla
    $stmt = $conn->prepare("
        SELECT 
            id,
            question_text,
            question_type,
            points,
            order_index,
            is_required
        FROM template_questions 
        WHERE template_id = ?
        ORDER BY order_index
    ");
    
    $stmt->bind_param("i", $templateId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $questions = [];
    while ($row = $result->fetch_assoc()) {
        $questions[] = [
            'question_text' => $row['question_text'],
            'question_type' => $row['question_type'],
            'points' => (int)$row['points'],
            'order_index' => (int)$row['order_index'],
            'is_required' => (bool)$row['is_required']
        ];
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'template' => $template,
        'questions' => $questions
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_template_questions.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener preguntas: ' . $e->getMessage()]);
}
?> 