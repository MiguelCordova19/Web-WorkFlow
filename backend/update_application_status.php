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
    
    $applicationId = intval($input['application_id'] ?? 0);
    $newStatus = trim($input['status'] ?? '');
    
    if (!$applicationId || !$newStatus) {
        echo json_encode(['success' => false, 'message' => 'ID de aplicación y estado requeridos']);
        exit;
    }
    
    // Validar estado
    $validStatuses = ['pending', 'reviewing', 'interview', 'accepted', 'rejected'];
    if (!in_array($newStatus, $validStatuses)) {
        echo json_encode(['success' => false, 'message' => 'Estado no válido']);
        exit;
    }
    
    try {
        // Verificar que la aplicación pertenece a un empleo de la empresa
        $checkStmt = $conn->prepare("
            SELECT a.id 
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ? AND j.company_id = ?
        ");
        $checkStmt->bind_param("ii", $applicationId, $companyId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Aplicación no encontrada o no tienes permisos']);
            exit;
        }
        
        $checkStmt->close();
        
        // Actualizar el estado
        $updateStmt = $conn->prepare("UPDATE applications SET status = ? WHERE id = ?");
        $updateStmt->bind_param("si", $newStatus, $applicationId);
        
        if ($updateStmt->execute()) {
            echo json_encode([
                'success' => true, 
                'message' => 'Estado actualizado correctamente',
                'new_status' => $newStatus
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar estado']);
        }
        
        $updateStmt->close();
        
    } catch (Exception $e) {
        error_log("Error en update_application_status.php: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al actualizar estado: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?> 