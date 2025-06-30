// Profile page functionality
let currentUser = null;

// Initialize profile page
window.addEventListener('DOMContentLoaded', async function() {
    try {
        const res = await fetch('backend/session_status.php', { credentials: 'include' });
        const data = await res.json();
        if (!data.loggedIn || !data.user) {
            window.location.href = 'index.html';
            return;
        }
        currentUser = data.user;
        loadProfileData();
        initializeTabs();
        initializeFileUpload();
        loadApplications();
        loadRecentActivity();
        // --- Selección de ciudad (modal) ---
        const openCityBtn = document.getElementById('open-city-modal');
        const cityModal = document.getElementById('city-modal');
        const closeCityBtn = document.getElementById('close-city-modal');
        const saveCityBtn = document.getElementById('save-city');
        const citySelect = document.getElementById('city-select');
        const locationInput = document.getElementById('settings-location');
        openCityBtn.addEventListener('click', function() {
            cityModal.style.display = 'block';
            if (locationInput.value) {
                citySelect.value = locationInput.value;
            } else {
                citySelect.value = '';
            }
        });
        closeCityBtn.addEventListener('click', function() {
            cityModal.style.display = 'none';
        });
        window.addEventListener('click', function(e) {
            if (e.target === cityModal) cityModal.style.display = 'none';
        });
        saveCityBtn.addEventListener('click', function() {
            if (citySelect.value) {
                locationInput.value = citySelect.value;
                cityModal.style.display = 'none';
            }
        });
        locationInput.addEventListener('click', function() {
            openCityBtn.click();
        });
    } catch (e) {
        window.location.href = 'index.html';
    }
});

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
    
    // Load overview stats
    const applications = currentUser.applications || [];
    document.getElementById('total-applications').textContent = applications.length;
    
    // Calculate pending applications (mock data for now)
    const pendingCount = Math.floor(applications.length * 0.7);
    document.getElementById('pending-applications').textContent = pendingCount;
    
    // Mock interview count
    const interviewCount = Math.floor(applications.length * 0.2);
    document.getElementById('interviews').textContent = interviewCount;
    
    // Calculate profile completion
    let completionScore = 40; // Base score
    if (currentUser.phone) completionScore += 15;
    if (currentUser.location) completionScore += 15;
    if (currentUser.bio) completionScore += 20;
    if (currentUser.cv) completionScore += 10;
    
    document.getElementById('profile-completion').textContent = `${completionScore}%`;
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

// --- MODAL DE DETALLES DE OFERTA Y FAVORITOS ---

// Utilidad para obtener detalles de una oferta (mock, puedes conectar con tu fuente real)
function getJobDetailsById(jobId) {
    // Aquí puedes conectar con tu fuente real de empleos
    // Por ahora, mock básico:
    return {
        id: jobId,
        title: `Empleo ${jobId}`,
        company: `Empresa ${jobId}`,
        location: 'Lima, Perú',
        salary: 'S/ 5,000 - S/ 7,000',
        type: 'Tiempo completo',
        posted: 'Hace 2 días',
        description: 'Descripción de ejemplo para la oferta de empleo.',
        requirements: [
            'Requisito 1',
            'Requisito 2',
            'Requisito 3'
        ]
    };
}

