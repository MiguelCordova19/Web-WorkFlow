<?php
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '.workflow.estuclan.com',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT id, name, password, phone, location, bio FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 1) {
        $stmt->bind_result($id, $name, $passwordHash, $phone, $location, $bio);
        $stmt->fetch();
        if (password_verify($password, $passwordHash)) {
            $_SESSION['user_id'] = $id;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_type'] = 'candidato';
            $_SESSION['user_email'] = $email;
            $_SESSION['user_phone'] = $phone;
            $_SESSION['user_location'] = $location;
            $_SESSION['user_bio'] = $bio;
            echo json_encode([
                'success' => true,
                'message' => 'Login exitoso',
                'userType' => 'candidato',
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'location' => $location,
                'bio' => $bio
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }
    $stmt->close();
}
?> 