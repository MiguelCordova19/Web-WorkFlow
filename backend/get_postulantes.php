<?php
require_once 'db.php';

// Crear tabla si no existe
$conn->query("CREATE TABLE IF NOT EXISTS postulantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    experiencia INT NOT NULL,
    estudios VARCHAR(100) NOT NULL,
    habilidades VARCHAR(255) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    tipoTest VARCHAR(50) DEFAULT NULL,
    resultadoTest VARCHAR(20) DEFAULT NULL
)");

header('Content-Type: application/json');

$exp = isset($_GET['experiencia']) ? intval($_GET['experiencia']) : null;
$est = isset($_GET['estudios']) ? $conn->real_escape_string($_GET['estudios']) : '';
$hab = isset($_GET['habilidades']) ? $conn->real_escape_string($_GET['habilidades']) : '';

$where = [];
if ($exp !== null && $exp > 0) $where[] = "experiencia >= $exp";
if ($est) $where[] = "estudios LIKE '%$est%'";
if ($hab) $where[] = "habilidades LIKE '%$hab%'";

$sql = "SELECT * FROM postulantes";
if (count($where) > 0) {
    $sql .= " WHERE " . implode(' AND ', $where);
}
$sql .= " ORDER BY nombre ASC";

$result = $conn->query($sql);
$postulantes = [];
while ($row = $result->fetch_assoc()) {
    $postulantes[] = $row;
}
echo json_encode($postulantes); 