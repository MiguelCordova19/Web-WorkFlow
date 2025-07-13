// Company Dashboard functionality
let currentCompany = null;
let companyJobs = [];
let selectedJobId = null;
let jobStatistics = {};
let statisticsUpdateInterval = null;

window.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando dashboard de empresa...');
    
    try {
        console.log('🔍 Verificando sesión...');
        const res = await fetch('../backend/session_status.php', { credentials: 'include' });
        const data = await res.json();
        console.log('📊 Datos de sesión:', data);
        
        if (!data.loggedIn || !data.user || data.user.userType !== 'empresa') {
            console.log('❌ No autenticado como empresa, redirigiendo...');
            window.location.href = '../index.html';
            return;
        }
        
        console.log('✅ Autenticado como empresa:', data.user);
        currentCompany = data.user;
        
        console.log('🔄 Cargando datos de la empresa...');
        await loadCompanyData();
        
        console.log('🔄 Inicializando pestañas...');
        initializeTabs();
        
        console.log('🔄 Cargando empleos...');
        loadCompanyJobs();
        
        console.log('🔄 Cargando aplicaciones...');
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
        console.error('❌ Error inicializando dashboard:', e);
        window.location.href = '../index.html';
    }
});

async function loadCompanyData() {
    console.log('🔄 Cargando datos de la empresa...');
    console.log('👤 Datos de la empresa:', currentCompany);
    
    // Mostrar indicador de carga
    const companyNameEl = document.getElementById('company-name');
    if (companyNameEl) {
        companyNameEl.textContent = 'Cargando...';
    }
    
    // Cargar datos actualizados de la empresa desde el backend
    try {
        const response = await fetch('../backend/update_company_profile.php', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.company) {
                // Actualizar datos de la empresa con información del backend
                Object.assign(currentCompany, data.company);
                console.log('✅ Datos de empresa actualizados desde el backend:', currentCompany);
            }
        }
    } catch (error) {
        console.error('❌ Error cargando datos de empresa desde backend:', error);
    }
    
    // Load company info
    const companyEmailEl = document.getElementById('company-email');
    if (companyNameEl) {
        companyNameEl.textContent = currentCompany.name || 'Nombre de la Empresa';
    }
    if (companyEmailEl) {
        companyEmailEl.textContent = currentCompany.email || 'empresa@ejemplo.com';
    }
    
    // Load settings form - verificar que los elementos existan antes de acceder
    const formElements = {
        'company-name-input': currentCompany.name || '',
        'company-email-input': currentCompany.email || '',
        'company-phone': currentCompany.phone || '',
        'company-website': currentCompany.website || '',
        'company-address': currentCompany.location || '',
        'company-description': currentCompany.description || '',
        'company-industry': currentCompany.industry || '',
        'company-size': currentCompany.size || ''
    };
    
    // Cargar valores en el formulario solo si los elementos existen
    Object.entries(formElements).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    });
    
    // Load company jobs from database
    try {
        console.log('🔄 Cargando empleos de la empresa...');
        const response = await fetch('../backend/get_company_jobs.php', {
            credentials: 'include'
        });
        console.log('📡 Respuesta del servidor:', response.status);
        
        const data = await response.json();
        console.log('📊 Datos recibidos:', data);
        
        if (data.success) {
            companyJobs = data.jobs;
            console.log('✅ Empleos cargados:', companyJobs.length);
        } else {
            console.error('❌ Error loading jobs:', data.message);
            companyJobs = [];
        }
    } catch (error) {
        console.error('❌ Error fetching jobs:', error);
        companyJobs = [];
    }
    
    // Update stats
    updateDashboardStats();
    
    // Load and start dynamic statistics updates
    await loadJobStatistics();
    startStatisticsUpdates();
}

