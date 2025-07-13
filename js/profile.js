// Profile page functionality
let currentUser = null;
let userApplications = [];
let userStatistics = {};

// Initialize profile page
window.addEventListener('DOMContentLoaded', async function() {
    try {
        // Ajusta la ruta para acceder correctamente desde html/
        const res = await fetch('../backend/session_status.php', { credentials: 'include' });
        const data = await res.json();
        console.log('Session data:', data);
        
        if (!data.logged_in || !data.user) {
            console.log('No logged in, redirecting to index');
            window.location.href = '../index.html';
            return;
        }
        
        currentUser = data.user;
        console.log('Current user:', currentUser);
        
        // Check user type and redirect if necessary
        if (currentUser.userType === 'empresa') {
            // Redirect to company dashboard
            window.location.href = 'company-dashboard.html';
            return;
        }
        
        loadProfileData();
        initializeTabs();
        initializeFileUpload();
        await loadApplications();
        loadRecentActivity();
        initializeModals();
    } catch (e) {
        console.error('Error loading profile:', e);
        window.location.href = '../index.html';
    }
});

function initializeModals() {
    // --- Selección de ciudad (modal Bootstrap) ---
    const openCityBtn = document.getElementById('open-city-modal');
    const cityModal = document.getElementById('city-modal');
    const saveCityBtn = document.getElementById('save-city');
    const citySelect = document.getElementById('city-select');
    const locationInput = document.getElementById('settings-location');
    
    if (openCityBtn && cityModal && saveCityBtn && citySelect && locationInput) {
        openCityBtn.addEventListener('click', function() {
            if (locationInput.value) {
                citySelect.value = locationInput.value;
            } else {
                citySelect.value = '';
            }
            // Usar Bootstrap modal
            const modal = new bootstrap.Modal(cityModal);
            modal.show();
        });
        
        saveCityBtn.addEventListener('click', function() {
            if (citySelect.value) {
                locationInput.value = citySelect.value;
                // Cerrar modal Bootstrap
                const modal = bootstrap.Modal.getInstance(cityModal);
                modal.hide();
            }
        });
        
        // Hacer el input readonly para evitar edición directa
        locationInput.setAttribute('readonly', true);
        locationInput.style.cursor = 'pointer';
    }
    
    // --- Lógica para el constructor de CV ---
    const btnCrearCV = document.getElementById('cv-builder-btn');
    const seccionCV = document.getElementById('cv');
    const seccionConstructor = document.getElementById('constructor-cv');
    const btnVolverCV = document.getElementById('volver-cv');
    
    if (btnCrearCV && seccionCV && seccionConstructor) {
        btnCrearCV.addEventListener('click', function() {
            seccionCV.style.display = 'none';
            seccionConstructor.style.display = 'block';
        });
    }
    
    if (btnVolverCV && seccionCV && seccionConstructor) {
        btnVolverCV.addEventListener('click', function() {
            seccionConstructor.style.display = 'none';
            seccionCV.style.display = 'block';
        });
    }
}

function loadProfileData() {
    // Load basic profile info
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-email').innerHTML = `<i class="bi bi-envelope"></i> ${currentUser.email}`;
    document.getElementById('profile-type').textContent = currentUser.userType === 'candidato' ? 'Candidato' : 'Empresa';
    
    const joinedDate = new Date(currentUser.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long'
    });
    document.getElementById('profile-joined').innerHTML = `<i class="bi bi-calendar"></i> Miembro desde: ${joinedDate}`;
    
    // Load settings form
    document.getElementById('settings-name').value = currentUser.name || '';
    document.getElementById('settings-email').value = currentUser.email || '';
    document.getElementById('settings-phone').value = currentUser.phone || '';
    document.getElementById('settings-location').value = currentUser.location || '';
    document.getElementById('settings-bio').value = currentUser.bio || '';
    
    // Update overview stats with real data
    updateOverviewStats();
    
    // Calculate profile completion
    let completionScore = 40; // Base score
    if (currentUser.phone) completionScore += 15;
    if (currentUser.location) completionScore += 15;
    if (currentUser.bio) completionScore += 20;
    if (currentUser.cv) completionScore += 10;
    
    document.getElementById('profile-completion').textContent = `${completionScore}%`;
}

