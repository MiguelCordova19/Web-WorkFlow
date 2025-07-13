<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

// Verificar autenticación de usuario candidato
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como usuario']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Obtener las aplicaciones del usuario con información del empleo y empresa
    $stmt = $conn->prepare("
        SELECT 
            a.id,
            a.cover_letter,
            a.expected_salary,
            a.availability,
            a.additional_info,
            a.status,
            a.applied_at,
            a.updated_at,
            j.title as job_title,
            j.location as job_location,
            j.salary as job_salary,
            j.type as job_type,
            j.description as job_description,
            c.company_name,
            c.company_email,
            c.website as company_website,
            c.location as company_location
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN companies c ON j.company_id = c.id
        WHERE a.user_id = ?
        ORDER BY a.applied_at DESC
    ");
    
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $applications = [];
    while ($row = $result->fetch_assoc()) {
        $applications[] = [
            'id' => $row['id'],
            'job_title' => $row['job_title'],
            'job_location' => $row['job_location'],
            'job_salary' => $row['job_salary'],
            'job_type' => $row['job_type'],
            'job_description' => $row['job_description'],
            'company_name' => $row['company_name'],
            'company_email' => $row['company_email'],
            'company_website' => $row['company_website'],
            'company_location' => $row['company_location'],
            'cover_letter' => $row['cover_letter'],
            'expected_salary' => $row['expected_salary'],
            'availability' => $row['availability'],
            'additional_info' => $row['additional_info'],
            'status' => $row['status'],
            'applied_at' => $row['applied_at'],
            'updated_at' => $row['updated_at']
        ];
    }
    
    $stmt->close();
    
    // Calcular estadísticas
    $totalApplications = count($applications);
    $pendingApplications = count(array_filter($applications, function($app) { 
        return $app['status'] === 'pending'; 
    }));
    $reviewingApplications = count(array_filter($applications, function($app) { 
        return $app['status'] === 'reviewing'; 
    }));
    $interviewApplications = count(array_filter($applications, function($app) { 
        return $app['status'] === 'interview'; 
    }));
    $acceptedApplications = count(array_filter($applications, function($app) { 
        return $app['status'] === 'accepted'; 
    }));
    $rejectedApplications = count(array_filter($applications, function($app) { 
        return $app['status'] === 'rejected'; 
    }));
    
    echo json_encode([
        'success' => true,
        'applications' => $applications,
        'statistics' => [
            'total' => $totalApplications,
            'pending' => $pendingApplications,
            'reviewing' => $reviewingApplications,
            'interview' => $interviewApplications,
            'accepted' => $acceptedApplications,
            'rejected' => $rejectedApplications
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_user_applications.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener aplicaciones: ' . $e->getMessage()]);
}
?> 