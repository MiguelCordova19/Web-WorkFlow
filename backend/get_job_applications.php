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

// Obtener el ID del empleo desde la URL
$jobId = isset($_GET['job_id']) ? intval($_GET['job_id']) : 0;

if (!$jobId) {
    echo json_encode(['success' => false, 'message' => 'ID de empleo requerido']);
    exit;
}

try {
    // Verificar que el empleo pertenece a la empresa
    $jobStmt = $conn->prepare("SELECT id, title, location, salary, type FROM jobs WHERE id = ? AND company_id = ?");
    $jobStmt->bind_param("ii", $jobId, $companyId);
    $jobStmt->execute();
    $jobResult = $jobStmt->get_result();
    
    if ($jobResult->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Empleo no encontrado o no tienes permisos']);
        exit;
    }
    
    $job = $jobResult->fetch_assoc();
    $jobStmt->close();
    
    // Obtener las aplicaciones para este empleo
    $applicationsStmt = $conn->prepare("
        SELECT 
            a.id,
            a.user_id,
            a.cover_letter,
            a.expected_salary,
            a.availability,
            a.additional_info,
            a.status,
            a.applied_at,
            u.name,
            u.email,
            u.phone,
            u.location as user_location,
            u.bio
        FROM applications a
        JOIN users u ON a.user_id = u.id
        WHERE a.job_id = ?
        ORDER BY a.applied_at DESC
    ");
    
    $applicationsStmt->bind_param("i", $jobId);
    $applicationsStmt->execute();
    $applicationsResult = $applicationsStmt->get_result();
    
    $applications = [];
    while ($row = $applicationsResult->fetch_assoc()) {
        $applications[] = [
            'id' => $row['id'],
            'user_id' => $row['user_id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'location' => $row['user_location'],
            'bio' => $row['bio'],
            'cover_letter' => $row['cover_letter'],
            'expected_salary' => $row['expected_salary'],
            'availability' => $row['availability'],
            'additional_info' => $row['additional_info'],
            'status' => $row['status'],
            'applied_at' => $row['applied_at']
        ];
    }
    
    $applicationsStmt->close();
    
    // Calcular estadísticas
    $totalApplications = count($applications);
    $pendingApplications = count(array_filter($applications, function($app) { return $app['status'] === 'pending'; }));
    $reviewingApplications = count(array_filter($applications, function($app) { return $app['status'] === 'reviewing'; }));
    $interviewApplications = count(array_filter($applications, function($app) { return $app['status'] === 'interview'; }));
    $acceptedApplications = count(array_filter($applications, function($app) { return $app['status'] === 'accepted'; }));
    $rejectedApplications = count(array_filter($applications, function($app) { return $app['status'] === 'rejected'; }));
    
    echo json_encode([
        'success' => true,
        'job' => $job,
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
    error_log("Error en get_job_applications.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener aplicaciones: ' . $e->getMessage()]);
}
?> 