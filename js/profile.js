// Profile page functionality
let currentUser = null;
let userApplications = [];
let userStatistics = {};

// Initialize profile page
window.addEventListener('DOMContentLoaded', async function() {
    try {
        // Verificar que los modales estén ocultos al inicio
        ensureModalsHidden();
        
        // Ajusta la ruta para acceder correctamente desde html/
        const res = await fetch('../backend/session_status.php', { credentials: 'include' });
        const data = await res.json();
        if (!data.loggedIn || !data.user) {
            window.location.href = '../index.html';
            return;
        }
        currentUser = data.user;
        loadProfileData();
        initializeTabs();
        initializeFileUpload();
        await loadApplications();
        loadRecentActivity();
        initializeModals();
    } catch (e) {
        window.location.href = '../index.html';
    }
});

function ensureModalsHidden() {
    // Asegurar que todos los modales estén ocultos al cargar la página
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
    
    console.log('🔒 Modales asegurados como ocultos');
}

function initializeModals() {
    // --- Selección de ciudad (modal) ---
    const openCityBtn = document.getElementById('open-city-modal');
    const cityModal = document.getElementById('city-modal');
    const closeCityBtn = document.getElementById('close-city-modal');
    const saveCityBtn = document.getElementById('save-city');
    const citySelect = document.getElementById('city-select');
    const locationInput = document.getElementById('settings-location');
    
    if (openCityBtn && cityModal && closeCityBtn && saveCityBtn && citySelect && locationInput) {
        openCityBtn.addEventListener('click', function() {
            cityModal.classList.add('show');
            if (locationInput.value) {
                citySelect.value = locationInput.value;
            } else {
                citySelect.value = '';
            }
        });
        
        closeCityBtn.addEventListener('click', function() {
            cityModal.classList.remove('show');
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === cityModal) cityModal.classList.remove('show');
        });
        
        saveCityBtn.addEventListener('click', function() {
            if (citySelect.value) {
                locationInput.value = citySelect.value;
                cityModal.classList.remove('show');
            }
        });
        
        // Solo abrir modal cuando se hace clic en el botón, no en el input
        locationInput.addEventListener('click', function(e) {
            e.preventDefault();
            // No abrir automáticamente el modal
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
    // --- Fin lógica constructor de CV ---
}

function loadProfileData() {
    // Load basic profile info
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-type').textContent = currentUser.userType === 'candidato' ? 'Candidato' : 'Empresa';
    
    const joinedDate = new Date(currentUser.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long'
    });
    document.getElementById('profile-joined').textContent = `Miembro desde: ${joinedDate}`;
    
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
    const filterButtons = document.querySelectorAll('.filter-btn');
    
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
        case 'accepted':
            filteredApplications = userApplications.filter(app => 
                app.status === 'accepted'
            );
            break;
        default:
            // 'all' - show all applications
            break;
    }
    
    renderApplicationsList(filteredApplications);
}

