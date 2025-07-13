-- Tabla para los tests de habilidades
CREATE TABLE IF NOT EXISTS skill_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit INT DEFAULT 60, -- tiempo en minutos
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Tabla para las preguntas de los tests
CREATE TABLE IF NOT EXISTS test_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('open_ended', 'multiple_choice', 'true_false') DEFAULT 'open_ended',
    points INT DEFAULT 10,
    order_index INT DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES skill_tests(id) ON DELETE CASCADE
);

-- Tabla para las asignaciones de tests a candidatos
CREATE TABLE IF NOT EXISTS test_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT NOT NULL,
    user_id INT NOT NULL,
    job_id INT,
    assigned_by INT NOT NULL, -- ID de la empresa que asigna
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NULL,
    status ENUM('assigned', 'in_progress', 'completed', 'expired') DEFAULT 'assigned',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    total_score DECIMAL(5,2) NULL,
    max_score INT NULL,
    FOREIGN KEY (test_id) REFERENCES skill_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES companies(id) ON DELETE CASCADE
);

-- Tabla para las respuestas de los candidatos
CREATE TABLE IF NOT EXISTS test_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT,
    answer_choice VARCHAR(255), -- para preguntas de opción múltiple
    points_earned DECIMAL(5,2) DEFAULT 0,
    max_points DECIMAL(5,2) DEFAULT 10,
    reviewer_notes TEXT,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES test_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES companies(id) ON DELETE SET NULL
);

-- Tabla para las plantillas de tests predefinidos
CREATE TABLE IF NOT EXISTS test_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'programming', 'design', 'marketing', etc.
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para las preguntas de las plantillas
CREATE TABLE IF NOT EXISTS template_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('open_ended', 'multiple_choice', 'true_false') DEFAULT 'open_ended',
    points INT DEFAULT 10,
    order_index INT DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES test_templates(id) ON DELETE CASCADE
);

-- Insertar algunas plantillas predefinidas
INSERT INTO test_templates (name, category, description) VALUES
('Test de Programación Frontend', 'programming', 'Evaluación de habilidades en HTML, CSS y JavaScript'),
('Test de Diseño UX/UI', 'design', 'Evaluación de habilidades en diseño de interfaces y experiencia de usuario'),
('Test de Marketing Digital', 'marketing', 'Evaluación de conocimientos en marketing digital y redes sociales'),
('Test de Gestión de Proyectos', 'management', 'Evaluación de habilidades en gestión y liderazgo de equipos'),
('Test de Ventas', 'sales', 'Evaluación de técnicas de ventas y comunicación');

-- Insertar preguntas para el test de programación frontend
INSERT INTO template_questions (template_id, question_text, points, order_index) VALUES
(1, 'Describe tu experiencia con frameworks de JavaScript como React, Vue o Angular. ¿Cuál prefieres y por qué?', 20, 1),
(1, 'Explica cómo implementarías un diseño responsive para una aplicación web. ¿Qué técnicas usarías?', 15, 2),
(1, '¿Cómo optimizarías el rendimiento de una aplicación web? Menciona al menos 3 técnicas específicas.', 15, 3),
(1, 'Describe un proyecto complejo que hayas desarrollado. ¿Qué desafíos enfrentaste y cómo los resolviste?', 25, 4),
(1, '¿Cómo manejarías la seguridad en una aplicación web? Menciona las mejores prácticas que conoces.', 15, 5);

-- Insertar preguntas para el test de diseño UX/UI
INSERT INTO template_questions (template_id, question_text, points, order_index) VALUES
(2, 'Describe tu proceso de diseño desde la investigación hasta la implementación. ¿Qué metodologías usas?', 25, 1),
(2, '¿Cómo definirías el público objetivo para una aplicación de e-commerce? ¿Qué factores considerarías?', 20, 2),
(2, 'Explica cómo crearías un sistema de diseño. ¿Qué componentes incluirías y por qué?', 20, 3),
(2, 'Describe un proyecto donde hayas mejorado significativamente la experiencia de usuario. ¿Qué cambios hiciste?', 25, 4),
(2, '¿Cómo evaluarías la usabilidad de una aplicación? Menciona las herramientas y métodos que usarías.', 10, 5);

-- Insertar preguntas para el test de marketing digital
INSERT INTO template_questions (template_id, question_text, points, order_index) VALUES
(3, 'Describe una campaña de marketing digital exitosa que hayas ejecutado. ¿Qué estrategias usaste?', 25, 1),
(3, '¿Cómo medirías el ROI de una campaña en redes sociales? ¿Qué métricas serían importantes?', 20, 2),
(3, 'Explica tu estrategia para aumentar el engagement en redes sociales. ¿Qué contenido funciona mejor?', 20, 3),
(3, '¿Cómo optimizarías una campaña de Google Ads? ¿Qué factores considerarías?', 15, 4),
(3, 'Describe cómo crearías una estrategia de contenido para una marca. ¿Qué canales usarías?', 20, 5); 