function updateOverviewStats() {
    // Update with real statistics
    document.getElementById('total-applications').textContent = userStatistics.total || 0;
    document.getElementById('pending-applications').textContent = (userStatistics.pending || 0) + (userStatistics.reviewing || 0);
    document.getElementById('interviews').textContent = userStatistics.interview || 0;
}

async function loadApplications() {
    try {
        console.log('🔄 Cargando aplicaciones del usuario...');
        
        const response = await fetch('../backend/get_user_applications.php', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Aplicaciones cargadas:', data.applications.length);
            userApplications = data.applications;
            userStatistics = data.statistics;
            
            // Update overview stats
            updateOverviewStats();
            
            // Render applications list
            renderApplicationsList();
            
            // Setup filter buttons
            setupApplicationFilters();
        } else {
            console.error('❌ Error cargando aplicaciones:', data.message);
            showMessage('Error cargando aplicaciones: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showMessage('Error de conexión al cargar aplicaciones', 'error');
    }
}

function setupApplicationFilters() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterApplications(filter);
        });
    });
}

function filterApplications(filter) {
    let filteredApplications = userApplications;
    
    switch (filter) {
        case 'pending':
            filteredApplications = userApplications.filter(app => 
                app.status === 'pending' || app.status === 'reviewing'
            );
            break;
        case 'interview':
            filteredApplications = userApplications.filter(app => 
                app.status === 'interview'
            );
            break;
        case 'rejected':
            filteredApplications = userApplications.filter(app => 
                app.status === 'rejected'
            );
            break;
        case 'all':
        default:
            filteredApplications = userApplications;
            break;
    }
    
    renderApplicationsList(filteredApplications);
}

function renderApplicationsList(applications = userApplications) {
    const applicationsList = document.getElementById('applications-list');
    
    if (!applicationsList) return;
    
    if (applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                    <h5 class="mt-3 text-muted">No hay aplicaciones</h5>
                    <p class="text-muted">Aún no has aplicado a ningún empleo</p>
                </div>
            </div>
        `;
        return;
    }
    
    applicationsList.innerHTML = applications.map(app => `
        <div class="col-lg-6 col-xl-4">
            <div class="card application-card h-100">
                <div class="card-body">
                    <div class="application-header">
                        <div class="application-avatar">
                            ${app.job_title ? app.job_title.charAt(0).toUpperCase() : 'J'}
                        </div>
                        <div class="application-info flex-grow-1">
                            <h6 class="mb-1">${app.job_title || 'Empleo'}</h6>
                            <small class="text-muted">${app.company_name || 'Empresa'}</small>
                        </div>
                        <span class="badge badge-${app.status}">${getApplicationStatusText(app.status)}</span>
                    </div>
                    
                    <div class="application-meta">
                        <div class="row g-2">
                            <div class="col-6">
                                <small><i class="bi bi-calendar"></i> ${formatDate(app.applied_at)}</small>
                            </div>
                            <div class="col-6">
                                <small><i class="bi bi-geo-alt"></i> ${app.location || 'No especificada'}</small>
                            </div>
                            <div class="col-6">
                                <small><i class="bi bi-currency-dollar"></i> ${app.salary || 'No especificado'}</small>
                            </div>
                            <div class="col-6">
                                <small><i class="bi bi-clock"></i> ${app.status}</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="progress mb-3">
                        <div class="progress-bar bg-${getProgressClass(app.status)}" 
                             style="width: ${getProgressWidth(app.status)}%"></div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Progreso de la aplicación</small>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewApplicationDetails(${app.id})">
                            <i class="bi bi-eye"></i> Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getApplicationStatusBadge(status) {
    const statusMap = {
        'pending': 'warning',
        'reviewing': 'info',
        'interview': 'primary',
        'accepted': 'success',
        'rejected': 'danger'
    };
    return statusMap[status] || 'secondary';
}

function getApplicationStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'reviewing': 'En Revisión',
        'interview': 'Entrevista',
        'accepted': 'Aceptado',
        'rejected': 'Rechazado'
    };
    return statusMap[status] || status;
}

