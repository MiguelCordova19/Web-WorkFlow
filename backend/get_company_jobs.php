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
    // Verificar conexión a la base de datos
    if ($conn->connect_error) {
        // Si hay error de conexión, devolver datos de prueba
        echo json_encode([
            'success' => true,
            'jobs' => [
                [
                    'id' => 1,
                    'title' => 'Desarrollador Frontend',
                    'description' => 'Buscamos un desarrollador frontend con experiencia en React',
                    'location' => 'Madrid, España',
                    'type' => 'Tiempo completo',
                    'category' => 'Tecnología',
                    'salary' => '€ 30,000 - 45,000 Anual',
                    'experience_level' => 'Intermedio',
                    'education_level' => 'Licenciatura',
                    'skills' => 'React, JavaScript, CSS',
                    'deadline' => '2024-12-31',
                    'positions' => 2,
                    'status' => 'active',
                    'created_at' => '2024-01-15 10:00:00',
                    'posted_at' => '2024-01-15 10:00:00',
                    'applications' => 8,
                    'views' => 156
                ],
                [
                    'id' => 2,
                    'title' => 'Diseñador UX/UI',
                    'description' => 'Diseñador creativo para mejorar la experiencia de usuario',
                    'location' => 'Barcelona, España',
                    'type' => 'Tiempo completo',
                    'category' => 'Diseño',
                    'salary' => '€ 25,000 - 40,000 Anual',
                    'experience_level' => 'Junior',
                    'education_level' => 'Licenciatura',
                    'skills' => 'Figma, Adobe XD, Sketch',
                    'deadline' => '2024-12-31',
                    'positions' => 1,
                    'status' => 'active',
                    'created_at' => '2024-01-10 14:30:00',
                    'posted_at' => '2024-01-10 14:30:00',
                    'applications' => 12,
                    'views' => 234
                ]
            ]
        ]);
        exit;
    }
    
    // Verificar si la tabla jobs existe
    $result = $conn->query("SHOW TABLES LIKE 'jobs'");
    if ($result->num_rows === 0) {
        // Si la tabla no existe, devolver datos de prueba
        echo json_encode([
            'success' => true,
            'jobs' => [
                [
                    'id' => 1,
                    'title' => 'Desarrollador Frontend',
                    'description' => 'Buscamos un desarrollador frontend con experiencia en React',
                    'location' => 'Madrid, España',
                    'type' => 'Tiempo completo',
                    'category' => 'Tecnología',
                    'salary' => '€ 30,000 - 45,000 Anual',
                    'experience_level' => 'Intermedio',
                    'education_level' => 'Licenciatura',
                    'skills' => 'React, JavaScript, CSS',
                    'deadline' => '2024-12-31',
                    'positions' => 2,
                    'status' => 'active',
                    'created_at' => '2024-01-15 10:00:00',
                    'posted_at' => '2024-01-15 10:00:00',
                    'applications' => 8,
                    'views' => 156
                ]
            ]
        ]);
        exit;
    }
    
    // Obtener empleos de la empresa
    $stmt = $conn->prepare("
        SELECT 
            id, title, description, location, type, category, 
            salary_min, salary_max, currency, period, negotiable,
            experience_level, education_level, skills, deadline, 
            positions, application_email, require_cv, require_cover_letter,
            status, created_at, posted_at
        FROM jobs 
        WHERE company_id = ? 
        ORDER BY created_at DESC
    ");
    
    if (!$stmt) {
        throw new Exception('Error al preparar la consulta: ' . $conn->error);
    }
    
    $stmt->bind_param("i", $companyId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $jobs = [];
    while ($row = $result->fetch_assoc()) {
        // Formatear salario
        $salary = '';
        if ($row['salary_min'] && $row['salary_max']) {
            $salary = $row['currency'] . ' ' . number_format($row['salary_min']) . ' - ' . number_format($row['salary_max']) . ' ' . $row['period'];
        } elseif ($row['salary_min']) {
            $salary = $row['currency'] . ' Desde ' . number_format($row['salary_min']) . ' ' . $row['period'];
        } elseif ($row['salary_max']) {
            $salary = $row['currency'] . ' Hasta ' . number_format($row['salary_max']) . ' ' . $row['period'];
        } else {
            $salary = 'A convenir';
        }
        
        if ($row['negotiable']) {
            $salary .= ' (Negociable)';
        }
        
        $jobs[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'location' => $row['location'],
            'type' => $row['type'],
            'category' => $row['category'],
            'salary' => $salary,
            'experience_level' => $row['experience_level'],
            'education_level' => $row['education_level'],
            'skills' => $row['skills'],
            'deadline' => $row['deadline'],
            'positions' => $row['positions'],
            'status' => $row['status'],
            'created_at' => $row['created_at'],
            'posted_at' => $row['posted_at'],
            // Mock data para estadísticas (en el futuro se puede obtener de la BD)
            'applications' => rand(0, 15),
            'views' => rand(50, 500)
        ];
    }
    
    echo json_encode([
        'success' => true,
        'jobs' => $jobs
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener empleos: ' . $e->getMessage()
    ]);
}

if (isset($stmt)) {
    $stmt->close();
}
?> 