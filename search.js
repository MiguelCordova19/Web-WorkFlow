// Datos de ejemplo con información más detallada
const jobsData = [
    {
        id: 1,
        title: "Desarrollador Full Stack",
        company: "TechCorp Perú SAC",
        location: "Lima, Perú",
        salary: "S/ 8,000 - S/ 12,000",
        type: "Tiempo completo",
        category: "tecnologia",
        posted: "Hace 2 días",
        description: "Buscamos un desarrollador Full Stack apasionado por crear soluciones innovadoras. Trabajarás en un equipo dinámico desarrollando aplicaciones web modernas utilizando las últimas tecnologías.",
        requirements: [
            "Experiencia mínima de 3 años en desarrollo web",
            "Conocimientos sólidos en JavaScript, React, Node.js",
            "Experiencia con bases de datos SQL y NoSQL",
            "Conocimientos de Git y metodologías ágiles",
            "Buenas habilidades de comunicación y trabajo en equipo"
        ],
        benefits: [
            "Horario flexible y trabajo remoto",
            "Capacitaciones constantes",
            "Seguro médico privado",
            "Bonos por rendimiento"
        ]
    },
    {
        id: 2,
        title: "Especialista en Marketing Digital",
        company: "MarketingPro Perú",
        location: "Arequipa, Perú",
        salary: "S/ 5,000 - S/ 7,500",
        type: "Tiempo completo",
        category: "marketing",
        posted: "Hace 1 día",
        description: "Únete a nuestro equipo de marketing digital y ayuda a las empresas a crecer en el mundo digital. Desarrollarás estrategias creativas y medibles para diferentes clientes.",
        requirements: [
            "Experiencia de 2+ años en marketing digital",
            "Conocimientos en Google Ads, Facebook Ads",
            "Experiencia con herramientas de analytics",
            "Creatividad y pensamiento estratégico",
            "Excelentes habilidades de comunicación"
        ],
        benefits: [
            "Oportunidades de crecimiento profesional",
            "Capacitaciones en nuevas herramientas",
            "Bonos por resultados",
            "Ambiente de trabajo dinámico"
        ]
    },
    {
        id: 3,
        title: "Gerente de Ventas",
        company: "VentasMax Perú",
        location: "Trujillo, Perú",
        salary: "S/ 10,000 - S/ 15,000",
        type: "Tiempo completo",
        category: "ventas",
        posted: "Hace 3 días",
        description: "Lidera nuestro equipo de ventas y desarrolla estrategias para alcanzar los objetivos comerciales. Serás responsable de supervisar el rendimiento del equipo y mantener relaciones con clientes clave.",
        requirements: [
            "Experiencia de 5+ años en ventas B2B",
            "Experiencia liderando equipos de ventas",
            "Excelentes habilidades de negociación",
            "Conocimientos de CRM y herramientas de ventas",
            "Resultados comprobables en ventas"
        ],
        benefits: [
            "Comisión atractiva sobre ventas",
            "Seguro médico familiar",
            "Vehículo de empresa",
            "Capacitaciones ejecutivas"
        ]
    },
    {
        id: 4,
        title: "Analista Financiero Senior",
        company: "FinanzasCorp Perú",
        location: "Cusco, Perú",
        salary: "S/ 6,500 - S/ 9,000",
        type: "Tiempo completo",
        category: "finanzas",
        posted: "Hace 1 semana",
        description: "Analiza datos financieros, prepara reportes y proporciona insights estratégicos para la toma de decisiones empresariales. Trabajarás en un ambiente dinámico con oportunidades de crecimiento.",
        requirements: [
            "Contador público o afines",
            "Experiencia de 4+ años en análisis financiero",
            "Dominio avanzado de Excel y herramientas financieras",
            "Conocimientos de normas contables",
            "Habilidades analíticas y de comunicación"
        ],
        benefits: [
            "Horario flexible",
            "Capacitaciones en finanzas corporativas",
            "Seguro médico privado",
            "Bonos por rendimiento"
        ]
    },
    {
        id: 5,
        title: "Desarrollador Frontend React",
        company: "StartupTech",
        location: "Buenos Aires, Argentina",
        salary: "$70,000 - $110,000",
        type: "Tiempo completo",
        category: "tecnologia",
        posted: "Hace 2 días",
        description: "Únete a nuestra startup en crecimiento y desarrolla interfaces de usuario excepcionales. Trabajarás con las últimas tecnologías frontend y tendrás la oportunidad de impactar directamente en el producto.",
        requirements: [
            "Experiencia sólida con React y ecosistema moderno",
            "Conocimientos de TypeScript",
            "Experiencia con testing (Jest, React Testing Library)",
            "Conocimientos de diseño responsive",
            "Pasión por crear experiencias de usuario excepcionales"
        ],
        benefits: [
            "Equity en la empresa",
            "Horario flexible y trabajo remoto",
            "Capacitaciones en nuevas tecnologías",
            "Ambiente startup dinámico"
        ]
    },
    {
        id: 6,
        title: "Especialista en SEO",
        company: "DigitalGrow",
        location: "Buenos Aires, Argentina",
        salary: "$55,000 - $80,000",
        type: "Tiempo completo",
        category: "marketing",
        posted: "Hace 1 día",
        description: "Optimiza sitios web para motores de búsqueda y desarrolla estrategias SEO que impulsen el tráfico orgánico. Trabajarás con clientes diversos y tendrás la oportunidad de implementar las mejores prácticas del sector.",
        requirements: [
            "Experiencia de 3+ años en SEO",
            "Conocimientos de herramientas SEO (Ahrefs, SEMrush)",
            "Experiencia con Google Analytics y Search Console",
            "Conocimientos de HTML, CSS básico",
            "Habilidades analíticas y de reportes"
        ],
        benefits: [
            "Capacitaciones en nuevas herramientas SEO",
            "Bonos por resultados de posicionamiento",
            "Horario flexible",
            "Oportunidades de crecimiento"
        ]
    }
];

