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
    // Obtener candidatos que han aplicado a empleos de esta empresa
    $stmt = $conn->prepare("
        SELECT DISTINCT
            u.id as user_id,
            u.name,
            u.email,
            u.phone,
            u.location,
            u.bio,
            a.id as application_id,
            a.status as application_status,
            a.applied_at as application_date,
            j.title as job_title,
            j.id as job_id
        FROM users u
        JOIN applications a ON u.id = a.user_id
        JOIN jobs j ON a.job_id = j.id
        WHERE j.company_id = ?
        ORDER BY a.applied_at DESC
    ");
    
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $candidates = [];
    while ($row = $result->fetch_assoc()) {
        $candidates[] = [
            'user_id' => $row['user_id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'location' => $row['location'],
            'bio' => $row['bio'],
            'application_id' => $row['application_id'],
            'application_status' => $row['application_status'],
            'application_date' => $row['application_date'],
            'job_title' => $row['job_title'],
            'job_id' => $row['job_id']
        ];
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'candidates' => $candidates
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_candidates_for_tests.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener candidatos: ' . $e->getMessage()]);
}
?> 