async function loadJobStatistics() {
    try {
        console.log('📊 Cargando estadísticas dinámicas...');
        const response = await fetch('../backend/get_job_statistics.php', {
            credentials: 'include'
        });
        console.log('📡 Respuesta del servidor:', response.status);
        
        const data = await response.json();
        console.log('📊 Datos recibidos:', data);
        
        if (data.success) {
            jobStatistics = data.statistics;
            console.log('✅ Estadísticas cargadas:', jobStatistics);
            updateDashboardStats();
            updateJobStatistics();
        } else {
            console.error('❌ Error cargando estadísticas:', data.message);
        }
    } catch (error) {
        console.error('❌ Error fetching statistics:', error);
        // En caso de error, usar datos de prueba
        jobStatistics = {
            jobs: [
                {
                    job_id: 1,
                    applications: Math.floor(Math.random() * 20) + 5,
                    views: Math.floor(Math.random() * 400) + 100,
                    in_process: Math.floor(Math.random() * 10) + 2,
                    recent_applications: Math.floor(Math.random() * 5)
                },
                {
                    job_id: 2,
                    applications: Math.floor(Math.random() * 30) + 8,
                    views: Math.floor(Math.random() * 600) + 150,
                    in_process: Math.floor(Math.random() * 15) + 3,
                    recent_applications: Math.floor(Math.random() * 8)
                }
            ],
            total_applications: 0,
            total_views: 0,
            recent_total: 0
        };
        
        // Calcular totales
        jobStatistics.jobs.forEach(job => {
            jobStatistics.total_applications += job.applications;
            jobStatistics.total_views += job.views;
            jobStatistics.recent_total += job.recent_applications;
        });
        
        updateDashboardStats();
        updateJobStatistics();
    }
}

function updateDashboardStats() {
    const totalJobs = companyJobs.length;
    const activeJobs = companyJobs.filter(job => job.status === 'active').length;
    const totalApplications = jobStatistics.total_applications || companyJobs.reduce((sum, job) => sum + (job.applications || 0), 0);
    const hiredCandidates = Math.floor(totalApplications * 0.1); // Mock data
    
    const totalJobsEl = document.getElementById('total-jobs');
    const activeJobsEl = document.getElementById('active-jobs');
    const totalApplicationsEl = document.getElementById('total-applications');
    const hiredCandidatesEl = document.getElementById('hired-candidates');
    
    if (totalJobsEl) totalJobsEl.textContent = totalJobs;
    if (activeJobsEl) activeJobsEl.textContent = activeJobs;
    if (totalApplicationsEl) totalApplicationsEl.textContent = totalApplications;
    if (hiredCandidatesEl) hiredCandidatesEl.textContent = hiredCandidates;
}

function updateJobStatistics() {
    console.log('🔄 Actualizando estadísticas de empleos...');
    console.log('📊 Estadísticas disponibles:', jobStatistics);
    
    if (!jobStatistics.jobs || jobStatistics.jobs.length === 0) {
        console.log('⚠️ No hay estadísticas de empleos disponibles');
        return;
    }
    
    let hasUpdates = false;
    
    // Actualizar estadísticas de cada empleo
    jobStatistics.jobs.forEach(jobStat => {
        console.log(`📋 Actualizando empleo ID ${jobStat.job_id}:`, jobStat);
        
        const jobElement = document.querySelector(`[data-job-id="${jobStat.job_id}"]`);
        if (jobElement) {
            console.log(`✅ Encontrado elemento para empleo ${jobStat.job_id}`);
            
            // Actualizar contadores
            const applicationsEl = jobElement.querySelector('.applications-count');
            const viewsEl = jobElement.querySelector('.views-count');
            const processEl = jobElement.querySelector('.process-count');
            
            if (applicationsEl) {
                const oldValue = parseInt(applicationsEl.textContent.replace(/[^\d]/g, '')) || 0;
                const newValue = jobStat.applications;
                
                console.log(`📝 Aplicaciones: ${oldValue} → ${newValue}`);
                
                if (newValue !== oldValue) {
                    hasUpdates = true;
                    applicationsEl.classList.add('updating');
                    
                    // Agregar indicador de nuevas aplicaciones
                    if (jobStat.recent_applications > 0) {
                        applicationsEl.innerHTML = `${newValue} <span class="badge bg-success">+${jobStat.recent_applications}</span>`;
                        console.log(`🆕 Nuevas aplicaciones: +${jobStat.recent_applications}`);
                    } else {
                        applicationsEl.textContent = newValue;
                    }
                    
                    // Remover clase de actualización después de un tiempo
                    setTimeout(() => {
                        applicationsEl.classList.remove('updating');
                    }, 2000);
                }
            } else {
                console.log(`❌ No se encontró elemento de aplicaciones para empleo ${jobStat.job_id}`);
            }
            
            if (viewsEl) {
                const oldValue = parseInt(viewsEl.textContent) || 0;
                const newValue = jobStat.views;
                
                console.log(`👁️ Visualizaciones: ${oldValue} → ${newValue}`);
                
                if (newValue !== oldValue) {
                    hasUpdates = true;
                    viewsEl.classList.add('updating');
                    viewsEl.textContent = newValue;
                    
                    setTimeout(() => {
                        viewsEl.classList.remove('updating');
                    }, 2000);
                }
            }
            
            if (processEl) {
                const oldValue = parseInt(processEl.textContent) || 0;
                const newValue = jobStat.in_process;
                
                console.log(`🔄 En proceso: ${oldValue} → ${newValue}`);
                
                if (newValue !== oldValue) {
                    hasUpdates = true;
                    processEl.classList.add('updating');
                    processEl.textContent = newValue;
                    
                    setTimeout(() => {
                        processEl.classList.remove('updating');
                    }, 2000);
                }
            }
        } else {
            console.log(`❌ No se encontró elemento para empleo ${jobStat.job_id}`);
        }
    });
    
    // Mostrar indicador de actualización si hay cambios
    if (hasUpdates) {
        console.log('🎉 Se detectaron cambios, mostrando indicador');
        showRealtimeIndicator();
    } else {
        console.log('📊 No se detectaron cambios en las estadísticas');
    }
}

