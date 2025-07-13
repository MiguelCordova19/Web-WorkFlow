<?php
require_once 'config.php';
require_once 'db.php';

header('Content-Type: application/json');

try {
    // Verificar conexión
    if ($conn->ping()) {
        echo json_encode([
            'success' => true,
            'message' => 'Conexión a la base de datos exitosa',
            'server_info' => $conn->server_info
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error de conexión a la base de datos'
        ]);
    }
    
    // Verificar si existe la tabla companies
    $result = $conn->query("SHOW TABLES LIKE 'companies'");
    if ($result->num_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Tabla companies existe',
            'table_info' => 'companies table found'
        ]);
        
        // Verificar estructura de la tabla
        $result = $conn->query("DESCRIBE companies");
        $columns = [];
        while ($row = $result->fetch_assoc()) {
            $columns[] = $row;
        }
        echo json_encode([
            'success' => true,
            'message' => 'Estructura de tabla companies',
            'columns' => $columns
        ]);
        
        // Contar registros
        $result = $conn->query("SELECT COUNT(*) as total FROM companies");
        $count = $result->fetch_assoc()['total'];
        echo json_encode([
            'success' => true,
            'message' => 'Total de empresas en la base de datos',
            'count' => $count
        ]);
        
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Tabla companies no existe'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?> 