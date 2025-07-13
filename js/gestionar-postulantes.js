// Gestión de Postulantes
let currentJob = null;
let currentApplications = [];
let allApplications = [];

// Elementos del DOM
const jobSelector = document.getElementById('job-selector');
const loadApplicationsBtn = document.getElementById('load-applications-btn');
const jobInfo = document.getElementById('job-info');
const selectedJobTitle = document.getElementById('selected-job-title');
const selectedJobDetails = document.getElementById('selected-job-details');
const applicationsSummary = document.getElementById('applications-summary');
const emptyState = document.getElementById('empty-state');
const applicationsFilters = document.getElementById('applications-filters');
const applicationsList = document.getElementById('applications-list');
const statusFilter = document.getElementById('status-filter');
const searchCandidate = document.getElementById('search-candidate');

// Elementos de estadísticas
const totalApplicationsEl = document.getElementById('total-applications');
const pendingApplicationsEl = document.getElementById('pending-applications');
const reviewingApplicationsEl = document.getElementById('reviewing-applications');
const interviewApplicationsEl = document.getElementById('interview-applications');
const acceptedApplicationsEl = document.getElementById('accepted-applications');
const rejectedApplicationsEl = document.getElementById('rejected-applications');

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando gestión de postulantes...');
    
    // Verificar autenticación
    checkAuthentication();
    
    // Cargar empleos de la empresa
    loadCompanyJobs();
    
    // Event listeners
    setupEventListeners();
});

async function checkAuthentication() {
    try {
        const response = await fetch('../backend/session_status.php', { credentials: 'include' });
        const data = await response.json();
        
        if (!data.logged_in || data.user.userType !== 'empresa') {
            console.log('❌ No autenticado como empresa, redirigiendo...');
            window.location.href = '../index.html';
            return;
        }
        
        console.log('✅ Autenticado como empresa:', data.user);
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        window.location.href = '../index.html';
    }
}

async function loadCompanyJobs() {
    try {
        console.log('🔄 Cargando empleos de la empresa...');
        const response = await fetch('../backend/get_company_jobs_for_selector.php', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Empleos cargados:', data.jobs.length);
            populateJobSelector(data.jobs);
        } else {
            console.error('❌ Error cargando empleos:', data.message);
            showMessage('Error cargando empleos: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showMessage('Error de conexión al cargar empleos', 'error');
    }
}

function populateJobSelector(jobs) {
    jobSelector.innerHTML = '<option value="">Selecciona un empleo...</option>';
    
    jobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = `${job.title} - ${job.location}`;
        jobSelector.appendChild(option);
    });
    
    console.log('✅ Selector de empleos poblado con', jobs.length, 'empleos');
}

function setupEventListeners() {
    // Cambio en el selector de empleo
    jobSelector.addEventListener('change', function() {
        const selectedJobId = this.value;
        if (selectedJobId) {
            loadApplicationsBtn.disabled = false;
            showJobInfo(selectedJobId);
        } else {
            loadApplicationsBtn.disabled = true;
            hideJobInfo();
        }
    });
    
    // Botón para cargar aplicaciones
    loadApplicationsBtn.addEventListener('click', function() {
        const selectedJobId = jobSelector.value;
        if (selectedJobId) {
            loadJobApplications(selectedJobId);
        }
    });
    
    // Filtros
    statusFilter.addEventListener('change', filterApplications);
    searchCandidate.addEventListener('input', filterApplications);
}

function showJobInfo(jobId) {
    const selectedOption = jobSelector.options[jobSelector.selectedIndex];
    const jobTitle = selectedOption.textContent.split(' - ')[0];
    const jobLocation = selectedOption.textContent.split(' - ')[1];
    
    selectedJobTitle.textContent = jobTitle;
    selectedJobDetails.textContent = `📍 ${jobLocation} | ID: ${jobId}`;
    jobInfo.style.display = 'block';
}

function hideJobInfo() {
    jobInfo.style.display = 'none';
}