let currentJobs = [...jobsData];
let selectedJobId = null;

// Elementos del DOM
const searchBtn = document.getElementById('search-btn');
const jobTitleInput = document.getElementById('job-title');
const jobLocationSelect = document.getElementById('job-location');
const jobCategorySelect = document.getElementById('job-category');
const searchResults = document.getElementById('search-results');
const jobDetails = document.getElementById('job-details');
const resultsCount = document.getElementById('results-count');
const noResults = document.getElementById('no-results');

// Funciones de búsqueda y filtrado
function getSearchParams() {
    return {
        title: jobTitleInput.value.trim(),
        location: jobLocationSelect.value,
        category: jobCategorySelect.value
    };
}

function filterJobs(jobs, { title, location, category }) {
    return jobs.filter(job => {
        const matchTitle = title ? job.title.toLowerCase().includes(title.toLowerCase()) : true;
        const matchLocation = location ? job.location.toLowerCase().includes(location.toLowerCase()) : true;
        const matchCategory = category ? job.category === category : true;
        return matchTitle && matchLocation && matchCategory;
    });
}

function performSearch() {
    const params = getSearchParams();
    currentJobs = filterJobs(jobsData, params);
    renderJobs(currentJobs);
    updateResultsCount();
    
    // Limpiar selección si no hay resultados
    if (currentJobs.length === 0) {
        clearJobDetails();
    } else if (selectedJobId && !currentJobs.find(job => job.id === selectedJobId)) {
        // Si el trabajo seleccionado ya no está en los resultados, seleccionar el primero
        selectJob(currentJobs[0].id);
    }
}

