-- Tabla para las aplicaciones a empleos
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    cover_letter TEXT NOT NULL,
    expected_salary VARCHAR(100),
    availability VARCHAR(50),
    additional_info TEXT,
    status ENUM('pending', 'reviewing', 'interview', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para mejorar el rendimiento
    INDEX idx_user_id (user_id),
    INDEX idx_job_id (job_id),
    INDEX idx_status (status),
    INDEX idx_applied_at (applied_at),
    
    -- Clave única para evitar aplicaciones duplicadas
    UNIQUE KEY unique_user_job (user_id, job_id),
    
    -- Claves foráneas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios sobre la tabla
-- Esta tabla almacena todas las aplicaciones que los usuarios hacen a los empleos
-- Cada aplicación tiene un estado que puede ser: pendiente, en revisión, entrevista, aceptada o rechazada
-- Se evita que un usuario aplique dos veces al mismo empleo con la clave única 