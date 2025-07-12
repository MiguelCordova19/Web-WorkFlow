// Company Dashboard functionality
let currentCompany = null;
let companyJobs = [];
let selectedJobId = null;

window.addEventListener('DOMContentLoaded', async function() {
    try {
        const res = await fetch('backend/session_status.php', { credentials: 'include' });
        const data = await res.json();
        if (!data.loggedIn || !data.user || data.user.userType !== 'empresa') {
            window.location.href = 'index.html';
            return;
        }
        currentCompany = data.user;
        loadCompanyData();
        initializeTabs();
        loadCompanyJobs();
        loadApplications();
        // --- Lógica para el formulario de vacantes ---
        const jobForm = document.getElementById('job-form');
        if (jobForm) {
            jobForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Validar campos
                const title = document.getElementById('job-title').value.trim();
                const location = document.getElementById('job-location').value.trim();
                const salary = document.getElementById('job-salary').value.trim();
                const type = document.getElementById('job-type').value;
                const benefits = document.getElementById('job-benefits').value.trim();
                const description = document.getElementById('job-description').value.trim();
                if (!title || !location || !salary || !type || !description) {
                    alert('Por favor, completa todos los campos obligatorios.');
                    return;
                }
                // Crear objeto de vacante
                const newJob = {
                    id: Date.now(),
                    title,
                    location,
                    salary,
                    type,
                    benefits,
                    description,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    applications: 0,
                    views: 0
                };
                // Guardar en localStorage
                companyJobs.unshift(newJob);
                localStorage.setItem(`company_jobs_${currentCompany.id}`, JSON.stringify(companyJobs));
                // Limpiar formulario
                jobForm.reset();
                // Actualizar lista
                loadCompanyJobs();
                // Mensaje de éxito
                alert('Vacante publicada exitosamente.');
            });
        }
        // --- Fin lógica formulario vacantes ---
    } catch (e) {
        window.location.href = 'index.html';
    }
});

function loadCompanyData() {
    // Load company info
    document.getElementById('company-name').textContent = currentCompany.name;
    document.getElementById('company-email').textContent = currentCompany.email;
    
    // Load settings form
    document.getElementById('company-name-input').value = currentCompany.name || '';
    document.getElementById('company-email-input').value = currentCompany.email || '';
    document.getElementById('company-phone').value = currentCompany.phone || '';
    document.getElementById('company-website').value = currentCompany.website || '';
    document.getElementById('company-address').value = currentCompany.address || '';
    document.getElementById('company-description').value = currentCompany.description || '';
    document.getElementById('company-industry').value = currentCompany.industry || '';
    document.getElementById('company-size').value = currentCompany.size || '';
    
    // Load company jobs from localStorage
    companyJobs = JSON.parse(localStorage.getItem(`company_jobs_${currentCompany.id}`) || '[]');
    
    // Update stats
    updateDashboardStats();
}

