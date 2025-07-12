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
    $company_email = trim($_POST['company_email']) ?: trim($_POST['email']);
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT id, company_name, company_email, password, phone, website, location, description FROM companies WHERE company_email = ?");
    $stmt->bind_param("s", $company_email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 1) {
        $stmt->bind_result($id, $company_name, $company_email_db, $passwordHash, $phone, $website, $location, $description);
        $stmt->fetch();
        if (password_verify($password, $passwordHash)) {
            $_SESSION['company_id'] = $id;
            $_SESSION['company_name'] = $company_name;
            $_SESSION['user_type'] = 'empresa';
            $_SESSION['company_email'] = $company_email_db;
            $_SESSION['company_phone'] = $phone;
            $_SESSION['company_website'] = $website;
            $_SESSION['company_location'] = $location;
            $_SESSION['company_description'] = $description;
            echo json_encode(['success' => true, 'message' => 'Login de empresa exitoso', 'userType' => 'empresa', 'name' => $company_name, 'email' => $company_email_db, 'phone' => $phone, 'website' => $website, 'location' => $location, 'description' => $description]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Empresa no encontrada']);
    }
    $stmt->close();
}
?> 