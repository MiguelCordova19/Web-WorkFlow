let currentJobs = [];
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

// Nueva función para cargar empleos desde la base de datos
async function loadJobsFromBackendAndSearch() {
    try {
        const res = await fetch('backend/get_jobs.php');
        const data = await res.json();
        if (data.success) {
            currentJobs = data.jobs;
            performSearch();
        } else {
            searchResults.innerHTML = '<p class="text-center">No se pudieron cargar los empleos.</p>';
        }
    } catch (err) {
        searchResults.innerHTML = '<p class="text-center">Error de conexión al cargar empleos.</p>';
    }
}

// Modifica performSearch para filtrar sobre currentJobs
function performSearch() {
    const params = getSearchParams();
    const filteredJobs = filterJobs(currentJobs, params);
    renderJobs(filteredJobs);
    updateResultsCount(filteredJobs.length);
    // Limpiar selección si no hay resultados
    if (filteredJobs.length === 0) {
        clearJobDetails();
    } else if (selectedJobId && !filteredJobs.find(job => job.id === selectedJobId)) {
        // Si el trabajo seleccionado ya no está en los resultados, seleccionar el primero
        selectJob(filteredJobs[0].id);
    }
}

// Modifica updateResultsCount para recibir el número de resultados
function updateResultsCount(count) {
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
    const job = currentJobs.find(j => j.id == jobId);
    if (!job) return;

    let requisitos = job.requirements ? `<ul class='details-list'>${job.requirements.split('\n').map(r => `<li><span class='details-icon'>✔️</span> ${r}</li>`).join('')}</ul>` : '';
    let beneficios = job.benefits ? `<ul class='details-list'>${job.benefits.split('\n').map(b => `<li><span class='details-icon'>🎁</span> ${b}</li>`).join('')}</ul>` : '';
    let skills = job.skills ? job.skills.split(',').map(s => `<span class=\"skill-chip\">${s.trim()}</span>`).join(' ') : '';
    let salario = '';
    if (job.salary_min && job.salary_max) {
        salario = `${job.currency === 'USD' ? 'US$' : 'S/'} ${job.salary_min} - ${job.salary_max}`;
    } else if (job.salary_min) {
        salario = `Desde ${job.currency === 'USD' ? 'US$' : 'S/'} ${job.salary_min}`;
    } else if (job.salary_max) {
        salario = `Hasta ${job.currency === 'USD' ? 'US$' : 'S/'} ${job.salary_max}`;
    } else {
        salario = 'A convenir';
    }

    // Verificar si el usuario está logueado y si ya postuló
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let hasApplied = false;
    let actionsHtml = '';
    if (!currentUser) {
        actionsHtml = `<button class=\"btn btn-primary btn-lg btn-apply-now\" id=\"apply-now-btn\">Inicia sesión para postular</button>`;
    } else if (currentUser.userType !== 'candidato') {
        actionsHtml = `<div class=\"message message-warning\">Solo los candidatos pueden postular a empleos.</div>`;
    } else {
        if (currentUser.applications && Array.isArray(currentUser.applications)) {
            hasApplied = currentUser.applications.includes(String(jobId)) || currentUser.applications.includes(Number(jobId));
        }
        if (hasApplied) {
            actionsHtml = `<div class=\"postulado-exito\">
                <div class=\"exito-animacion\">
                    <svg class=\"exito-check\" viewBox=\"0 0 52 52\"><circle class=\"exito-circle\" cx=\"26\" cy=\"26\" r=\"25\" fill=\"none\"/><path class=\"exito-checkmark\" fill=\"none\" d=\"M14 27l7 7 16-16\"/></svg>
                </div>
                <h2>¡Postulado con Éxito!</h2>
                <p>Tu postulación ha sido enviada correctamente.</p>
                <button class=\"btn btn-outline btn-undo\" id=\"btn-undo-postulacion\">Deshacer postulación</button>
            </div>`;
        } else {
            actionsHtml = `<button class=\"btn btn-primary btn-lg btn-apply-now\" id=\"apply-now-btn\">Postular Ahora</button>`;
        }
    }

    document.getElementById('job-details').innerHTML = `
        <div class=\"job-details-card\">
            <div class=\"job-details-header\">
                <h2 class=\"job-details-title\">${job.title}</h2>
                <div class=\"job-details-company-row\">
                    <span class=\"job-details-company\"><b>${job.company_name || ''}</b></span>
                    <span class=\"job-details-location\">📍 ${job.location || ''}</span>
                </div>
                <div class=\"job-details-meta-row\">
                    <span class=\"job-details-type badge\">${job.type || ''}</span>
                    <span class=\"job-details-salary badge\">${salario}</span>
                    <span class=\"job-details-date\">Publicado: ${job.created_at ? new Date(job.created_at).toLocaleDateString() : ''}</span>
                </div>
            </div>
            <div class=\"job-details-section\">
                <h4>Descripción</h4>
                <p>${job.description || 'No especificada.'}</p>
            </div>
            <div class=\"job-details-section\">
                <h4>Requisitos</h4>
                ${requisitos || '<p>No especificados.</p>'}
            </div>
            <div class=\"job-details-section\">
                <h4>Beneficios</h4>
                ${beneficios || '<p>No especificados.</p>'}
            </div>
            <div class=\"job-details-section\">
                <h4>Habilidades</h4>
                <div class=\"skills-row\">${skills || 'No especificadas.'}</div>
            </div>
            <div class=\"job-details-section\">
                <div class=\"row\">
                    <div class=\"col\">
                        <h5>Experiencia</h5>
                        <p>${job.experience_level || 'No especificada.'}</p>
                    </div>
                    <div class=\"col\">
                        <h5>Nivel Educativo</h5>
                        <p>${job.education_level || 'No especificado.'}</p>
                    </div>
                </div>
            </div>
            <div class=\"job-details-section\">
                <div class=\"row\">
                    <div class=\"col\">
                        <h5>Fecha Límite</h5>
                        <p>${job.deadline || 'No especificada.'}</p>
                    </div>
                    <div class=\"col\">
                        <h5>Email para Aplicar</h5>
                        <p>${job.application_email || 'No especificado.'}</p>
                    </div>
                </div>
            </div>
            <div class=\"job-details-actions\">
                ${actionsHtml}
            </div>
        </div>
    `;

    // Acción del botón de postular
    const applyBtn = document.getElementById('apply-now-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            if (!currentUser) {
                alert('Debes iniciar sesión para postular a este empleo');
                return;
            }
            if (currentUser.userType !== 'candidato') {
                alert('Solo los candidatos pueden postular a empleos');
                return;
            }
            if (!currentUser.applications) currentUser.applications = [];
            if (!currentUser.applications.includes(String(jobId))) {
                currentUser.applications.push(String(jobId));
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                // Actualizar usuarios globales si existen
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex] = currentUser;
                    localStorage.setItem('users', JSON.stringify(users));
                }
                renderJobDetails(jobId);
            }
        });
    }
    // Acción del botón de deshacer postulación
    const undoBtn = document.getElementById('btn-undo-postulacion');
    if (undoBtn) {
        undoBtn.addEventListener('click', function() {
            if (!currentUser || !currentUser.applications) return;
            currentUser.applications = currentUser.applications.filter(id => String(id) !== String(jobId));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            // Actualizar usuarios globales si existen
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('users', JSON.stringify(users));
            }
            renderJobDetails(jobId);
        });
    }
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
    loadJobsFromBackendAndSearch();
    
    // Seleccionar el primer trabajo si hay resultados
    if (currentJobs.length > 0) {
        selectJob(currentJobs[0].id);
    }
}); 