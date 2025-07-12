<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once 'backend/config.php';

// Conexión a la base de datos usando mysqli
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($conn->connect_error) {
    $error = 'Error de conexión a la base de datos';
}

$token = $_GET['token'] ?? '';
$error = '';
$success = '';

if (empty($token)) {
    $error = 'Token de recuperación inválido';
} else {
    // Verificar si el token existe y no ha expirado
    $stmt = $conn->prepare("SELECT pr.*, u.email, u.name FROM password_resets pr 
                           JOIN users u ON pr.user_id = u.id 
                           WHERE pr.token = ? AND pr.expires_at > NOW() AND pr.used = 0");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $reset = $result->fetch_assoc();
    
    if (!$reset) {
        $error = 'El enlace de recuperación ha expirado o es inválido';
    }
}

// Procesar el formulario de nueva contraseña
if ($_POST && !$error) {
    $new_password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    if (strlen($new_password) < 6) {
        $error = 'La contraseña debe tener al menos 6 caracteres';
    } elseif ($new_password !== $confirm_password) {
        $error = 'Las contraseñas no coinciden';
    } else {
        try {
            // Actualizar contraseña
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->bind_param("si", $hashed_password, $reset['user_id']);
            $stmt->execute();
            
            // Marcar token como usado
            $stmt = $conn->prepare("UPDATE password_resets SET used = 1 WHERE token = ?");
            $stmt->bind_param("s", $token);
            $stmt->execute();
            
            $success = 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.';
        } catch (Exception $e) {
            $error = 'Error al actualizar la contraseña';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer Contraseña - Workflow</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <style>
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .reset-container {
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(37,99,235,0.10);
            padding: 2.5rem 2rem 2rem 2rem;
            max-width: 400px;
            width: 100%;
            margin: 2rem auto;
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            animation: fadeInUp 0.7s cubic-bezier(.39,.575,.56,1.000);
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: none; }
        }
        .reset-icon {
            background: linear-gradient(135deg,rgb(5, 80, 150) 60%,rgb(5, 80, 150) 100%);
            color: #fff;
            border-radius: 50%;
            width: 70px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.3rem;
            box-shadow: 0 4px 16px rgba(16,185,129,0.13);
            margin-bottom: 1.2rem;
        }
        .reset-container h2 {
            color: #10b981;
            margin-bottom: 0.7rem;
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
        }
        .reset-container p {
            color: #64748b;
            margin-bottom: 2rem;
            text-align: center;
            font-size: 1.05rem;
        }
        .reset-form {
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
            width: 100%;
        }
        .reset-form input[type="password"] {
            padding: 0.9rem 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            background: #f8fafc;
            transition: border 0.2s;
        }
        .reset-form input[type="password"]:focus {
            border-color:rgb(5, 80, 150);
            outline: none;
        }
        .reset-form button {
            padding: 0.9rem 1rem;
            background: linear-gradient(90deg,rgb(5, 80, 150) 60%,rgb(5, 80, 150) 100%);
            color: #fff;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
            box-shadow: 0 2px 8px rgba(16,185,129,0.08);
        }
        .reset-form button:hover {
            background: linear-gradient(90deg,rgb(5, 80, 150) 60%,rgb(5, 80, 150) 100%);
            transform: translateY(-2px) scale(1.03);
        }
        .message {
            margin-top: 1.2rem;
            text-align: center;
            font-size: 1rem;
            min-height: 1.5em;
        }
        .message.success { color:rgb(5, 80, 150); }
        .message.error { color: #ef4444; }
        .back-login {
            margin-top: 2rem;
            text-align: center;
        }
        .back-login a {
            color:rgb(5, 80, 150);
            text-decoration: underline;
            font-size: 1rem;
            transition: color 0.2s;
        }
        .back-login a:hover {
            color:rgb(5, 80, 150);
        }
        .password-requirements {
            font-size: 0.85rem;
            color: #64748b;
            margin-top: 0.5rem;
        }
        @media (max-width: 600px) {
            .reset-container { padding: 1.5rem 0.5rem; }
        }
    </style>
</head>
<body>
    <div class="reset-container">
        <div class="reset-icon">
            <i class="fas fa-key"></i>
        </div>
        
        <?php if ($error): ?>
            <h2>Error</h2>
            <p><?php echo htmlspecialchars($error); ?></p>
            <div class="back-login">
                <a href="index.html"><i class="fas fa-arrow-left"></i> Volver al inicio</a>
            </div>
        <?php elseif ($success): ?>
            <h2>¡Éxito!</h2>
            <p><?php echo htmlspecialchars($success); ?></p>
            <div class="back-login">
                <a href="index.html"><i class="fas fa-sign-in-alt"></i> Ir al inicio de sesión</a>
            </div>
        <?php else: ?>
            <h2>Nueva Contraseña</h2>
            <p>Hola <?php echo htmlspecialchars($reset['name']); ?>, ingresa tu nueva contraseña:</p>
            
            <form class="reset-form" method="POST">
                <input type="password" name="password" placeholder="Nueva contraseña" required minlength="6">
                <input type="password" name="confirm_password" placeholder="Confirmar contraseña" required minlength="6">
                <button type="submit">Cambiar Contraseña</button>
                <div class="password-requirements">
                    La contraseña debe tener al menos 6 caracteres
                </div>
            </form>
            
            <div class="message" id="message"></div>
            
            <div class="back-login">
                <a href="index.html"><i class="fas fa-arrow-left"></i> Volver al inicio</a>
            </div>
        <?php endif; ?>
    </div>
    
    <script>
    // Validación en tiempo real
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.querySelector('.reset-form');
        const messageDiv = document.getElementById('message');
        
        if (form) {
            form.addEventListener('submit', function(e) {
                const password = form.querySelector('input[name="password"]').value;
                const confirmPassword = form.querySelector('input[name="confirm_password"]').value;
                
                if (password.length < 6) {
                    e.preventDefault();
                    messageDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
                    messageDiv.className = 'message error';
                    return;
                }
                
                if (password !== confirmPassword) {
                    e.preventDefault();
                    messageDiv.textContent = 'Las contraseñas no coinciden';
                    messageDiv.className = 'message error';
                    return;
                }
                
                messageDiv.textContent = '';
                messageDiv.className = 'message';
            });
        }
    });
    </script>
</body>
</html> 