function renderOfferModal(jobId, isFavorite = false, isApplication = false) {
    const job = getJobDetailsById(jobId);
    const offerDetails = document.getElementById('offer-details-content');
    offerDetails.innerHTML = `
        <h2>${job.title}</h2>
        <h4 style="color:#64748b;">${job.company}</h4>
        <div style="margin-bottom:1rem; color:#64748b;">
            <span>📍 ${job.location}</span> &nbsp; <span>💰 ${job.salary}</span> &nbsp; <span>🕒 ${job.type}</span>
        </div>
        <div style="margin-bottom:1rem; color:#94a3b8;">${job.posted}</div>
        <div style="margin-bottom:1.5rem;">${job.description}</div>
        <div style="margin-bottom:1.5rem;"><b>Requisitos:</b><ul>${job.requirements.map(r=>`<li>${r}</li>`).join('')}</ul></div>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
            ${isApplication ? `<button class='btn btn-danger' id='undo-application-btn'>Deshacer postulación</button>` : `<button class='btn btn-primary' id='apply-btn'>Postular</button>`}
            <button class='btn btn-outline' id='toggle-favorite-btn'>${isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}</button>
        </div>
    `;
    document.getElementById('offer-modal').style.display = 'block';

    // Acción deshacer postulación
    if (isApplication) {
        document.getElementById('undo-application-btn').onclick = function() {
            Swal.fire({
                title: '¿Seguro que deseas deshacer la postulación?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, deshacer',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#ef4444'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Eliminar de aplicaciones (comparar como string)
                    currentUser.applications = (currentUser.applications || []).filter(id => String(id) != String(jobId));
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    // Actualizar usuarios globales
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const userIndex = users.findIndex(u => u.id === currentUser.id);
                    if (userIndex !== -1) {
                        users[userIndex] = currentUser;
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                    document.getElementById('offer-modal').style.display = 'none';
                    setTimeout(() => {
                        loadApplications();
                    }, 100);
                    Swal.fire('Postulación deshecha', '', 'success');
                }
            });
        };
    } else {
        document.getElementById('apply-btn').onclick = function() {
            if (!currentUser.applications) currentUser.applications = [];
            if (!currentUser.applications.includes(jobId)) {
                currentUser.applications.push(jobId);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                // Actualizar usuarios globales
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                if (userIndex !== -1) {
                    users[userIndex] = currentUser;
                    localStorage.setItem('users', JSON.stringify(users));
                }
                loadApplications();
                document.getElementById('offer-modal').style.display = 'none';
                Swal.fire('¡Postulación enviada!', '', 'success');
            }
        };
    }
    // Acción favoritos
    document.getElementById('toggle-favorite-btn').onclick = function() {
        let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        if (isFavorite) {
            favs = favs.filter(id => id !== jobId);
        } else {
            if (!favs.includes(jobId)) favs.push(jobId);
        }
        localStorage.setItem('favorites', JSON.stringify(favs));
        renderFavorites();
        renderApplicationsList();
        document.getElementById('offer-modal').style.display = 'none';
        Swal.fire(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos', '', 'success');
    };
}

document.getElementById('close-offer-modal').onclick = function() {
    document.getElementById('offer-modal').style.display = 'none';
    // Quitar selección al cerrar modal
    document.querySelectorAll('.application-card.selected').forEach(c => c.classList.remove('selected'));
};
window.addEventListener('click', function(e) {
    const modal = document.getElementById('offer-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
        document.querySelectorAll('.application-card.selected').forEach(c => c.classList.remove('selected'));
    }
});

// --- RENDER APLICACIONES Y FAVORITOS ---
function renderApplicationsList() {
    const applicationsList = document.getElementById('applications-list');
    const applications = currentUser.applications || [];
    if (applications.length === 0) {
        applicationsList.innerHTML = `<div class="empty-state"><h4>No has aplicado a ningún empleo aún</h4><p>Explora nuestras ofertas de trabajo y comienza a aplicar</p><a href="jobs.html" class="btn btn-primary">Ver Empleos</a></div>`;
        return;
    }
    applicationsList.innerHTML = applications.map(jobId => {
        const job = getJobDetailsById(jobId);
        return `
            <div class="application-card clickable" data-jobid="${jobId}">
                <div class="application-header">
                    <div class="application-info">
                        <h4>${job.title}</h4>
                        <p>${job.company}</p>
                    </div>
                    <span class="application-status status-pending">En Proceso</span>
                </div>
            </div>
        `;
    }).join('');
    // Hacer clickeables y animación de selección
    document.querySelectorAll('.application-card.clickable').forEach(card => {
        card.onclick = function() {
            document.querySelectorAll('.application-card.clickable').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const jobId = card.getAttribute('data-jobid');
            renderOfferModal(jobId, isFavorite(jobId), true);
        };
    });
}

function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favs.length === 0) {
        favoritesList.innerHTML = `<div class="empty-state"><h4>No tienes ofertas favoritas aún</h4><p>Guarda tus empleos favoritos para verlos aquí.</p></div>`;
        return;
    }
    favoritesList.innerHTML = favs.map(jobId => {
        const job = getJobDetailsById(jobId);
        return `
            <div class="application-card clickable" data-jobid="${jobId}">
                <div class="application-header">
                    <div class="application-info">
                        <h4>${job.title}</h4>
                        <p>${job.company}</p>
                    </div>
                    <span class="application-status status-favorite">Favorito</span>
                </div>
            </div>
        `;
    }).join('');
    // Hacer clickeables y animación de selección
    document.querySelectorAll('#favorites-list .application-card.clickable').forEach(card => {
        card.onclick = function() {
            document.querySelectorAll('#favorites-list .application-card.clickable').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const jobId = card.getAttribute('data-jobid');
            renderOfferModal(jobId, true, false);
        };
    });
}

function isFavorite(jobId) {
    let favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favs.includes(jobId);
}

// Sobrescribir loadApplications para usar el nuevo render
function loadApplications() {
    renderApplicationsList();
}

document.addEventListener('DOMContentLoaded', function() {
    renderFavorites();
});

function loadRecentActivity() {
    const recentActivities = document.getElementById('recent-activities');
    const applications = currentUser.applications || [];
    
    if (applications.length === 0) {
        recentActivities.innerHTML = `
            <div class="empty-state">
                <p>No hay actividad reciente</p>
            </div>
        `;
        return;
    }
    
    // Mock recent activities
    const activities = [
        {
            type: 'applied',
            title: 'Aplicaste a Desarrollador Full Stack',
            company: 'TechCorp SA',
            time: 'Hace 2 horas'
        },
        {
            type: 'interview',
            title: 'Entrevista programada para Marketing Digital',
            company: 'MarketingPro',
            time: 'Hace 1 día'
        },
        {
            type: 'rejected',
            title: 'Aplicación no seleccionada para Gerente de Ventas',
            company: 'VentasMax',
            time: 'Hace 3 días'
        }
    ].slice(0, Math.min(3, applications.length));
    
    recentActivities.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                ${activity.type === 'applied' ? '📝' : activity.type === 'interview' ? '📞' : '❌'}
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.company}</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

// Settings form submission
document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const res = await fetch('backend/update_profile.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            showMessage('Perfil actualizado correctamente', 'success');
            // Volver a consultar la sesión para refrescar los datos
            const sessionRes = await fetch('backend/session_status.php', { credentials: 'include' });
            const sessionData = await sessionRes.json();
            if (sessionData.loggedIn && sessionData.user) {
                currentUser = sessionData.user;
                loadProfileData();
            }
        } else {
            showMessage(data.message || 'Error al actualizar', 'danger');
        }
    } catch (err) {
        showMessage('Error de conexión con el servidor', 'danger');
    }
});

// CV Builder button
document.getElementById('cv-builder-btn').addEventListener('click', () => {
    showMessage('Constructor de CV próximamente disponible', 'info');
});

// Change photo button
document.getElementById('change-photo').addEventListener('click', () => {
    showMessage('Funcionalidad de cambio de foto próximamente', 'info');
});

// Download CV button
document.getElementById('download-cv').addEventListener('click', () => {
    if (currentUser.cv) {
        showMessage('Descargando CV...', 'success');
    } else {
        showMessage('Primero debes subir tu CV', 'warning');
    }
});

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}