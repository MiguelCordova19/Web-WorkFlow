<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'db.php';
header('Content-Type: application/json');

$sql = "SELECT jobs.*, companies.company_name, companies.company_email, companies.website, companies.location AS company_location
        FROM jobs
        JOIN companies ON jobs.company_id = companies.id
        ORDER BY jobs.created_at DESC";

$result = $conn->query($sql);
$jobs = [];
if ($result) {
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
        if (!empty($row['negotiable'])) {
            $salary .= ' (Negociable)';
        }

        $jobs[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'company' => $row['company_name'],
            'location' => $row['location'],
            'salary' => $salary,
            'type' => $row['type'],
            'category' => $row['category'],
            'experience_level' => $row['experience_level'],
            'description' => $row['description'],
            'skills' => $row['skills'],
            'posted_date' => $row['created_at'],
            // Puedes agregar más campos si el frontend los necesita
        ];
    }
}
echo json_encode(['success' => true, 'jobs' => $jobs]); 