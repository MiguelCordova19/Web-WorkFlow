<?php
// Configuración flexible de cookies para desarrollo y producción
$domain = $_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false 
    ? null 
    : '.workflow.estuclan.com';

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => $domain,
    'secure' => $_SERVER['HTTPS'] === 'on',
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
session_unset();
session_destroy();
header('Content-Type: application/json');
echo json_encode(['success' => true]); 