function getProgressClass(status) {
    const progressMap = {
        'pending': 'warning',
        'reviewing': 'info',
        'interview': 'primary',
        'accepted': 'success',
        'rejected': 'danger'
    };
    return progressMap[status] || 'secondary';
}

function getProgressWidth(status) {
    const widthMap = {
        'pending': 25,
        'reviewing': 50,
        'interview': 75,
        'accepted': 100,
        'rejected': 100
    };
    return widthMap[status] || 0;
}

function viewApplicationDetails(applicationId) {
    const application = userApplications.find(app => app.id === applicationId);
    if (!application) {
        showMessage('Aplicación no encontrada', 'error');
        return;
    }
    
    // Crear modal con Bootstrap
    const modalHtml = `
        <div class="modal fade" id="applicationDetailsModal" tabindex="-1" aria-labelledby="applicationDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="applicationDetailsModalLabel">
                            <i class="bi bi-file-earmark-text"></i> Detalles de la Aplicación
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-briefcase"></i> Información del Empleo</h6>
                                <p><strong>Puesto:</strong> ${application.job_title || 'N/A'}</p>
                                <p><strong>Empresa:</strong> ${application.company_name || 'N/A'}</p>
                                <p><strong>Ubicación:</strong> ${application.location || 'No especificada'}</p>
                                <p><strong>Salario:</strong> ${application.salary || 'No especificado'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6><i class="bi bi-info-circle"></i> Estado de la Aplicación</h6>
                                <p><strong>Estado:</strong> <span class="badge badge-${application.status}">${getApplicationStatusText(application.status)}</span></p>
                                <p><strong>Fecha de Aplicación:</strong> ${formatDate(application.applied_at)}</p>
                                <p><strong>ID de Aplicación:</strong> ${application.id}</p>
                            </div>
                        </div>
                        
                        ${application.cover_letter ? `
                            <div class="mt-4">
                                <h6><i class="bi bi-chat-quote"></i> Carta de Presentación</h6>
                                <div class="bg-light p-3 rounded">
                                    ${application.cover_letter}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="mt-4">
                            <h6><i class="bi bi-graph-up"></i> Progreso de la Aplicación</h6>
                            <div class="progress mb-2">
                                <div class="progress-bar bg-${getProgressClass(application.status)}" 
                                     style="width: ${getProgressWidth(application.status)}%"></div>
                            </div>
                            <small class="text-muted">Progreso: ${getProgressWidth(application.status)}%</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('applicationDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('applicationDetailsModal'));
    modal.show();
    
    // Limpiar modal cuando se cierre
    document.getElementById('applicationDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function viewJobDetails(jobTitle, companyName) {
    // Implementar vista de detalles del empleo
    console.log('Ver detalles del empleo:', jobTitle, companyName);
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

function getJobDetailsById(jobId) {
    // Simular obtención de detalles del empleo
    return {
        id: jobId,
        title: 'Desarrollador Full Stack',
        company: 'Tech Solutions',
        location: 'Lima, Perú',
        salary: '$3,000 - $5,000',
        description: 'Buscamos un desarrollador full stack con experiencia en React, Node.js y bases de datos.',
        requirements: [
            'Experiencia mínima de 2 años',
            'Conocimientos en React, Node.js',
            'Manejo de bases de datos SQL y NoSQL',
            'Buenas prácticas de desarrollo'
        ],
        benefits: [
            'Horario flexible',
            'Trabajo remoto',
            'Seguro médico',
            'Capacitaciones'
        ]
    };
}

function renderOfferModal(jobId, isFavorite = false, isApplication = false) {
    const job = getJobDetailsById(jobId);
    
    const modalContent = document.getElementById('offer-details-content');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h4>${job.title}</h4>
                <p class="text-muted">${job.company}</p>
                <p><i class="bi bi-geo-alt"></i> ${job.location}</p>
                <p><i class="bi bi-currency-dollar"></i> ${job.salary}</p>
                
                <h6 class="mt-4">Descripción</h6>
                <p>${job.description}</p>
                
                <h6>Requisitos</h6>
                <ul>
                    ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
                
                <h6>Beneficios</h6>
                <ul>
                    ${job.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h6>Acciones</h6>
                        ${!isApplication ? `
                            <button class="btn btn-primary w-100 mb-2" onclick="applyToJob(${jobId})">
                                <i class="bi bi-send"></i> Aplicar
                            </button>
                        ` : `
                            <button class="btn btn-success w-100 mb-2" disabled>
                                <i class="bi bi-check-circle"></i> Ya Aplicaste
                            </button>
                        `}
                        
                        <button class="btn btn-outline-primary w-100" onclick="toggleFavorite(${jobId})">
                            <i class="bi bi-heart${isFavorite ? '-fill' : ''}"></i> 
                            ${isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Mostrar modal usando Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('offer-modal'));
    modal.show();
}

function applyToJob(jobId) {
    // Implementar lógica de aplicación
    console.log('Aplicando al empleo:', jobId);
    showMessage('Aplicación enviada correctamente', 'success');
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('offer-modal'));
    modal.hide();
}

function toggleFavorite(jobId) {
    // Implementar lógica de favoritos
    console.log('Toggle favorito:', jobId);
    showMessage('Favorito actualizado', 'success');
}

function closeOfferModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('offer-modal'));
    if (modal) {
        modal.hide();
    }
}

function showMessage(message, type = 'info') {
    // Crear alerta Bootstrap
    const alertHtml = `
        <div class="alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Insertar al inicio del contenido principal
    const mainContent = document.querySelector('.profile-section');
    if (mainContent) {
        mainContent.insertAdjacentHTML('afterbegin', alertHtml);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            const alert = mainContent.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

function initializeTabs() {
    // Los tabs ahora se manejan automáticamente con Bootstrap
    console.log('✅ Tabs inicializados con Bootstrap');
}

function initializeFileUpload() {
    const fileInput = document.getElementById('cv-file');
    const uploadArea = document.getElementById('cv-upload-area');
    
    if (!fileInput || !uploadArea) return;
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#3b82f6';
        uploadArea.style.backgroundColor = '#eff6ff';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#d1d5db';
        uploadArea.style.backgroundColor = 'transparent';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#d1d5db';
        uploadArea.style.backgroundColor = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

function handleFileUpload(file) {
    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
        showMessage('Solo se permiten archivos PDF, DOC o DOCX', 'error');
        return;
    }
    
    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('El archivo es demasiado grande. Máximo 5MB', 'error');
        return;
    }
    
    // Simular subida
    showMessage('Subiendo archivo...', 'info');
    
    setTimeout(() => {
        showMessage('CV subido correctamente', 'success');
        resetUploadArea();
    }, 2000);
}

function resetUploadArea() {
    const fileInput = document.getElementById('cv-file');
    if (fileInput) {
        fileInput.value = '';
    }
}

function loadRecentActivity() {
    // Simular actividad reciente
    const activities = [
        {
            type: 'application',
            title: 'Aplicaste a Desarrollador Full Stack',
            company: 'Tech Solutions',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            icon: 'bi-send'
        },
        {
            type: 'interview',
            title: 'Entrevista programada',
            company: 'Digital Corp',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            icon: 'bi-camera-video'
        },
        {
            type: 'profile',
            title: 'Actualizaste tu perfil',
            company: '',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            icon: 'bi-person'
        }
    ];
    
    const activitiesContainer = document.getElementById('recent-activities');
    if (!activitiesContainer) return;
    
    activitiesContainer.innerHTML = activities.map(activity => `
        <div class="activity-item d-flex align-items-center">
            <div class="activity-icon">
                <i class="bi ${activity.icon}"></i>
            </div>
            <div class="activity-content flex-grow-1">
                <h6 class="mb-1">${activity.title}</h6>
                <small class="text-muted">
                    ${activity.company ? activity.company + ' • ' : ''}${formatDate(activity.date)}
                </small>
            </div>
        </div>
    `).join('');
}

function renderFavorites() {
    // Implementar renderizado de favoritos
    const favoritesList = document.getElementById('favorites-list');
    if (!favoritesList) return;
    
    favoritesList.innerHTML = `
        <div class="col-12">
            <div class="text-center py-5">
                <i class="bi bi-heart text-muted" style="font-size: 3rem;"></i>
                <h5 class="mt-3 text-muted">No hay favoritos</h5>
                <p class="text-muted">Aún no has guardado ningún empleo como favorito</p>
            </div>
        </div>
    `;
}

function removeFavorite(jobId) {
    // Implementar lógica para remover favorito
    console.log('Removiendo favorito:', jobId);
    showMessage('Favorito removido', 'success');
}

function isFavorite(jobId) {
    // Implementar lógica para verificar si es favorito
    return false;
}

// Tests functionality
async function loadUserTests() {
    try {
        console.log('🔄 Cargando tests del usuario...');
        
        const response = await fetch('../backend/get_user_tests.php', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Tests cargados:', data.tests.length);
            renderUserTests(data.tests);
        } else {
            console.error('❌ Error cargando tests:', data.message);
            showMessage('Error cargando tests: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showMessage('Error de conexión al cargar tests', 'error');
    }
}

function renderUserTests(tests) {
    const testsList = document.getElementById('user-tests-list');
    
    if (!testsList) return;
    
    if (tests.length === 0) {
        testsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-clipboard-x text-muted" style="font-size: 3rem;"></i>
                <h6 class="text-muted mt-3">No tienes tests asignados</h6>
                <p class="text-muted">Los tests aparecerán aquí cuando las empresas te los asignen</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    tests.forEach(test => {
        const statusBadge = getTestStatusBadge(test.status);
        const dueDateText = test.due_date ? 
            `Fecha límite: ${formatDate(test.due_date)}` : 
            'Sin fecha límite';
        
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h6 class="card-title">${test.test_title}</h6>
                            <p class="card-text text-muted">${test.test_description || 'Sin descripción'}</p>
                            <div class="d-flex gap-2 mb-2">
                                ${statusBadge}
                                <span class="badge bg-info">${test.questions_count} preguntas</span>
                                <span class="badge bg-secondary">${test.time_limit} minutos</span>
                            </div>
                            <small class="text-muted">${dueDateText}</small>
                        </div>
                        <div class="col-md-4 text-end">
                            ${getTestActionButton(test)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    testsList.innerHTML = html;
}

function getTestStatusBadge(status) {
    const badges = {
        'assigned': '<span class="badge bg-warning">Asignado</span>',
        'in_progress': '<span class="badge bg-info">En Progreso</span>',
        'completed': '<span class="badge bg-success">Completado</span>',
        'expired': '<span class="badge bg-secondary">Expirado</span>'
    };
    
    return badges[status] || '<span class="badge bg-secondary">Desconocido</span>';
}

function getTestActionButton(test) {
    switch (test.status) {
        case 'assigned':
            return `
                <button class="btn btn-primary btn-sm" onclick="startTest(${test.test_id}, ${test.assignment_id})">
                    <i class="bi bi-play-circle"></i> Iniciar Test
                </button>
            `;
        case 'in_progress':
            return `
                <button class="btn btn-info btn-sm" onclick="continueTest(${test.test_id}, ${test.assignment_id})">
                    <i class="bi bi-arrow-right-circle"></i> Continuar
                </button>
            `;
        case 'completed':
            return `
                <button class="btn btn-success btn-sm" onclick="viewTestResults(${test.assignment_id})">
                    <i class="bi bi-eye"></i> Ver Resultados
                </button>
            `;
        case 'expired':
            return `
                <button class="btn btn-secondary btn-sm" disabled>
                    <i class="bi bi-clock"></i> Expirado
                </button>
            `;
        default:
            return '';
    }
}

function startTest(testId, assignmentId) {
    window.location.href = `realizar-test-habilidades.html?test_id=${testId}&assignment_id=${assignmentId}`;
}

function continueTest(testId, assignmentId) {
    window.location.href = `realizar-test-habilidades.html?test_id=${testId}&assignment_id=${assignmentId}`;
}

function viewTestResults(assignmentId) {
    // Mostrar resultados revisados del test al usuario
    fetch(`../backend/get_my_test_results.php?assignment_id=${assignmentId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                showMessage('Error al cargar resultados: ' + data.message, 'error');
                return;
            }
            let html = `<h5>${data.assignment.test_title}</h5>`;
            html += `<p class='text-muted'>${data.assignment.test_description || ''}</p>`;
            html += `<div class='mb-2'><strong>Estado:</strong> <span class='badge bg-${data.assignment.status === 'completed' ? 'success' : data.assignment.status === 'expired' ? 'secondary' : 'info'}'>${data.assignment.status}</span></div>`;
            html += `<div class='mb-2'><strong>Puntaje total:</strong> ${data.assignment.total_score !== null ? data.assignment.total_score + ' / ' + data.assignment.max_score : 'N/A'}</div>`;
            if (data.assignment.completed_at) {
                html += `<div class='mb-2'><strong>Fecha completado:</strong> ${formatDate(data.assignment.completed_at)}</div>`;
            }
            html += `<hr><h6>Preguntas y revisión</h6>`;
            data.questions.forEach((q, idx) => {
                html += `<div class='mb-3 p-2 border rounded'>`;
                html += `<strong>Pregunta ${idx + 1}:</strong> ${q.question_text}<br>`;
                html += `<span class='badge bg-secondary'>${q.points} pts</span><br>`;
                html += `<strong>Tu respuesta:</strong> <div class='bg-light p-2 rounded mb-2'>${q.answer_text ? q.answer_text : '<em>No respondida</em>'}</div>`;
                html += `<strong>Puntaje recibido:</strong> ${q.points_earned !== null ? q.points_earned + ' / ' + q.points : 'N/A'}<br>`;
                html += `<strong>Comentario de la empresa:</strong> <div class='bg-white border p-2 rounded mb-2'>${q.reviewer_notes ? q.reviewer_notes : '<em>Sin comentario</em>'}</div>`;
                html += `</div>`;
            });
            document.getElementById('userTestResultsBody').innerHTML = html;
            const modal = new bootstrap.Modal(document.getElementById('userTestResultsModal'), {
                backdrop: false,
                keyboard: true
            });
            modal.show();
        })
        .catch(() => showMessage('Error de red al cargar resultados', 'error'));
}

function refreshTests() {
    loadUserTests();
    showMessage('Tests actualizados', 'success');
}

// Load tests when tests tab is shown
document.addEventListener('DOMContentLoaded', function() {
    const testsTab = document.getElementById('tests-tab');
    if (testsTab) {
        testsTab.addEventListener('shown.bs.tab', function() {
            loadUserTests();
        });
    }
});