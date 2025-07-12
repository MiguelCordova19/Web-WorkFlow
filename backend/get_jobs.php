<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'db.php';
header('Content-Type: application/json');

$sql = "SELECT jobs.*, companies.company_name, companies.company_email, companies.website, companies.location AS company_location
        FROM jobs
        JOIN companies ON jobs.company_id = companies.id
        WHERE jobs.status = 'active'
        ORDER BY jobs.created_at DESC";

$result = $conn->query($sql);
$jobs = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $jobs[] = $row;
    }
}
echo json_encode(['success' => true, 'jobs' => $jobs]); 