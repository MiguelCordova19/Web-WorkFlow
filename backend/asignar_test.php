<?php
require_once 'db.php';

// Crear tabla si no existe
$conn->query("CREATE TABLE IF NOT EXISTS asignaciones_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_candidato VARCHAR(100) NOT NULL,
    test_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
)");

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = $conn->real_escape_string($_POST['nombre_candidato'] ?? '');
    $test_id = intval($_POST['test_id'] ?? 0);
    if ($nombre && $test_id) {
        $sql = "INSERT INTO asignaciones_test (nombre_candidato, test_id) VALUES ('$nombre', $test_id)";
        if ($conn->query($sql)) {
            echo json_encode(['success' => true, 'message' => 'Test asignado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al asignar test']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
} 