function updateResultsCount() {
    const count = currentJobs.length;
    resultsCount.textContent = `${count} empleo${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
}

// Renderizado de trabajos
function renderJobs(jobs) {
    searchResults.innerHTML = '';
    
    if (jobs.length === 0) {
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = `job-card ${selectedJobId === job.id ? 'selected' : ''}`;
        card.dataset.jobId = job.id;
        
        card.innerHTML = `
            <div class="job-card-main">
                <div class="job-card-title">${job.title}</div>
                <div class="job-card-company">${job.company}</div>
                <div class="job-card-meta">
                    <span>📍 ${job.location}</span>
                    <span class="job-card-salary">💰 ${job.salary}</span>
                </div>
            </div>
            <div class="job-card-right">
                <span class="job-type">${job.type}</span>
                <span class="job-posted">${job.posted}</span>
            </div>
        `;
        
        card.addEventListener('click', () => selectJob(job.id));
        searchResults.appendChild(card);
    });
}

// Selección y renderizado de detalles del trabajo
function selectJob(jobId) {
    selectedJobId = jobId;
    
    // Actualizar clases de selección
    document.querySelectorAll('.job-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-job-id="${jobId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Renderizar detalles
    renderJobDetails(jobId);
}

function renderJobDetails(jobId) {
    const job = jobsData.find(j => j.id === jobId);
    if (!job) return;
    
    jobDetails.innerHTML = `
        <div class="job-details-content">
            <div class="job-details-header">
                <h1 class="job-details-title">${job.title}</h1>
                <div class="job-details-company">${job.company}</div>
                <div class="job-details-meta">
                    <div class="job-details-meta-item">
                        <span class="job-details-meta-icon">📍</span>
                        <span class="job-details-meta-text">${job.location}</span>
                    </div>
                    <div class="job-details-meta-item">
                        <span class="job-details-meta-icon">💼</span>
                        <span class="job-details-meta-text">${job.type}</span>
                    </div>
                    <div class="job-details-meta-item">
                        <span class="job-details-meta-icon">📅</span>
                        <span class="job-details-meta-text">${job.posted}</span>
                    </div>
                </div>
                <div class="job-details-salary">💰 ${job.salary}</div>
            </div>
            
            <div class="job-details-description">
                <h4>Descripción del puesto</h4>
                <p>${job.description}</p>
            </div>
            
            <div class="job-details-requirements">
                <h4>Requisitos</h4>
                <ul>
                    ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>
            
            ${job.benefits ? `
            <div class="job-details-requirements">
                <h4>Beneficios</h4>
                <ul>
                    ${job.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            <div class="job-details-actions">
                <button class="btn-apply" onclick="applyToJob(${job.id})">Postular Ahora</button>
                <button class="btn-save" onclick="saveJob(${job.id})">Guardar</button>
            </div>
        </div>
    `;
}

function clearJobDetails() {
    jobDetails.innerHTML = `
        <div class="job-details-placeholder">
            <div class="placeholder-icon">💼</div>
            <h3>Selecciona un empleo</h3>
            <p>Haz clic en cualquier empleo de la lista para ver los detalles completos y postular.</p>
        </div>
    `;
    selectedJobId = null;
}

// Funciones de acción
function applyToJob(jobId) {
    // Verificar si el usuario está logueado
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Debes iniciar sesión para postular a este empleo');
        return;
    }

    // Mostrar ventanita de éxito con animación y botón de deshacer
    jobDetails.innerHTML = `
        <div class="postulado-exito">
            <div class="exito-animacion">
                <svg class="exito-check" viewBox="0 0 52 52"><circle class="exito-circle" cx="26" cy="26" r="25" fill="none"/><path class="exito-checkmark" fill="none" d="M14 27l7 7 16-16"/></svg>
            </div>
            <h2>¡Postulado con Éxito!</h2>
            <p>Tu postulación ha sido enviada correctamente.</p>
            <button class="btn-undo" id="btn-undo-postulacion">Deshacer postulación</button>
        </div>
    `;
    // Evento para deshacer
    document.getElementById('btn-undo-postulacion').onclick = function() {
        renderJobDetails(jobId);
    };
}

function saveJob(jobId) {
    // Verificar si el usuario está logueado
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Debes iniciar sesión para guardar empleos');
        return;
    }
    
    // Obtener empleos guardados
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    
    // Verificar si ya está guardado
    if (savedJobs.includes(jobId)) {
        alert('Este empleo ya está guardado');
        return;
    }
    
    // Guardar empleo
    savedJobs.push(jobId);
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
    alert('Empleo guardado exitosamente');
}

// Event listeners
searchBtn.addEventListener('click', performSearch);

jobTitleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

jobLocationSelect.addEventListener('change', performSearch);
jobCategorySelect.addEventListener('change', performSearch);

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Bootstrap Select
    if (typeof $.fn.selectpicker !== 'undefined') {
        $('#job-location').selectpicker();
    }
    
    // Cargar parámetros de URL si existen
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('title')) {
        jobTitleInput.value = urlParams.get('title');
    }
    if (urlParams.has('location')) {
        jobLocationSelect.value = urlParams.get('location');
    }
    if (urlParams.has('category')) {
        jobCategorySelect.value = urlParams.get('category');
    }
    
    // Realizar búsqueda inicial
    performSearch();
    
    // Seleccionar el primer trabajo si hay resultados
    if (currentJobs.length > 0) {
        selectJob(currentJobs[0].id);
    }
}); 