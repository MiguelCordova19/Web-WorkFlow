<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';
require_once 'email_config.php';

// Conexión a la base de datos usando mysqli
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit;
}

// Obtener datos del POST
$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Email es requerido']);
    exit;
}

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Formato de email inválido']);
    exit;
}

try {
    // Verificar si el email existe en la base de datos
    $stmt = $conn->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        // Por seguridad, no revelamos si el email existe o no
        echo json_encode(['success' => true, 'message' => 'Si el email está registrado, recibirás un enlace de recuperación']);
        exit;
    }
    
    // Generar token único para recuperación
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Guardar token en la base de datos
    $stmt = $conn->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user['id'], $token, $expires);
    $stmt->execute();
    
    // Configurar email
    $reset_link = "https://workflow.estuclan.com/reset_password.php?token=" . $token;
    
    // Enviar email usando la configuración de cPanel
    $email_sent = sendRecoveryEmail($user['email'], $user['name'], $reset_link);
    
    if ($email_sent) {
        echo json_encode(['success' => true, 'message' => 'Email de recuperación enviado correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al enviar el email']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
}

function sendRecoveryEmail($email, $name, $reset_link) {
    $subject = "Recuperación de Contraseña - " . APP_NAME;
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .button { display: inline-block; padding: 12px 24px; background:rgb(161, 202, 248); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <img src='https://workflow.estuclan.com/img/Logo-Workflow.jpg' alt='Logo' style='height: 50px;'>
                <h1>" . APP_NAME . "</h1>
                <p>Recuperación de Contraseña</p>
            </div>
            <div class='content'>
                <h2>Hola $name,</h2>
                <p>Has solicitado restablecer tu contraseña en " . APP_NAME . ".</p>
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                <a href='$reset_link' class='button'>Restablecer Contraseña</a>
                <p>Este enlace expirará en 1 hora por seguridad.</p>
                <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
            </div>
            <div class='footer'>
                <p>Este es un email automático, no respondas a este mensaje.</p>
                <p>© 2025 " . APP_NAME . " - Consultoría de RRHH</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Usar la función de configuración de email
    return sendEmail($email, $name, $subject, $message);
}
?> 