async function loadJobApplications(jobId) {
    try {
        console.log('🔄 Cargando aplicaciones para empleo:', jobId);
        loadApplicationsBtn.disabled = true;
        loadApplicationsBtn.textContent = 'Cargando...';
        
        const response = await fetch(`../backend/get_job_applications.php?job_id=${jobId}`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Aplicaciones cargadas:', data.applications.length);
            currentJob = data.job;
            currentApplications = data.applications;
            allApplications = [...data.applications]; // Copia para filtros
            
            displayApplications(data.applications, data.statistics);
            showApplicationsSummary(data.statistics);
        } else {
            console.error('❌ Error cargando aplicaciones:', data.message);
            showMessage('Error cargando aplicaciones: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showMessage('Error de conexión al cargar aplicaciones', 'error');
    } finally {
        loadApplicationsBtn.disabled = false;
        loadApplicationsBtn.textContent = 'Cargar Postulantes';
    }
}

function displayApplications(applications, statistics) {
    if (applications.length === 0) {
        showEmptyState('No hay aplicaciones para este empleo');
        return;
    }
    
    // Ocultar estado vacío y mostrar lista
    emptyState.style.display = 'none';
    applicationsFilters.style.display = 'block';
    applicationsList.style.display = 'block';
    
    // Renderizar aplicaciones como tarjetas
    applicationsList.innerHTML = applications.map(app => `
        <div class="col-lg-6 col-xl-4">
            <div class="card application-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="candidate-avatar me-3">
                            ${app.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="candidate-info flex-grow-1">
                            <h6 class="mb-1">${app.name}</h6>
                            <small class="text-muted">${app.email}</small>
                        </div>
                        <div class="application-actions">
                            <select class="form-select form-select-sm status-selector" onchange="updateApplicationStatus(${app.id}, this.value)">
                                <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="reviewing" ${app.status === 'reviewing' ? 'selected' : ''}>En Revisión</option>
                                <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Entrevista</option>
                                <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Aceptado</option>
                                <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rechazado</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="application-meta mb-3">
                        <div class="row g-2">
                            <div class="col-6">
                                <small><i class="bi bi-geo-alt"></i> ${app.location || 'No especificada'}</small>
                            </div>
                            <div class="col-6">
                                <small><i class="bi bi-telephone"></i> ${app.phone || 'No especificado'}</small>
                            </div>
                            <div class="col-6">
                                <small><i class="bi bi-currency-dollar"></i> ${app.expected_salary || 'No especificado'}</small>
                            </div>
                            <div class="col-6">
                                <small><i class="bi bi-calendar"></i> ${formatDate(app.applied_at)}</small>
                            </div>
                        </div>
                    </div>
                    
                    ${app.bio ? `
                        <div class="mb-3">
                            <small class="text-muted">📝 Biografía:</small>
                            <p class="mb-0 small">${app.bio.length > 100 ? app.bio.substring(0, 100) + '...' : app.bio}</p>
                        </div>
                    ` : ''}
                    
                    ${app.cover_letter ? `
                        <div class="mb-3">
                            <small class="text-muted">💼 Carta de Presentación:</small>
                            <div class="cover-letter-preview">${app.cover_letter.length > 150 ? app.cover_letter.substring(0, 150) + '...' : app.cover_letter}</div>
                        </div>
                    ` : ''}
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge badge-${app.status}">${getStatusText(app.status)}</span>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewApplicationDetails(${app.id})">
                            👁️ Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Aplicaciones renderizadas como tarjetas:', applications.length);
}

function showApplicationsSummary(statistics) {
    totalApplicationsEl.textContent = statistics.total;
    pendingApplicationsEl.textContent = statistics.pending;
    reviewingApplicationsEl.textContent = statistics.reviewing;
    interviewApplicationsEl.textContent = statistics.interview;
    acceptedApplicationsEl.textContent = statistics.accepted || 0;
    rejectedApplicationsEl.textContent = statistics.rejected || 0;
    
    applicationsSummary.style.display = 'flex';
}

function showEmptyState(message) {
    emptyState.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h4 class="text-muted">📋 ${message}</h4>
                <p class="text-muted">No hay postulantes que coincidan con los criterios seleccionados</p>
            </div>
        </div>
    `;
    emptyState.style.display = 'block';
    applicationsFilters.style.display = 'none';
    applicationsList.style.display = 'none';
    applicationsSummary.style.display = 'none';
}

function filterApplications() {
    const statusFilterValue = statusFilter.value;
    const searchValue = searchCandidate.value.toLowerCase();
    
    let filteredApplications = allApplications;
    
    // Filtrar por estado
    if (statusFilterValue) {
        filteredApplications = filteredApplications.filter(app => app.status === statusFilterValue);
    }
    
    // Filtrar por búsqueda
    if (searchValue) {
        filteredApplications = filteredApplications.filter(app => 
            app.name.toLowerCase().includes(searchValue) ||
            app.email.toLowerCase().includes(searchValue) ||
            (app.location && app.location.toLowerCase().includes(searchValue))
        );
    }
    
    // Mostrar resultados filtrados
    if (filteredApplications.length === 0) {
        showEmptyState('No hay aplicaciones que coincidan con los filtros');
    } else {
        displayApplications(filteredApplications, {
            total: filteredApplications.length,
            pending: filteredApplications.filter(app => app.status === 'pending').length,
            reviewing: filteredApplications.filter(app => app.status === 'reviewing').length,
            interview: filteredApplications.filter(app => app.status === 'interview').length,
            accepted: filteredApplications.filter(app => app.status === 'accepted').length,
            rejected: filteredApplications.filter(app => app.status === 'rejected').length
        });
    }
}

async function updateApplicationStatus(applicationId, newStatus) {
    try {
        console.log('🔄 Actualizando estado de aplicación:', applicationId, '->', newStatus);
        
        const response = await fetch('../backend/update_application_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                application_id: applicationId,
                status: newStatus
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Estado actualizado correctamente');
            showMessage('Estado de aplicación actualizado correctamente', 'success');
            
            // Actualizar la aplicación en el array local
            const appIndex = allApplications.findIndex(app => app.id === applicationId);
            if (appIndex !== -1) {
                allApplications[appIndex].status = newStatus;
                currentApplications[appIndex].status = newStatus;
            }
            
            // Recargar aplicaciones para actualizar estadísticas
            if (currentJob) {
                loadJobApplications(currentJob.id);
            }
        } else {
            console.error('❌ Error actualizando estado:', data.message);
            showMessage('Error actualizando estado: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showMessage('Error de conexión al actualizar estado', 'error');
    }
}

function viewApplicationDetails(applicationId) {
    const application = allApplications.find(app => app.id === applicationId);
    if (!application) {
        showMessage('Aplicación no encontrada', 'error');
        return;
    }
    
    const modalBody = document.getElementById('applicationModalBody');
    modalBody.innerHTML = `
        <div class="candidate-section">
            <h3>👤 Información del Candidato</h3>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Nombre:</strong> ${application.name}</p>
                    <p><strong>Email:</strong> ${application.email}</p>
                    <p><strong>Teléfono:</strong> ${application.phone || 'No especificado'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Ubicación:</strong> ${application.location || 'No especificada'}</p>
                    <p><strong>Salario Esperado:</strong> ${application.expected_salary || 'No especificado'}</p>
                    <p><strong>Disponibilidad:</strong> ${application.availability || 'No especificada'}</p>
                </div>
            </div>
            ${application.bio ? `
                <div class="mt-3">
                    <strong>Biografía:</strong>
                    <div class="application-details">${application.bio}</div>
                </div>
            ` : ''}
        </div>
        
        ${application.cover_letter ? `
            <div class="application-section">
                <h3>💼 Carta de Presentación</h3>
                <div class="cover-letter-content">${application.cover_letter}</div>
            </div>
        ` : ''}
        
        <div class="application-section">
            <h3>📊 Información de la Aplicación</h3>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Estado Actual:</strong> <span class="badge badge-${application.status}">${getStatusText(application.status)}</span></p>
                    <p><strong>Fecha de Aplicación:</strong> ${formatDate(application.applied_at)}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>ID de Aplicación:</strong> ${application.id}</p>
                    <p><strong>Empleo:</strong> ${currentJob ? currentJob.title : 'N/A'}</p>
                </div>
            </div>
        </div>
    `;
    
    // Mostrar modal usando Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('applicationModal'));
    modal.show();
}

function getStatusBadge(status) {
    return `<span class="badge badge-${status}">${getStatusText(status)}</span>`;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'reviewing': 'En Revisión',
        'interview': 'Entrevista',
        'accepted': 'Aceptado',
        'rejected': 'Rechazado'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showMessage(message, type = 'info') {
    // Crear elemento de mensaje
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} alert-dismissible fade show`;
    messageEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar al inicio del main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageEl, mainContent.firstChild);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
} 