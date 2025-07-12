<?php
// Configuración de email para cPanel
// Personaliza estos valores según tu configuración de cPanel

// Configuración del servidor SMTP (opcional, si quieres usar SMTP en lugar de mail())
define('SMTP_HOST', 'localhost'); // o tu servidor SMTP
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'workflow@workflow.estuclan.com'); // Tu email corporativo
define('SMTP_PASSWORD', 'DhxsLB(60g(F@pF='); // Contraseña del email
define('SMTP_SECURE', 'tls'); // tls o ssl

// Configuración del remitente
define('FROM_EMAIL', 'workflow@workflow.estuclan.com'); // Cambia por tu dominio real
define('FROM_NAME', 'Workflow - Consultoría de RRHH');
define('REPLY_TO_EMAIL', 'soporte@workflow.estuclan.com'); // Email de soporte

// Configuración de la aplicación
define('APP_NAME', 'Workflow');
define('APP_URL', 'https://workflow.estuclan.com'); // Cambia por tu dominio real

// Función para enviar email usando configuración de cPanel
function sendEmail($to_email, $to_name, $subject, $message) {
    // Headers para email HTML
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: " . FROM_NAME . " <" . FROM_EMAIL . ">" . "\r\n";
    $headers .= "Reply-To: " . REPLY_TO_EMAIL . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Enviar email usando la función mail() de PHP (funciona con cPanel)
    return mail($to_email, $subject, $message, $headers);
}

// Función alternativa usando PHPMailer (si lo tienes instalado)
function sendEmailWithPHPMailer($to_email, $to_name, $subject, $message) {
    // Requiere PHPMailer instalado
    // require_once 'PHPMailer/PHPMailer.php';
    // require_once 'PHPMailer/SMTP.php';
    
    /*
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    
    try {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port = SMTP_PORT;
        
        $mail->setFrom(FROM_EMAIL, FROM_NAME);
        $mail->addAddress($to_email, $to_name);
        $mail->addReplyTo(REPLY_TO_EMAIL, FROM_NAME);
        
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;
        
        return $mail->send();
    } catch (Exception $e) {
        return false;
    }
    */
    
    // Por ahora, usar la función mail() básica
    return sendEmail($to_email, $to_name, $subject, $message);
}
?> 