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
    
    if (!$input || !isset($input['test_id']) || !isset($input['user_ids'])) {
        echo json_encode(['success' => false, 'message' => 'Datos requeridos faltantes']);
        exit;
    }
    
    $testId = intval($input['test_id']);
    $userIds = $input['user_ids'];
    $jobId = isset($input['job_id']) ? intval($input['job_id']) : null;
    $dueDate = isset($input['due_date']) ? $input['due_date'] : null;
    
    try {
        // Verificar que el test pertenece a la empresa
        $stmt = $conn->prepare("
            SELECT id, title 
            FROM skill_tests 
            WHERE id = ? AND company_id = ? AND is_active = TRUE
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
        
        $conn->begin_transaction();
        
        // Asignar test a cada usuario
        $stmt = $conn->prepare("
            INSERT INTO test_assignments (test_id, user_id, job_id, assigned_by, due_date, status)
            VALUES (?, ?, ?, ?, ?, 'assigned')
        ");
        
        $assignedCount = 0;
        $errors = [];
        
        foreach ($userIds as $userId) {
            // Verificar que no existe ya una asignación activa
            $checkStmt = $conn->prepare("
                SELECT id FROM test_assignments 
                WHERE test_id = ? AND user_id = ? AND status IN ('assigned', 'in_progress')
            ");
            
            $checkStmt->bind_param("ii", $testId, $userId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows === 0) {
                $stmt->bind_param("iiiss", $testId, $userId, $jobId, $companyId, $dueDate);
                $stmt->execute();
                $assignedCount++;
            } else {
                $errors[] = "Usuario ID $userId ya tiene este test asignado";
            }
            
            $checkStmt->close();
        }
        
        $stmt->close();
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Test asignado a $assignedCount candidatos",
            'assigned_count' => $assignedCount,
            'errors' => $errors
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error en assign_test.php: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al asignar test: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?> 