<?php
session_start();
header('Content-Type: application/json');
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como usuario', 'favorites' => []]);
    exit;
}

$userId = $_SESSION['user_id'];

// Si no existe la tabla de favoritos, devuelve vacío
if ($conn->connect_error) {
    echo json_encode(['success' => true, 'favorites' => []]);
    exit;
}

// Buscar favoritos del usuario
$sql = "SELECT f.job_id, j.title, j.location, j.salary, c.company_name FROM favorites f JOIN jobs j ON f.job_id = j.id JOIN companies c ON j.company_id = c.id WHERE f.user_id = ? ORDER BY f.id DESC";
$stmt = $conn->prepare($sql);
if ($stmt) {
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $favorites = [];
    while ($row = $result->fetch_assoc()) {
        $favorites[] = [
            'id' => $row['job_id'],
            'title' => $row['title'],
            'location' => $row['location'],
            'salary' => $row['salary'],
            'company_name' => $row['company_name']
        ];
    }
    $stmt->close();
    echo json_encode(['success' => true, 'favorites' => $favorites]);
} else {
    echo json_encode(['success' => true, 'favorites' => []]);
} 