function renderApplicationsList(applications = userApplications) {
    const applicationsList = document.getElementById('applications-list');
    
    if (applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <h4>📋 No hay aplicaciones</h4>
                <p>${applications === userApplications ? 'Aún no has aplicado a ningún empleo' : 'No hay aplicaciones con este filtro'}</p>
                <a href="jobs.html" class="btn btn-primary">Buscar Empleos</a>
            </div>
        `;
        return;
    }
    
    applicationsList.innerHTML = applications.map(app => `
        <div class="application-card" data-application-id="${app.id}">
            <div class="application-header">
                <div class="application-job-info">
                    <h4>${app.job_title}</h4>
                    <p class="company-name">🏢 ${app.company_name}</p>
                    <div class="job-meta">
                        <span>📍 ${app.job_location}</span>
                        <span>💰 ${app.job_salary}</span>
                        <span>⏰ ${app.job_type || 'Tiempo completo'}</span>
                    </div>
                </div>
                <div class="application-status">
                    ${getApplicationStatusBadge(app.status)}
                </div>
            </div>
            
            <div class="application-details">
                <div class="application-info">
                    <p><strong>Salario Esperado:</strong> ${app.expected_salary || 'No especificado'}</p>
                    <p><strong>Disponibilidad:</strong> ${app.availability || 'No especificada'}</p>
                    <p><strong>Aplicado:</strong> ${formatDate(app.applied_at)}</p>
                    ${app.updated_at !== app.applied_at ? `<p><strong>Última actualización:</strong> ${formatDate(app.updated_at)}</p>` : ''}
                </div>
                
                <div class="application-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewApplicationDetails(${app.id})">
                        👁️ Ver Detalles
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="viewJobDetails('${app.job_title}', '${app.company_name}')">
                        📋 Ver Empleo
                    </button>
                </div>
            </div>
            
            <div class="application-progress">
                <div class="progress-bar">
                    <div class="progress-fill ${getProgressClass(app.status)}" style="width: ${getProgressWidth(app.status)}%"></div>
                </div>
                <div class="progress-steps">
                    <span class="step ${app.status !== 'rejected' ? 'completed' : ''}">📝 Aplicación Enviada</span>
                    <span class="step ${['reviewing', 'interview', 'accepted'].includes(app.status) ? 'completed' : ''}">👀 En Revisión</span>
                    <span class="step ${['interview', 'accepted'].includes(app.status) ? 'completed' : ''}">🤝 Entrevista</span>
                    <span class="step ${app.status === 'accepted' ? 'completed' : ''}">✅ Decisión Final</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getApplicationStatusBadge(status) {
    const statusMap = {
        'pending': '<span class="badge badge-pending">⏳ Pendiente</span>',
        'reviewing': '<span class="badge badge-reviewing">👀 En Revisión</span>',
        'interview': '<span class="badge badge-interview">🤝 Entrevista</span>',
        'accepted': '<span class="badge badge-accepted">✅ Aceptado</span>',
        'rejected': '<span class="badge badge-rejected">❌ Rechazado</span>'
    };
    
    return statusMap[status] || statusMap['pending'];
}

function getProgressClass(status) {
    const classMap = {
        'pending': 'progress-pending',
        'reviewing': 'progress-reviewing',
        'interview': 'progress-interview',
        'accepted': 'progress-accepted',
        'rejected': 'progress-rejected'
    };
    
    return classMap[status] || 'progress-pending';
}

function getProgressWidth(status) {
    const widthMap = {
        'pending': 25,
        'reviewing': 50,
        'interview': 75,
        'accepted': 100,
        'rejected': 100
    };
    
    return widthMap[status] || 25;
}

function viewApplicationDetails(applicationId) {
    const application = userApplications.find(app => app.id === applicationId);
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
            <h2>📋 Detalles de mi Aplicación</h2>
            <div class="application-details-modal">
                <div class="job-section">
                    <h3>💼 Información del Empleo</h3>
                    <p><strong>Puesto:</strong> ${application.job_title}</p>
                    <p><strong>Empresa:</strong> ${application.company_name}</p>
                    <p><strong>Ubicación:</strong> ${application.job_location}</p>
                    <p><strong>Salario:</strong> ${application.job_salary}</p>
                    <p><strong>Tipo:</strong> ${application.job_type || 'Tiempo completo'}</p>
                    <p><strong>Descripción:</strong> ${application.job_description || 'No disponible'}</p>
                </div>
                
                <div class="application-section">
                    <h3>📝 Mi Aplicación</h3>
                    <p><strong>Estado:</strong> ${getApplicationStatusBadge(application.status)}</p>
                    <p><strong>Salario Esperado:</strong> ${application.expected_salary || 'No especificado'}</p>
                    <p><strong>Disponibilidad:</strong> ${application.availability || 'No especificada'}</p>
                    <p><strong>Fecha de Aplicación:</strong> ${formatDate(application.applied_at)}</p>
                    ${application.updated_at !== application.applied_at ? `<p><strong>Última Actualización:</strong> ${formatDate(application.updated_at)}</p>` : ''}
                </div>
                
                <div class="cover-letter-section">
                    <h3>💼 Mi Carta de Presentación</h3>
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
                
                <div class="company-section">
                    <h3>🏢 Información de la Empresa</h3>
                    <p><strong>Nombre:</strong> ${application.company_name}</p>
                    <p><strong>Email:</strong> ${application.company_email}</p>
                    <p><strong>Ubicación:</strong> ${application.company_location || 'No especificada'}</p>
                    ${application.company_website ? `<p><strong>Sitio Web:</strong> <a href="${application.company_website}" target="_blank">${application.company_website}</a></p>` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar el modal
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Cerrar modal
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    };
    
    // Cerrar al hacer clic fuera del modal
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    };
}

function viewJobDetails(jobTitle, companyName) {
    showMessage('Funcionalidad de ver empleo próximamente', 'info');
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

// --- MODAL DE DETALLES DE OFERTA Y FAVORITOS ---

// Utilidad para obtener detalles de una oferta (mock, puedes conectar con tu fuente real)
function getJobDetailsById(jobId) {
    // Aquí puedes conectar con tu fuente real de empleos
    // Por ahora, mock básico:
    const mockJobs = {
        1: {
            id: 1,
            title: "Desarrollador Frontend",
            company: "TechCorp",
            location: "Lima, Perú",
            salary: "S/ 3,500 - 5,000",
            type: "Tiempo completo",
            description: "Buscamos un desarrollador frontend con experiencia en React y JavaScript..."
        },
        2: {
            id: 2,
            title: "Analista de Datos",
            company: "DataSoft",
            location: "Arequipa, Perú",
            salary: "S/ 4,000 - 6,000",
            type: "Tiempo completo",
            description: "Analista de datos con experiencia en Python y SQL..."
        }
    };
    
    return mockJobs[jobId] || {
        id: jobId,
        title: "Empleo Genérico",
        company: "Empresa",
        location: "Ubicación",
        salary: "Salario",
        type: "Tipo",
        description: "Descripción del empleo..."
    };
}

function renderOfferModal(jobId, isFavorite = false, isApplication = false) {
    const job = getJobDetailsById(jobId);
    const modal = document.getElementById('offer-modal');
    const content = document.getElementById('offer-details-content');
    
    content.innerHTML = `
        <div class="job-details">
            <h2>${job.title}</h2>
            <p class="company-name">🏢 ${job.company}</p>
            <div class="job-meta">
                <span>📍 ${job.location}</span>
                <span>💰 ${job.salary}</span>
                <span>⏰ ${job.type}</span>
            </div>
            <div class="job-description">
                <h3>Descripción del Empleo</h3>
                <p>${job.description}</p>
            </div>
            <div class="job-actions">
                ${!isApplication ? `
                    <button class="btn btn-primary" onclick="applyToJob(${jobId})">
                        📝 Aplicar Ahora
                    </button>
                ` : ''}
                <button class="btn btn-outline" onclick="toggleFavorite(${jobId})">
                    ${isFavorite ? '❤️ Quitar de Favoritos' : '🤍 Agregar a Favoritos'}
                </button>
                <button class="btn btn-outline" onclick="closeOfferModal()">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function applyToJob(jobId) {
    // Simular aplicación
    showMessage('¡Aplicación enviada exitosamente!', 'success');
    closeOfferModal();
    
    // Recargar aplicaciones
    loadApplications();
}

function toggleFavorite(jobId) {
    const job = getJobDetailsById(jobId);
    const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.id}`) || '[]');
    
    const existingIndex = favorites.findIndex(fav => fav.id === jobId);
    
    if (existingIndex !== -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        showMessage('Empleo removido de favoritos', 'success');
    } else {
        // Add to favorites
        favorites.push(job);
        showMessage('Empleo agregado a favoritos', 'success');
    }
    
    localStorage.setItem(`favorites_${currentUser.id}`, JSON.stringify(favorites));
    
    // Update modal
    renderOfferModal(jobId, !isFavorite(jobId));
}