function showRealtimeIndicator() {
    // Remover indicador existente si hay uno
    const existingIndicator = document.querySelector('.realtime-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Crear nuevo indicador
    const indicator = document.createElement('div');
    indicator.className = 'realtime-indicator';
    indicator.innerHTML = '🔄 Actualizando estadísticas...';
    
    document.body.appendChild(indicator);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        indicator.remove();
    }, 3000);
}

function startStatisticsUpdates() {
    // Actualizar estadísticas cada 5 segundos para pruebas
    statisticsUpdateInterval = setInterval(() => {
        console.log('🔄 Actualizando estadísticas automáticamente...');
        updateStatisticsWithRandomData();
    }, 5000); // 5 segundos para pruebas
    
    console.log('🔄 Actualizaciones automáticas iniciadas (cada 5s)');
    
    // También actualizar inmediatamente después de 2 segundos
    setTimeout(() => {
        console.log('🔄 Primera actualización automática...');
        updateStatisticsWithRandomData();
    }, 2000);
}

function updateStatisticsWithRandomData() {
    // Generar datos aleatorios para simular actualizaciones dinámicas
    if (companyJobs.length > 0) {
        companyJobs.forEach((job, index) => {
            // Actualizar estadísticas con valores aleatorios
            job.applications = Math.floor(Math.random() * 50) + 5;
            job.views = Math.floor(Math.random() * 800) + 100;
            
            // Actualizar el elemento en el DOM
            const jobElement = document.querySelector(`[data-job-id="${job.id}"]`);
            if (jobElement) {
                const applicationsEl = jobElement.querySelector('.applications-count');
                const viewsEl = jobElement.querySelector('.views-count');
                const processEl = jobElement.querySelector('.process-count');
                
                if (applicationsEl) {
                    const oldValue = parseInt(applicationsEl.textContent.replace(/[^\d]/g, '')) || 0;
                    if (job.applications !== oldValue) {
                        applicationsEl.classList.add('updating');
                        applicationsEl.textContent = job.applications;
                        
                        // Agregar badge de nuevas aplicaciones
                        const newApplications = Math.floor(Math.random() * 5) + 1;
                        if (newApplications > 0) {
                            applicationsEl.innerHTML = `${job.applications} <span class="badge bg-success">+${newApplications}</span>`;
                        }
                        
                        setTimeout(() => {
                            applicationsEl.classList.remove('updating');
                        }, 2000);
                    }
                }
                
                if (viewsEl) {
                    const oldValue = parseInt(viewsEl.textContent) || 0;
                    if (job.views !== oldValue) {
                        viewsEl.classList.add('updating');
                        viewsEl.textContent = job.views;
                        
                        setTimeout(() => {
                            viewsEl.classList.remove('updating');
                        }, 2000);
                    }
                }
                
                if (processEl) {
                    const processValue = Math.floor(job.applications * 0.3);
                    processEl.classList.add('updating');
                    processEl.textContent = processValue;
                    
                    setTimeout(() => {
                        processEl.classList.remove('updating');
                    }, 2000);
                }
            };
        });
        
        // Actualizar estadísticas del dashboard
        updateDashboardStats();
        showRealtimeIndicator();
    }
}

