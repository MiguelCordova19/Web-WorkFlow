# Sistema de Recuperación de Contraseña - Configuración

## 📋 Requisitos Previos

1. **cPanel con acceso a Email**
2. **Base de datos MySQL**
3. **PHP con función mail() habilitada**

## 🗄️ Paso 1: Crear la Tabla en la Base de Datos

Ejecuta este SQL en phpMyAdmin:

```sql
-- Tabla para almacenar tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  KEY `expires_at` (`expires_at`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar rendimiento
CREATE INDEX idx_password_resets_token_expires ON password_resets(token, expires_at);
CREATE INDEX idx_password_resets_user_expires ON password_resets(user_id, expires_at);
```

## 📧 Paso 2: Configurar Email en cPanel

### 2.1 Crear Email Corporativo

1. Ve a **cPanel > Email Accounts**
2. Crea un nuevo email: `noreply@tudominio.com`
3. Crea otro email: `soporte@tudominio.com`

### 2.2 Configurar el Archivo de Email

Edita `backend/email_config.php`:

```php
// Cambia estos valores por tu dominio real
define('FROM_EMAIL', 'noreply@tudominio.com'); // Tu email corporativo
define('FROM_NAME', 'Workflow - Consultoría de RRHH');
define('REPLY_TO_EMAIL', 'soporte@tudominio.com');

// Tu dominio real
define('APP_URL', 'https://tudominio.com');
```

## 🔧 Paso 3: Configurar Dominio

### 3.1 Actualizar URLs

En `backend/recover_password.php`, línea 35:
```php
$reset_link = "https://" . $_SERVER['HTTP_HOST'] . "/reset_password.php?token=" . $token;
```

### 3.2 Verificar Rutas

Asegúrate de que estos archivos estén en la raíz de tu sitio:
- `reset_password.php` (en la raíz)
- `backend/recover_password.php`
- `backend/email_config.php`

## 🧪 Paso 4: Probar el Sistema

### 4.1 Probar desde el Frontend

1. Ve a `html/recover-password.html`
2. Ingresa un email válido
3. Verifica que llegue el email

### 4.2 Probar Email Manualmente

Crea un archivo de prueba `test_email.php`:

```php
<?php
require_once 'backend/email_config.php';

$test_email = "tu-email@ejemplo.com";
$test_name = "Usuario de Prueba";
$test_subject = "Prueba de Email - Workflow";
$test_message = "<h1>Prueba de Email</h1><p>Si ves este mensaje, el sistema funciona correctamente.</p>";

if (sendEmail($test_email, $test_name, $test_subject, $test_message)) {
    echo "Email enviado correctamente";
} else {
    echo "Error al enviar email";
}
?>
```

## 🔒 Paso 5: Configuraciones de Seguridad

### 5.1 Configurar Headers de Seguridad

Agrega esto a tu `.htaccess`:

```apache
# Headers de seguridad
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### 5.2 Configurar Rate Limiting (Opcional)

Para evitar spam, puedes agregar límites de intentos:

```php
// En recover_password.php, antes de procesar
$ip = $_SERVER['REMOTE_ADDR'];
$stmt = $pdo->prepare("SELECT COUNT(*) FROM password_resets WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) AND ip_address = ?");
$stmt->execute([$ip]);
if ($stmt->fetchColumn() > 5) {
    echo json_encode(['success' => false, 'message' => 'Demasiados intentos. Intenta más tarde.']);
    exit;
}
```

## 📱 Paso 6: Personalizar el Email

### 6.1 Cambiar el Diseño del Email

Edita la función `sendRecoveryEmail()` en `backend/recover_password.php`:

```php
$message = "
<html>
<head>
    <style>
        /* Personaliza los estilos aquí */
        body { font-family: Arial, sans-serif; }
        .header { background: #2563eb; color: white; }
        .button { background: #2563eb; color: white; }
    </style>
</head>
<body>
    <!-- Personaliza el contenido aquí -->
</body>
</html>
";
```

### 6.2 Agregar Logo

```php
$message = "
<div class='header'>
    <img src='https://tudominio.com/img/logo.png' alt='Logo' style='height: 50px;'>
    <h1>" . APP_NAME . "</h1>
</div>
";
```

## 🚨 Solución de Problemas

### Problema: Email no llega
**Solución:**
1. Verifica que la función `mail()` esté habilitada en PHP
2. Revisa la carpeta de spam
3. Verifica la configuración de DNS (SPF, DKIM)

### Problema: Error de base de datos
**Solución:**
1. Verifica que la tabla `password_resets` existe
2. Verifica que la tabla `users` existe
3. Verifica las credenciales de la base de datos

### Problema: Enlaces no funcionan
**Solución:**
1. Verifica que `reset_password.php` esté en la raíz
2. Verifica que el dominio esté configurado correctamente
3. Verifica que HTTPS esté habilitado

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de error de PHP
2. Verifica la configuración de cPanel
3. Contacta a tu proveedor de hosting

## ✅ Checklist de Configuración

- [ ] Tabla `password_resets` creada
- [ ] Email corporativo configurado
- [ ] `email_config.php` personalizado
- [ ] URLs actualizadas
- [ ] Sistema probado
- [ ] Seguridad configurada
- [ ] Email personalizado 