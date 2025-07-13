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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
        exit;
    }
    
    $title = trim($input['title']);
    $description = trim($input['description'] ?? '');
    $instructions = trim($input['instructions'] ?? '');
    $category = trim($input['category'] ?? '');
    $timeLimit = intval($input['timeLimit'] ?? 60);
    $questions = $input['questions'] ?? [];
    
    // Validaciones
    if (empty($title)) {
        echo json_encode(['success' => false, 'message' => 'El título es obligatorio']);
        exit;
    }
    
    if (empty($questions)) {
        echo json_encode(['success' => false, 'message' => 'Debe agregar al menos una pregunta']);
        exit;
    }
    
    try {
        $conn->begin_transaction();
        
        // Insertar el test
        $stmt = $conn->prepare("
            INSERT INTO skill_tests (company_id, title, description, instructions, time_limit, is_active)
            VALUES (?, ?, ?, ?, ?, TRUE)
        ");
        
        $stmt->bind_param("isssi", $companyId, $title, $description, $instructions, $timeLimit);
        $stmt->execute();
        
        $testId = $conn->insert_id;
        $stmt->close();
        
        // Insertar las preguntas
        $stmt = $conn->prepare("
            INSERT INTO test_questions (test_id, question_text, question_type, points, order_index, is_required)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($questions as $index => $question) {
            $questionText = $question['question_text'];
            $questionType = $question['question_type'];
            $points = intval($question['points']);
            $orderIndex = $index;
            $isRequired = $question['is_required'] ? 1 : 0;
            
            $stmt->bind_param("issiii", $testId, $questionText, $questionType, $points, $orderIndex, $isRequired);
            $stmt->execute();
        }
        
        $stmt->close();
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Test creado exitosamente',
            'test_id' => $testId
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error en create_skill_test.php: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al crear el test: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?> 