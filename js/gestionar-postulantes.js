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
const applicationsTable = document.getElementById('applications-table');
const tbodyPostulantes = document.getElementById('tbody-postulantes');
const statusFilter = document.getElementById('status-filter');
const searchCandidate = document.getElementById('search-candidate');

// Elementos de estadísticas
const totalApplicationsEl = document.getElementById('total-applications');
const pendingApplicationsEl = document.getElementById('pending-applications');
const reviewingApplicationsEl = document.getElementById('reviewing-applications');
const interviewApplicationsEl = document.getElementById('interview-applications');

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
        
        if (!data.loggedIn || data.user.userType !== 'empresa') {
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
    
    // Ocultar estado vacío y mostrar tabla
    emptyState.style.display = 'none';
    applicationsTable.style.display = 'table';
    
    // Renderizar aplicaciones
    tbodyPostulantes.innerHTML = applications.map(app => `
        <tr data-application-id="${app.id}">
            <td>
                <div class="candidate-info">
                    <strong>${app.name}</strong>
                    <br>
                    <small>${app.email}</small>
                </div>
            </td>
            <td>${app.email}</td>
            <td>${app.bio ? app.bio.substring(0, 50) + '...' : '-'}</td>
            <td>${app.location || '-'}</td>
            <td>${app.phone || '-'}</td>
            <td>
                <div class="cover-letter-preview">
                    ${app.cover_letter ? app.cover_letter.substring(0, 100) + '...' : '-'}
                </div>
            </td>
            <td>${app.expected_salary || '-'}</td>
            <td>${app.availability || '-'}</td>
            <td>${getStatusBadge(app.status)}</td>
            <td>${formatDate(app.applied_at)}</td>
            <td>
                <div class="application-actions">
                    <button class="btn btn-sm btn-outline" onclick="viewApplicationDetails(${app.id})">
                        👁️ Ver
                    </button>
                    <select class="status-selector" onchange="updateApplicationStatus(${app.id}, this.value)">
                        <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="reviewing" ${app.status === 'reviewing' ? 'selected' : ''}>En Revisión</option>
                        <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Entrevista</option>
                        <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Aceptado</option>
                        <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rechazado</option>
                    </select>
                </div>
            </td>
        </tr>
    `).join('');
    
    console.log('✅ Aplicaciones renderizadas:', applications.length);
}

function showApplicationsSummary(statistics) {
    totalApplicationsEl.textContent = statistics.total;
    pendingApplicationsEl.textContent = statistics.pending;
    reviewingApplicationsEl.textContent = statistics.reviewing;
    interviewApplicationsEl.textContent = statistics.interview;
    
    applicationsSummary.style.display = 'flex';
}

function showEmptyState(message) {
    emptyState.innerHTML = `
        <h4>📋 ${message}</h4>
        <p>No hay postulantes que coincidan con los criterios seleccionados</p>
    `;
    emptyState.style.display = 'block';
    applicationsTable.style.display = 'none';
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
            (app.bio && app.bio.toLowerCase().includes(searchValue))
        );
    }
    
    // Recalcular estadísticas para aplicaciones filtradas
    const filteredStats = {
        total: filteredApplications.length,
        pending: filteredApplications.filter(app => app.status === 'pending').length,
        reviewing: filteredApplications.filter(app => app.status === 'reviewing').length,
        interview: filteredApplications.filter(app => app.status === 'interview').length,
        accepted: filteredApplications.filter(app => app.status === 'accepted').length,
        rejected: filteredApplications.filter(app => app.status === 'rejected').length
    };
    
    displayApplications(filteredApplications, filteredStats);
}

