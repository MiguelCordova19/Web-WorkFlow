<?php
session_start();
require_once 'db.php';
header('Content-Type: application/json');

// Log para depuración
error_log("update_company_profile.php - Método: " . $_SERVER['REQUEST_METHOD']);
error_log("update_company_profile.php - Sesión: " . print_r($_SESSION, true));

if (!isset($_SESSION['company_id'])) {
    error_log("update_company_profile.php - No hay company_id en sesión");
    echo json_encode(['success' => false, 'message' => 'No autenticado como empresa']);
    exit;
}

$companyId = $_SESSION['company_id'];
error_log("update_company_profile.php - Company ID: " . $companyId);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Consultar datos de la empresa
    try {
        $stmt = $conn->prepare('SELECT company_name, company_email, phone, website, location, description FROM companies WHERE id = ?');
        if (!$stmt) {
            error_log("update_company_profile.php - Error preparando consulta: " . $conn->error);
            echo json_encode(['success' => false, 'message' => 'Error preparando consulta']);
            exit;
        }
        
        $stmt->bind_param('i', $companyId);
        $stmt->execute();
        $stmt->store_result();
        
        error_log("update_company_profile.php - Filas encontradas: " . $stmt->num_rows);
        
        if ($stmt->num_rows === 1) {
            $stmt->bind_result($name, $email, $phone, $website, $location, $description);
            $stmt->fetch();
            
            $companyData = [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'website' => $website,
                'location' => $location,
                'description' => $description
            ];
            
            error_log("update_company_profile.php - Datos de empresa: " . print_r($companyData, true));
            
            echo json_encode([
                'success' => true,
                'company' => $companyData
            ]);
        } else {
            error_log("update_company_profile.php - Empresa no encontrada con ID: " . $companyId);
            echo json_encode(['success' => false, 'message' => 'Empresa no encontrada']);
        }
        $stmt->close();
    } catch (Exception $e) {
        error_log("update_company_profile.php - Excepción: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error en consulta: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $website = trim($_POST['website'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $description = trim($_POST['description'] ?? '');

    error_log("update_company_profile.php - Datos recibidos: " . print_r($_POST, true));

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

    try {
        $stmt = $conn->prepare('UPDATE companies SET company_name=?, company_email=?, phone=?, website=?, location=?, description=? WHERE id=?');
        if (!$stmt) {
            error_log("update_company_profile.php - Error preparando UPDATE: " . $conn->error);
            echo json_encode(['success' => false, 'message' => 'Error preparando actualización']);
            exit;
        }
        
        $stmt->bind_param('ssssssi', $name, $email, $phone, $website, $location, $description, $companyId);
        
        if ($stmt->execute()) {
            // Actualizar sesión
            $_SESSION['company_name'] = $name;
            $_SESSION['company_email'] = $email;
            $_SESSION['company_phone'] = $phone;
            $_SESSION['company_website'] = $website;
            $_SESSION['company_location'] = $location;
            $_SESSION['company_description'] = $description;
            
            error_log("update_company_profile.php - Perfil actualizado exitosamente");
            echo json_encode(['success' => true, 'message' => 'Perfil de empresa actualizado correctamente']);
        } else {
            error_log("update_company_profile.php - Error ejecutando UPDATE: " . $stmt->error);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $stmt->error]);
        }
        $stmt->close();
    } catch (Exception $e) {
        error_log("update_company_profile.php - Excepción en UPDATE: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Método no permitido']); 