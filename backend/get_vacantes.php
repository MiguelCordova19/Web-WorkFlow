<?php
header('Content-Type: application/json');
echo json_encode([
    [
        'id' => 1,
        'cargo' => 'Desarrollador Web',
        'descripcion' => 'Desarrollar aplicaciones web.',
        'salario' => 1000,
        'tipo_contrato' => 'Tiempo Completo',
        'fecha_publicacion' => '2024-06-01 12:00:00'
    ],
    [
        'id' => 2,
        'cargo' => 'Diseñador UX/UI',
        'descripcion' => 'Diseñar interfaces atractivas.',
        'salario' => 900,
        'tipo_contrato' => 'Medio Tiempo',
        'fecha_publicacion' => '2024-06-02 09:00:00'
    ]
]);
exit; 