function closeOfferModal() {
    const modal = document.getElementById('offer-modal');
    modal.classList.remove('show');
}

// Event listeners for modals
document.addEventListener('click', (e) => {
    const modal = document.getElementById('offer-modal');
    if (modal && e.target === modal) {
        closeOfferModal();
    }
});

// Settings form submission
document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('name', document.getElementById('settings-name').value);
            formData.append('email', document.getElementById('settings-email').value);
            formData.append('phone', document.getElementById('settings-phone').value);
            formData.append('location', document.getElementById('settings-location').value);
            formData.append('bio', document.getElementById('settings-bio').value);
            
            try {
                const response = await fetch('../backend/update_profile.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('Perfil actualizado correctamente', 'success');
                    // Reload profile data
                    loadProfileData();
                } else {
                    showMessage('Error al actualizar: ' + data.message, 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showMessage('Error al actualizar el perfil', 'error');
            }
        });
    }
});

function showMessage(message, type = 'info') {
    // Crear elemento de mensaje
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

function initializeFileUpload() {
    const uploadArea = document.getElementById('cv-upload-area');
    const fileInput = document.getElementById('cv-file');
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

function handleFileUpload(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
        showMessage('Por favor selecciona un archivo PDF o Word', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('El archivo es demasiado grande. Máximo 5MB', 'error');
        return;
    }
    
    // Simulate file upload
    const uploadArea = document.getElementById('cv-upload-area');
    uploadArea.innerHTML = `
        <div class="upload-progress">
            <div class="upload-icon">⏳</div>
            <h4>Subiendo archivo...</h4>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>
    `;
    
    // Simulate upload progress
    let progress = 0;
    const progressFill = uploadArea.querySelector('.progress-fill');
    
    const uploadInterval = setInterval(() => {
        progress += 10;
        progressFill.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(uploadInterval);
            
            // Save file info to user data
            currentUser.cv = {
                name: file.name,
                size: file.size,
                uploadDate: new Date().toISOString()
            };
            
            // Update localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex] = currentUser;
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            
            uploadArea.innerHTML = `
                <div class="upload-success">
                    <div class="upload-icon">✅</div>
                    <h4>¡CV subido exitosamente!</h4>
                    <p>${file.name}</p>
                    <button class="btn btn-outline" onclick="resetUploadArea()">Subir otro archivo</button>
                </div>
            `;
            
            showMessage('CV subido correctamente', 'success');
            loadProfileData(); // Refresh profile completion
        }
    }, 200);
}

function resetUploadArea() {
    const uploadArea = document.getElementById('cv-upload-area');
    uploadArea.innerHTML = `
        <div class="upload-icon">📄</div>
        <h4>Sube tu CV</h4>
        <p>Arrastra y suelta tu archivo aquí o haz clic para seleccionar</p>
        <input type="file" id="cv-file" accept=".pdf,.doc,.docx" hidden>
        <button class="btn btn-primary" onclick="document.getElementById('cv-file').click()">Seleccionar Archivo</button>
    `;
    initializeFileUpload();
}

function loadRecentActivity() {
    const recentActivities = document.getElementById('recent-activities');
    
    // Mock recent activities based on user applications
    const activities = [];
    
    if (userApplications.length > 0) {
        // Get the most recent applications
        const recentApps = userApplications.slice(0, 3);
        
        recentApps.forEach(app => {
            activities.push({
                type: 'applied',
                title: `Aplicaste a ${app.job_title}`,
                company: app.company_name,
                time: formatDate(app.applied_at),
                icon: '📝'
            });
        });
    }
    
    if (activities.length === 0) {
        recentActivities.innerHTML = `
            <div class="empty-state">
                <p>No hay actividad reciente</p>
            </div>
        `;
        return;
    }
    
    recentActivities.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">${activity.icon}</div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.company}</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    
    // Get favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.id}`) || '[]');
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-state">
                <h4>📋 No hay favoritos</h4>
                <p>Aún no has guardado ningún empleo como favorito</p>
                <a href="jobs.html" class="btn btn-primary">Buscar Empleos</a>
            </div>
        `;
        return;
    }
    
    favoritesList.innerHTML = favorites.map(job => `
        <div class="application-card clickable" data-jobid="${job.id}">
            <div class="application-header">
                <div class="application-job-info">
                    <h4>${job.title}</h4>
                    <p class="company-name">🏢 ${job.company}</p>
                    <div class="job-meta">
                        <span>📍 ${job.location}</span>
                        <span>💰 ${job.salary}</span>
                        <span>⏰ ${job.type || 'Tiempo completo'}</span>
                    </div>
                </div>
                <div class="application-actions">
                    <button class="btn btn-outline btn-sm" onclick="viewJobDetails('${job.title}', '${job.company}')">
                        📋 Ver Empleo
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="removeFavorite(${job.id})">
                        ❌ Quitar de Favoritos
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function removeFavorite(jobId) {
    const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.id}`) || '[]');
    const updatedFavorites = favorites.filter(job => job.id !== jobId);
    localStorage.setItem(`favorites_${currentUser.id}`, JSON.stringify(updatedFavorites));
    
    showMessage('Empleo removido de favoritos', 'success');
    renderFavorites();
}

function isFavorite(jobId) {
    const favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.id}`) || '[]');
    return favorites.some(job => job.id === jobId);
}