async function updateApplicationStatus(applicationId, newStatus) {
    try {
        console.log('🔄 Actualizando estado de aplicación:', applicationId, 'a', newStatus);
        
        const response = await fetch('../backend/update_application_status.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                application_id: applicationId,
                status: newStatus
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Estado actualizado correctamente');
            showMessage('Estado actualizado correctamente', 'success');
            
            // Actualizar la aplicación en el array local
            const appIndex = allApplications.findIndex(app => app.id === applicationId);
            if (appIndex !== -1) {
                allApplications[appIndex].status = newStatus;
                currentApplications = [...allApplications];
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
    
    // Crear modal con detalles de la aplicación
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>📋 Detalles de la Aplicación</h2>
            <div class="application-details">
                <div class="candidate-section">
                    <h3>👤 Información del Candidato</h3>
                    <p><strong>Nombre:</strong> ${application.name}</p>
                    <p><strong>Email:</strong> ${application.email}</p>
                    <p><strong>Teléfono:</strong> ${application.phone || 'No proporcionado'}</p>
                    <p><strong>Ubicación:</strong> ${application.location || 'No especificada'}</p>
                    <p><strong>Biografía:</strong> ${application.bio || 'No especificada'}</p>
                </div>
                
                <div class="application-section">
                    <h3>📝 Información de la Aplicación</h3>
                    <p><strong>Salario Esperado:</strong> ${application.expected_salary || 'No especificado'}</p>
                    <p><strong>Disponibilidad:</strong> ${application.availability || 'No especificada'}</p>
                    <p><strong>Estado:</strong> ${getStatusBadge(application.status)}</p>
                    <p><strong>Fecha de Aplicación:</strong> ${formatDate(application.applied_at)}</p>
                </div>
                
                <div class="cover-letter-section">
                    <h3>💼 Carta de Presentación</h3>
                    <div class="cover-letter-content">
                        ${application.cover_letter || 'No se proporcionó carta de presentación'}
                    </div>
                </div>
                
                ${application.additional_info ? `
                <div class="additional-info-section">
                    <h3>📄 Información Adicional</h3>
                    <div class="additional-info-content">
                        ${application.additional_info}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        modal.remove();
    };
    
    // Cerrar al hacer clic fuera del modal
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': '<span class="badge badge-pending">Pendiente</span>',
        'reviewing': '<span class="badge badge-reviewing">En Revisión</span>',
        'interview': '<span class="badge badge-interview">Entrevista</span>',
        'accepted': '<span class="badge badge-accepted">Aceptado</span>',
        'rejected': '<span class="badge badge-rejected">Rechazado</span>'
    };
    
    return statusMap[status] || '<span class="badge badge-pending">Pendiente</span>';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    
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
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Colores según tipo
    const colors = {
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    
    messageEl.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(messageEl);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

// Estilos CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    }
    
    .close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
    }
    
    .application-details {
        margin-top: 1rem;
    }
    
    .candidate-section, .application-section, .cover-letter-section, .additional-info-section {
        margin-bottom: 2rem;
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
    }
    
    .cover-letter-content, .additional-info-content {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 5px;
        margin-top: 0.5rem;
        white-space: pre-wrap;
    }
    
    .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-reviewing { background: #dbeafe; color: #1e40af; }
    .badge-interview { background: #f0f9ff; color: #0369a1; }
    .badge-accepted { background: #dcfce7; color: #166534; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    
    .candidate-info strong {
        color: #1f2937;
    }
    
    .candidate-info small {
        color: #6b7280;
    }
    
    .cover-letter-preview {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .application-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .status-selector {
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.8rem;
    }
    
    .job-selector-section {
        margin-bottom: 2rem;
    }
    
    .job-selector-box {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .job-selector-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .job-info {
        background: #f0f9ff;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
    }
    
    .applications-summary {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }
    
    .summary-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
        min-width: 140px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .summary-number {
        display: block;
        font-size: 2rem;
        font-weight: bold;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }
    
    .summary-label {
        font-size: 0.8rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .applications-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .filter-controls {
        display: flex;
        gap: 1rem;
    }
    
    .form-control {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.9rem;
    }
    
    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }
    
    .btn-primary {
        background: #3b82f6;
        color: white;
    }
    
    .btn-primary:hover {
        background: #2563eb;
    }
    
    .btn-primary:disabled {
        background: #9ca3af;
        cursor: not-allowed;
    }
    
    .btn-outline {
        background: transparent;
        border: 1px solid #d1d5db;
        color: #374151;
    }
    
    .btn-outline:hover {
        background: #f9fafb;
    }
    
    .btn-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
    }
`;
document.head.appendChild(style); 