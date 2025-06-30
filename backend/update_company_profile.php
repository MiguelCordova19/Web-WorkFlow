<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['company_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como empresa']);
    exit;
}

$companyId = $_SESSION['company_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Consultar datos de la empresa
    $stmt = $conn->prepare('SELECT company_name, company_email, phone, website, location, description FROM companies WHERE id = ?');
    $stmt->bind_param('i', $companyId);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 1) {
        $stmt->bind_result($name, $email, $phone, $website, $location, $description);
        $stmt->fetch();
        echo json_encode([
            'success' => true,
            'company' => [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'website' => $website,
                'location' => $location,
                'description' => $description
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Empresa no encontrada']);
    }
    $stmt->close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $website = trim($_POST['website'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $description = trim($_POST['description'] ?? '');

    // Validar email único si se cambia
    if ($email && $email !== $_SESSION['company_email']) {
        $stmt = $conn->prepare('SELECT id FROM companies WHERE company_email = ? AND id != ?');
        $stmt->bind_param('si', $email, $companyId);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'El correo ya está registrado por otra empresa.']);
            exit;
        }
        $stmt->close();
    }

    $stmt = $conn->prepare('UPDATE companies SET company_name=?, company_email=?, phone=?, website=?, location=?, description=? WHERE id=?');
    $stmt->bind_param('ssssssi', $name, $email, $phone, $website, $location, $description, $companyId);
    if ($stmt->execute()) {
        // Actualizar sesión
        $_SESSION['company_name'] = $name;
        $_SESSION['company_email'] = $email;
        $_SESSION['company_phone'] = $phone;
        $_SESSION['company_website'] = $website;
        $_SESSION['company_location'] = $location;
        $_SESSION['company_description'] = $description;
        echo json_encode(['success' => true, 'message' => 'Perfil de empresa actualizado correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $conn->error]);
    }
    $stmt->close();
    exit;
}

echo json_encode(['success' => false, 'message' => 'Método no permitido']); 