function stopStatisticsUpdates() {
    if (statisticsUpdateInterval) {
        clearInterval(statisticsUpdateInterval);
        statisticsUpdateInterval = null;
        console.log('⏹️ Actualizaciones automáticas detenidas');
    }
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
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function loadCompanyJobs() {
    console.log('🔄 Cargando lista de empleos...');
    console.log('📊 Empleos disponibles:', companyJobs);
    
    const jobsList = document.getElementById('company-jobs-list');
    if (!jobsList) {
        console.error('❌ No se encontró el elemento company-jobs-list');
        return;
    }
    
    if (companyJobs.length === 0) {
        console.log('⚠️ No hay empleos para mostrar');
        jobsList.innerHTML = `
            <div class="empty-state">
                <h4>📋 No has publicado empleos aún</h4>
                <p>Comienza publicando tu primer empleo para atraer candidatos</p>
                <button class="btn btn-primary" onclick="window.location.href='post-job.html'">Publicar Primer Empleo</button>
            </div>
        `;
        return;
    }
    
    jobsList.innerHTML = companyJobs.map(job => `
        <div class="job-item" data-job-id="${job.id}">
            <div class="job-header">
                <div class="job-info">
                    <h4>${job.title}</h4>
                    <div class="job-meta">
                        <span>📍 ${job.location}</span>
                        <span>💰 ${job.salary}</span>
                        <span>⏰ ${job.type ? job.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Tiempo completo'}</span>
                        <span>📅 Publicado: ${new Date(job.created_at || job.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div class="job-details">
                        ${job.category ? `<span class="badge bg-secondary">${job.category}</span>` : ''}
                        ${job.experience_level ? `<span class="badge bg-info">${job.experience_level}</span>` : ''}
                        ${job.skills ? `<span class="badge bg-light text-dark">${job.skills}</span>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="job-status status-${job.status || 'active'}">
                        ${job.status === 'active' ? '✅ Activo' : job.status === 'paused' ? '⏸️ Pausado' : '❌ Cerrado'}
                    </span>
                    <button class="job-actions-btn" onclick="openJobActions(${job.id})">⋮</button>
                </div>
            </div>
            <div class="job-stats">
                <div class="job-stat">
                    <div class="number applications-count">${job.applications || 0}</div>
                    <div class="label">📝 Aplicaciones</div>
                </div>
                <div class="job-stat">
                    <div class="number views-count">${job.views || 0}</div>
                    <div class="label">👁️ Visualizaciones</div>
                </div>
                <div class="job-stat">
                    <div class="number process-count">${Math.floor((job.applications || 0) * 0.2)}</div>
                    <div class="label">🔄 En Proceso</div>
                </div>
            </div>
            <div style="margin-top: 1rem; text-align: right;">
                <button class="btn btn-outline-primary" onclick="window.location.href='gestionar-postulantes.html'">👥 Gestionar Postulantes</button>
                <button class="btn btn-outline-secondary" onclick="editJob(${job.id})">✏️ Editar</button>
            </div>
        </div>
    `).join('');
    
    // Actualizar estadísticas después de renderizar
    updateJobStatistics();
}

function loadApplications() {
    const applicationsList = document.getElementById('applications-list');
    const jobFilter = document.getElementById('job-filter');
    
    if (!applicationsList) {
        console.error('❌ No se encontró el elemento applications-list');
        return;
    }
    
    // Populate job filter
    if (jobFilter) {
        jobFilter.innerHTML = '<option value="">Todos los empleos</option>' + 
            companyJobs.map(job => `<option value="${job.id}">${job.title}</option>`).join('');
    }
    
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
    const jobFilterEl = document.getElementById('job-filter');
    const statusFilterEl = document.getElementById('status-filter');
    const expFilterEl = document.getElementById('filter-experience');
    const eduFilterEl = document.getElementById('filter-education');
    const skillsFilterEl = document.getElementById('filter-skills');
    
    if (jobFilterEl) jobFilterEl.addEventListener('change', filterApplications);
    if (statusFilterEl) statusFilterEl.addEventListener('change', filterApplications);
    if (expFilterEl) expFilterEl.addEventListener('input', filterApplications);
    if (eduFilterEl) eduFilterEl.addEventListener('input', filterApplications);
    if (skillsFilterEl) skillsFilterEl.addEventListener('input', filterApplications);
    
    function filterApplications() {
        const jobFilter = jobFilterEl ? jobFilterEl.value : '';
        const statusFilter = statusFilterEl ? statusFilterEl.value : '';
        const expFilter = expFilterEl ? expFilterEl.value.trim().toLowerCase() : '';
        const eduFilter = eduFilterEl ? eduFilterEl.value.trim().toLowerCase() : '';
        const skillsFilter = skillsFilterEl ? skillsFilterEl.value.trim().toLowerCase() : '';

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
    if (modal) {
        modal.style.display = 'block';
    }
}

// Job action functions
function editJob(jobId) {
    showMessage('Funcionalidad de edición próximamente', 'info');
    console.log('Editando empleo con ID:', jobId);
    closeModal();
}

function viewApplications() {
    // Switch to applications tab and filter by job
    const applicationsTab = document.querySelector('[data-tab="applications"]');
    if (applicationsTab) {
        applicationsTab.click();
    }
    const jobFilter = document.getElementById('job-filter');
    if (jobFilter) {
        jobFilter.value = selectedJobId;
        jobFilter.dispatchEvent(new Event('change'));
    }
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
    if (currentCompany && currentCompany.id) {
        localStorage.setItem(`company_jobs_${currentCompany.id}`, JSON.stringify(companyJobs));
    }
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
const companySettingsForm = document.getElementById('company-settings-form');
if (companySettingsForm) {
    companySettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', document.getElementById('company-name-input')?.value || '');
        formData.append('email', document.getElementById('company-email-input')?.value || '');
        formData.append('phone', document.getElementById('company-phone')?.value || '');
        formData.append('website', document.getElementById('company-website')?.value || '');
        formData.append('location', document.getElementById('company-address')?.value || '');
        formData.append('description', document.getElementById('company-description')?.value || '');
        
        try {
            const response = await fetch('../backend/update_company_profile.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage('Información de empresa actualizada correctamente', 'success');
                // Recargar datos de la empresa
                await loadCompanyData();
            } else {
                showMessage('Error al actualizar: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error updating company profile:', error);
            showMessage('Error al actualizar el perfil', 'error');
        }
    });
}

// Modal functionality
document.addEventListener('click', (e) => {
    const modal = document.getElementById('job-actions-modal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

function closeModal() {
    const modal = document.getElementById('job-actions-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Add event listeners for job actions
const editJobBtn = document.getElementById('edit-job');
const viewApplicationsBtn = document.getElementById('view-applications');
const pauseJobBtn = document.getElementById('pause-job');
const deleteJobBtn = document.getElementById('delete-job');

if (editJobBtn) editJobBtn.addEventListener('click', editJob);
if (viewApplicationsBtn) viewApplicationsBtn.addEventListener('click', viewApplications);
if (pauseJobBtn) pauseJobBtn.addEventListener('click', pauseJob);
if (deleteJobBtn) deleteJobBtn.addEventListener('click', deleteJob);

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Función de prueba para estadísticas
function testStatistics() {
    console.log('🧪 Probando estadísticas dinámicas...');
    
    // Forzar una actualización inmediata
    updateStatisticsWithRandomData();
    
    // Mostrar mensaje de éxito
    showMessage('¡Estadísticas actualizadas!', 'success');
}

// Función para recargar datos de la empresa
async function reloadCompanyData() {
    console.log('🔄 Recargando datos de la empresa...');
    
    try {
        // Recargar datos de la empresa
        await loadCompanyData();
        
        // Recargar empleos
        loadCompanyJobs();
        
        // Recargar aplicaciones
        loadApplications();
        
        showMessage('Datos recargados correctamente', 'success');
    } catch (error) {
        console.error('❌ Error recargando datos:', error);
        showMessage('Error al recargar datos', 'error');
    }
}

// Limpiar actualizaciones cuando se cierre la página
window.addEventListener('beforeunload', () => {
    stopStatisticsUpdates();
});
