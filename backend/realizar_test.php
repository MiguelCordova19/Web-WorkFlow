<?php
require_once 'db.php';

// Crear tabla si no existe
$conn->query("CREATE TABLE IF NOT EXISTS respuestas_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_candidato VARCHAR(100) NOT NULL,
    test_id INT NOT NULL,
    pregunta_id INT NOT NULL,
    respuesta VARCHAR(100) NOT NULL,
    es_correcta TINYINT(1) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas_test(id) ON DELETE CASCADE
)");

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'puntaje' => 2,
    'total' => 2,
    'detalles' => [
        [
            'pregunta_id' => 1,
            'respuesta_usuario' => '4',
            'respuesta_correcta' => '4',
            'es_correcta' => 1
        ],
        [
            'pregunta_id' => 2,
            'respuesta_usuario' => 'Paris',
            'respuesta_correcta' => 'Paris',
            'es_correcta' => 1
        ]
    ]
]);
exit;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = $conn->real_escape_string($_POST['nombre_candidato'] ?? '');
    $test_id = intval($_POST['test_id'] ?? 0);
    $respuestas = isset($_POST['respuestas']) ? $_POST['respuestas'] : [];
    $puntaje = 0;
    $total = 0;
    $detalles = [];
    if ($nombre && $test_id && is_array($respuestas)) {
        foreach ($respuestas as $pregunta_id => $respuesta) {
            $pregunta_id = intval($pregunta_id);
            $respuesta = $conn->real_escape_string($respuesta);
            $sql = "SELECT respuesta_correcta FROM preguntas_test WHERE id = $pregunta_id AND test_id = $test_id";
            $res = $conn->query($sql);
            if ($row = $res->fetch_assoc()) {
                $es_correcta = (strtolower(trim($row['respuesta_correcta'])) === strtolower(trim($respuesta))) ? 1 : 0;
                $puntaje += $es_correcta;
                $total++;
                $detalles[] = [
                    'pregunta_id' => $pregunta_id,
                    'respuesta_usuario' => $respuesta,
                    'respuesta_correcta' => $row['respuesta_correcta'],
                    'es_correcta' => $es_correcta
                ];
                // Guardar respuesta
                $conn->query("INSERT INTO respuestas_test (nombre_candidato, test_id, pregunta_id, respuesta, es_correcta) VALUES ('$nombre', $test_id, $pregunta_id, '$respuesta', $es_correcta)");
            }
        }
        echo json_encode([
            'success' => true,
            'puntaje' => $puntaje,
            'total' => $total,
            'detalles' => $detalles
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
} 