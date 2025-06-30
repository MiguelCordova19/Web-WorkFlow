<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $company_name = trim($_POST['company_name']);
    $company_email = trim($_POST['company_email']);
    $password = $_POST['password'];
    $ruc = trim($_POST['ruc']);
    $description = trim($_POST['description']);
    $website = trim($_POST['website']);
    $phone = trim($_POST['phone']);
    $location = trim($_POST['location']);

    // Validar email único
    $stmt = $conn->prepare("SELECT id FROM companies WHERE company_email = ?");
    $stmt->bind_param("s", $company_email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El correo ya está registrado.']);
        exit;
    }
    $stmt->close();

    // Hashear contraseña
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insertar empresa
    $stmt = $conn->prepare("INSERT INTO companies (company_name, company_email, password, ruc, description, website, phone, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssss", $company_name, $company_email, $passwordHash, $ruc, $description, $website, $phone, $location);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Registro de empresa exitoso']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al registrar empresa: ' . $conn->error]);
    }
    $stmt->close();
}
?> 