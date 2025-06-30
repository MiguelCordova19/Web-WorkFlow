<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$location = trim($_POST['location'] ?? '');
$bio = trim($_POST['bio'] ?? '');
$newPassword = $_POST['password'] ?? '';

// Validar email único si se cambia
if ($email && $email !== $_SESSION['user_email']) {
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $stmt->bind_param('si', $email, $userId);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El correo ya está registrado por otro usuario.']);
        exit;
    }
    $stmt->close();
}

if ($newPassword && strlen($newPassword) >= 6) {
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('UPDATE users SET name=?, email=?, phone=?, location=?, bio=?, password=? WHERE id=?');
    $stmt->bind_param('ssssssi', $name, $email, $phone, $location, $bio, $passwordHash, $userId);
} else {
    $stmt = $conn->prepare('UPDATE users SET name=?, email=?, phone=?, location=?, bio=? WHERE id=?');
    $stmt->bind_param('sssssi', $name, $email, $phone, $location, $bio, $userId);
}

if ($stmt->execute()) {
    // Actualizar sesión
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_phone'] = $phone;
    $_SESSION['user_location'] = $location;
    $_SESSION['user_bio'] = $bio;
    echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $conn->error]);
}
$stmt->close(); 