<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require_once 'db.php';
header('Content-Type: application/json');

// Verificar autenticación de empresa
if (!isset($_SESSION['company_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como empresa']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recoger datos del POST
    $title = trim($_POST['title'] ?? '');
    $category = trim($_POST['category'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $type = trim($_POST['type'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $requirements = trim($_POST['requirements'] ?? '');
    $benefits = trim($_POST['benefits'] ?? '');
    $salaryMin = $_POST['salaryMin'] !== '' ? floatval($_POST['salaryMin']) : null;
    $salaryMax = $_POST['salaryMax'] !== '' ? floatval($_POST['salaryMax']) : null;
    $currency = trim($_POST['currency'] ?? 'ARS');
    $period = trim($_POST['period'] ?? 'mensual');
    $negotiable = isset($_POST['negotiable']) ? 1 : 0;
    $experienceLevel = trim($_POST['experienceLevel'] ?? '');
    $educationLevel = trim($_POST['educationLevel'] ?? '');
    $skills = trim($_POST['skills'] ?? '');
    $deadline = trim($_POST['deadline'] ?? null);
    $positions = intval($_POST['positions'] ?? 1);
    $applicationEmail = trim($_POST['applicationEmail'] ?? '');
    $requireCV = isset($_POST['requireCV']) ? 1 : 0;
    $requireCoverLetter = isset($_POST['requireCoverLetter']) ? 1 : 0;
    $companyId = $_SESSION['company_id'];
    $status = 'active';
    $createdAt = date('Y-m-d H:i:s');
    $postedAt = date('Y-m-d H:i:s');
    $salary = '';

    // Validar campos obligatorios
    if (!$title || !$category || !$location || !$type || !$description || !$requirements || !$experienceLevel) {
        echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
        exit;
    }

    // Insertar en la base de datos
    $stmt = $conn->prepare("INSERT INTO jobs (
        company_id, title, description, location, salary, type, category, posted_at, requirements, benefits, salary_min, salary_max, currency, period, negotiable, experience_level, education_level, skills, deadline, positions, application_email, require_cv, require_cover_letter, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->bind_param(
        'isssssssssdssisssssisisss',
        $companyId, $title, $description, $location, $salary, $type, $category, $postedAt, $requirements, $benefits, $salaryMin, $salaryMax, $currency, $period, $negotiable, $experienceLevel, $educationLevel, $skills, $deadline, $positions, $applicationEmail, $requireCV, $requireCoverLetter, $status, $createdAt
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Empleo publicado exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al publicar empleo: ' . $stmt->error]);
    }
    $stmt->close();
    exit;
}

echo json_encode(['success' => false, 'message' => 'Método no permitido']); 