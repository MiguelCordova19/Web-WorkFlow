<?php
header('Content-Type: application/json');
echo json_encode([
    [
        'id' => 1,
        'nombre' => 'Test Básico',
        'preguntas' => [
            ['id' => 1, 'pregunta' => '¿2 + 2 = ?'],
            ['id' => 2, 'pregunta' => '¿Capital de Francia?']
        ]
    ]
]);
exit; 