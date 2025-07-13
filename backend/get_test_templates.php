<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

try {
    // Obtener plantillas con el número de preguntas
    $stmt = $conn->prepare("
        SELECT 
            t.id,
            t.name,
            t.category,
            t.description,
            t.is_public,
            COUNT(tq.id) as questions_count
        FROM test_templates t
        LEFT JOIN template_questions tq ON t.id = tq.template_id
        WHERE t.is_public = TRUE
        GROUP BY t.id
        ORDER BY t.category, t.name
    ");
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $templates = [];
    while ($row = $result->fetch_assoc()) {
        $templates[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'category' => $row['category'],
            'description' => $row['description'],
            'is_public' => (bool)$row['is_public'],
            'questions_count' => (int)$row['questions_count']
        ];
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'templates' => $templates
    ]);
    
} catch (Exception $e) {
    error_log("Error en get_test_templates.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al obtener plantillas: ' . $e->getMessage()]);
}
?> 