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
    
    if (!$input || !isset($input['assignment_id'])) {
        echo json_encode(['success' => false, 'message' => 'ID de asignación requerido']);
        exit;
    }
    
    $assignmentId = intval($input['assignment_id']);
    
    try {
        // Verificar que la asignación pertenece al usuario y no ha sido iniciada
        $stmt = $conn->prepare("
            SELECT 
                ta.id,
                ta.status,
                ta.started_at,
                st.time_limit
            FROM test_assignments ta
            JOIN skill_tests st ON ta.test_id = st.id
            WHERE ta.id = ? AND ta.user_id = ? AND ta.status = 'assigned'
        ");
        
        $stmt->bind_param("ii", $assignmentId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Asignación no encontrada o ya iniciada']);
            exit;
        }
        
        $assignment = $result->fetch_assoc();
        $stmt->close();
        
        // Actualizar el estado de la asignación
        $stmt = $conn->prepare("
            UPDATE test_assignments 
            SET status = 'in_progress', started_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->bind_param("i", $assignmentId);
        $stmt->execute();
        $stmt->close();
        
        echo json_encode([
            'success' => true,
            'message' => 'Test iniciado correctamente',
            'time_limit' => (int)$assignment['time_limit']
        ]);
        
    } catch (Exception $e) {
        error_log("Error en start_test.php: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al iniciar test: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?> 