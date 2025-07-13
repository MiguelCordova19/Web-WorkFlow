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
    // Obtener empleos de la empresa
    $stmt = $conn->prepare("
        SELECT id, title, location, salary, type, status, created_at
        FROM jobs 
        WHERE company_id = ? 
        ORDER BY created_at DESC
    ");
    
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $jobs = [];
    while ($row = $result->fetch_assoc()) {
        $jobs[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'location' => $row['location'],
            'salary' => $row['salary'],
            'type' => $row['type'],
            'status' => $row['status'],
            'created_at' => $row['created_at']
        ];
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'jobs' => $jobs
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_company_jobs_for_selector.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener empleos: ' . $e->getMessage()]);
}
?> 