function updateDashboardStats() {
    const totalJobs = companyJobs.length;
    const activeJobs = companyJobs.filter(job => job.status === 'active').length;
    const totalApplications = companyJobs.reduce((sum, job) => sum + (job.applications || 0), 0);
    const hiredCandidates = Math.floor(totalApplications * 0.1); // Mock data
    
    document.getElementById('total-jobs').textContent = totalJobs;
    document.getElementById('active-jobs').textContent = activeJobs;
    document.getElementById('total-applications').textContent = totalApplications;
    document.getElementById('hired-candidates').textContent = hiredCandidates;
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

function loadCompanyJobs() {
    const jobsList = document.getElementById('company-jobs-list');
    
    if (companyJobs.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                <h4>No has publicado empleos aún</h4>
                <p>Comienza publicando tu primer empleo para atraer candidatos</p>
                <button class="btn btn-primary" onclick="window.location.href='post-job.html'">Publicar Primer Empleo</button>
            </div>
        `;
        return;
    }
    
    jobsList.innerHTML = companyJobs.map(job => `
        <div class="job-item">
            <div class="job-header">
                <div class="job-info">
                    <h4>${job.title}</h4>
                    <div class="job-meta">
                        <span>📍 ${job.location}</span>
                        <span>💰 ${job.salary}</span>
                        <span>📅 Publicado: ${new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="job-status status-${job.status}">
                        ${job.status === 'active' ? 'Activo' : job.status === 'paused' ? 'Pausado' : 'Cerrado'}
                    </span>
                    <button class="job-actions-btn" onclick="openJobActions(${job.id})">⋮</button>
                </div>
            </div>
            <div class="job-stats">
                <div class="job-stat">
                    <div class="number">${job.applications || 0}</div>
                    <div class="label">Aplicaciones</div>
                </div>
                <div class="job-stat">
                    <div class="number">${job.views || 0}</div>
                    <div class="label">Visualizaciones</div>
                </div>
                <div class="job-stat">
                    <div class="number">${Math.floor((job.applications || 0) * 0.2)}</div>
                    <div class="label">En Proceso</div>
                </div>
            </div>
            <div style="margin-top: 1rem; text-align: right;">
                <button class="btn btn-outline-primary" onclick="window.location.href='gestionar-postulantes.html'">Gestionar Postulantes</button>
            </div>
        </div>
    `).join('');
}

function loadApplications() {
    const applicationsList = document.getElementById('applications-list');
    const jobFilter = document.getElementById('job-filter');
    
    // Populate job filter
    jobFilter.innerHTML = '<option value="">Todos los empleos</option>' + 
        companyJobs.map(job => `<option value="${job.id}">${job.title}</option>`).join('');
    
    // Mock applications data
    const mockApplications = [];
    const experienciaEjemplo = ['1 año', '2 años', '3 años', '5 años'];
    const estudiosEjemplo = ['Licenciatura', 'Maestría', 'Ingeniería', 'Técnico'];
    const habilidadesEjemplo = [
        ['JavaScript', 'Trabajo en equipo'],
        ['Python', 'Liderazgo'],
        ['SQL', 'Comunicación'],
        ['Java', 'Resolución de problemas'],
        ['React', 'Creatividad']
    ];
    companyJobs.forEach(job => {
        const applicationCount = job.applications || 0;
        for (let i = 0; i < applicationCount; i++) {
            const exp = experienciaEjemplo[i % experienciaEjemplo.length];
            const edu = estudiosEjemplo[i % estudiosEjemplo.length];
            const skills = habilidadesEjemplo[i % habilidadesEjemplo.length];
            mockApplications.push({
                id: Date.now() + Math.random(),
                jobId: job.id,
                jobTitle: job.title,
                candidateName: `Candidato ${i + 1}`,
                candidateEmail: `candidato${i + 1}@email.com`,
                appliedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                status: ['pending', 'reviewing', 'interview', 'accepted', 'rejected'][Math.floor(Math.random() * 5)],
                experiencia: exp,
                estudios: edu,
                habilidades: skills
            });
        }
    });
    
    if (mockApplications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-state">
                <h4>No hay aplicaciones aún</h4>
                <p>Las aplicaciones aparecerán aquí cuando los candidatos se postulen a tus empleos</p>
            </div>
        `;
        return;
    }
    
    function renderApplications(applications) {
        applicationsList.innerHTML = applications.map(app => `
            <div class="application-item">
                <div class="applicant-info">
                    <div class="applicant-avatar">
                        ${app.candidateName.charAt(0)}
                    </div>
                    <div class="applicant-details">
                        <h4>${app.candidateName}</h4>
                        <p>${app.jobTitle} • Aplicó el ${app.appliedDate}</p>
                    </div>
                </div>
                <div class="application-actions">
                    <button class="btn btn-sm btn-outline" onclick="viewCandidate('${app.id}')">Ver Perfil</button>
                    <button class="btn btn-sm btn-success" onclick="acceptApplication('${app.id}')">Aceptar</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectApplication('${app.id}')">Rechazar</button>
                </div>
            </div>
        `).join('');
    }
    
    renderApplications(mockApplications);
    
    // Add filter functionality
    document.getElementById('job-filter').addEventListener('change', filterApplications);
    document.getElementById('status-filter').addEventListener('change', filterApplications);
    document.getElementById('filter-experience').addEventListener('input', filterApplications);
    document.getElementById('filter-education').addEventListener('input', filterApplications);
    document.getElementById('filter-skills').addEventListener('input', filterApplications);
    
    function filterApplications() {
        const jobFilter = document.getElementById('job-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        const expFilter = document.getElementById('filter-experience').value.trim().toLowerCase();
        const eduFilter = document.getElementById('filter-education').value.trim().toLowerCase();
        const skillsFilter = document.getElementById('filter-skills').value.trim().toLowerCase();

        let filteredApplications = mockApplications;

        if (jobFilter) {
            filteredApplications = filteredApplications.filter(app => app.jobId == jobFilter);
        }
        if (statusFilter) {
            filteredApplications = filteredApplications.filter(app => app.status === statusFilter);
        }
        if (expFilter) {
            filteredApplications = filteredApplications.filter(app => app.experiencia.toLowerCase().includes(expFilter));
        }
        if (eduFilter) {
            filteredApplications = filteredApplications.filter(app => app.estudios.toLowerCase().includes(eduFilter));
        }
        if (skillsFilter) {
            filteredApplications = filteredApplications.filter(app =>
                app.habilidades.some(skill => skill.toLowerCase().includes(skillsFilter))
            );
        }
        renderApplications(filteredApplications);
    }
}

function openJobActions(jobId) {
    selectedJobId = jobId;
    const modal = document.getElementById('job-actions-modal');
    modal.style.display = 'block';
}

// Job action functions
function editJob() {
    showMessage('Funcionalidad de edición próximamente', 'info');
    closeModal();
}

function viewApplications() {
    // Switch to applications tab and filter by job
    document.querySelector('[data-tab="applications"]').click();
    document.getElementById('job-filter').value = selectedJobId;
    document.getElementById('job-filter').dispatchEvent(new Event('change'));
    closeModal();
}

function pauseJob() {
    const job = companyJobs.find(j => j.id === selectedJobId);
    if (job) {
        job.status = job.status === 'active' ? 'paused' : 'active';
        saveCompanyJobs();
        loadCompanyJobs();
        updateDashboardStats();
        showMessage(`Empleo ${job.status === 'active' ? 'activado' : 'pausado'} correctamente`, 'success');
    }
    closeModal();
}

function deleteJob() {
    if (confirm('¿Estás seguro de que quieres eliminar este empleo?')) {
        companyJobs = companyJobs.filter(j => j.id !== selectedJobId);
        saveCompanyJobs();
        loadCompanyJobs();
        updateDashboardStats();
        showMessage('Empleo eliminado correctamente', 'success');
    }
    closeModal();
}

function saveCompanyJobs() {
    localStorage.setItem(`company_jobs_${currentCompany.id}`, JSON.stringify(companyJobs));
}

// Application action functions
function viewCandidate(applicationId) {
    showMessage('Funcionalidad de ver perfil próximamente', 'info');
}

function acceptApplication(applicationId) {
    showMessage('Aplicación aceptada', 'success');
}

function rejectApplication(applicationId) {
    showMessage('Aplicación rechazada', 'info');
}

// Settings form submission
document.getElementById('company-settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const updatedData = {
        name: document.getElementById('company-name-input').value,
        email: document.getElementById('company-email-input').value,
        phone: document.getElementById('company-phone').value,
        website: document.getElementById('company-website').value,
        address: document.getElementById('company-address').value,
        description: document.getElementById('company-description').value,
        industry: document.getElementById('company-industry').value,
        size: document.getElementById('company-size').value
    };
    
    // Update current user
    Object.assign(currentCompany, updatedData);
    
    // Update localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentCompany.id);
    if (userIndex !== -1) {
        users[userIndex] = currentCompany;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentCompany));
    }
    
    showMessage('Información de empresa actualizada correctamente', 'success');
    loadCompanyData();
});

// Modal functionality
document.addEventListener('click', (e) => {
    const modal = document.getElementById('job-actions-modal');
    if (e.target === modal) {
        closeModal();
    }
});

document.querySelector('.close').addEventListener('click', closeModal);

function closeModal() {
    document.getElementById('job-actions-modal').style.display = 'none';
}

// Add event listeners for job actions
document.getElementById('edit-job').addEventListener('click', editJob);
document.getElementById('view-applications').addEventListener('click', viewApplications);
document.getElementById('pause-job').addEventListener('click', pauseJob);
document.getElementById('delete-job').addEventListener('click', deleteJob);

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}