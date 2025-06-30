// Jobs page functionality
let currentUser = null;
let allJobs = [];
let filteredJobs = [];
let currentPage = 1;
const jobsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    currentUser = initializeAuth();
    updateAuthUI();
    
    loadJobs();
    initializeSearch();
    initializeFilters();
    initializePagination();
});

function loadJobs() {
    // Load jobs from localStorage (both sample data and company-posted jobs)
    const sampleJobs = [
        {
            id: 1,
            title: "Desarrollador Full Stack Senior",
            company: "TechCorp SA",
            location: "Buenos Aires, Argentina",
            type: "tiempo-completo",
            category: "tecnologia",
            experienceLevel: "senior",
            salaryMin: 80000,
            salaryMax: 120000,
            currency: "ARS",
            period: "mensual",
            description: "Buscamos un desarrollador full stack senior para unirse a nuestro equipo de desarrollo. Trabajarás en proyectos innovadores utilizando las últimas tecnologías.",
            requirements: "5+ años de experiencia en desarrollo web, conocimiento en React, Node.js, bases de datos SQL y NoSQL.",
            skills: "JavaScript, React, Node.js, MongoDB, PostgreSQL",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            companyId: 'sample',
            companyName: "TechCorp SA"
        },
        {
            id: 2,
            title: "Especialista en Marketing Digital",
            company: "MarketingPro",
            location: "Córdoba, Argentina",
            type: "tiempo-completo",
            category: "marketing",
            experienceLevel: "semi-senior",
            salaryMin: 60000,
            salaryMax: 90000,
            currency: "ARS",
            period: "mensual",
            description: "Únete a nuestro equipo de marketing digital y ayuda a crear campañas innovadoras que impulsen el crecimiento de nuestros clientes.",
            requirements: "3+ años de experiencia en marketing digital, conocimiento en Google Ads, Facebook Ads, SEO y analytics.",
            skills: "Google Ads, Facebook Ads, SEO, Google Analytics, Content Marketing",
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            companyId: 'sample',
            companyName: "MarketingPro"
        },
        {
            id: 3,
            title: "Gerente de Ventas",
            company: "VentasMax",
            location: "Rosario, Argentina",
            type: "tiempo-completo",
            category: "ventas",
            experienceLevel: "senior",
            salaryMin: 100000,
            salaryMax: 150000,
            currency: "ARS",
            period: "mensual",
            description: "Buscamos un gerente de ventas experimentado para liderar nuestro equipo comercial y desarrollar nuevas estrategias de crecimiento.",
            requirements: "7+ años de experiencia en ventas, experiencia liderando equipos, conocimiento del mercado B2B.",
            skills: "Liderazgo, Ventas B2B, CRM, Negociación, Estrategia Comercial",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            companyId: 'sample',
            companyName: "VentasMax"
        }
    ];
    
    // Load company-posted jobs
    const companyJobs = JSON.parse(localStorage.getItem('all_jobs') || '[]');
    
    // Combine sample jobs with company jobs
    allJobs = [...sampleJobs, ...companyJobs];
    filteredJobs = [...allJobs];
    
    renderJobs();
    updateResultsInfo();
}

function renderJobs() {
    const jobsList = document.getElementById('jobs-list');
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const jobsToShow = filteredJobs.slice(startIndex, endIndex);
    
    if (jobsToShow.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                <h3>No se encontraron empleos</h3>
                <p>Intenta ajustar tus filtros de búsqueda o explora otras categorías</p>
                <button class="btn btn-primary" onclick="clearAllFilters()">Limpiar Filtros</button>
            </div>
        `;
        return;
    }
    
    jobsList.innerHTML = jobsToShow.map(job => `
        <div class="job-card" onclick="openJobDetail(${job.id})">
            <div class="job-card-header">
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <div class="job-company">${job.companyName || job.company}</div>
                    <div class="job-meta">
                        <span>📍 ${job.location}</span>
                        <span>⏰ ${formatJobType(job.type)}</span>
                        <span>📅 ${formatDate(job.createdAt)}</span>
                        ${job.experienceLevel ? `<span>🎯 ${formatExperience(job.experienceLevel)}</span>` : ''}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="job-type-badge type-${job.type}">
                        ${formatJobType(job.type)}
                    </div>
                    <div class="job-posted">${getTimeAgo(job.createdAt)}</div>
                </div>
            </div>
            
            <div class="job-description">
                ${job.description}
            </div>
            
            ${job.skills ? `
                <div class="job-skills">
                    ${job.skills.split(',').map(skill => 
                        `<span class="skill-tag">${skill.trim()}</span>`
                    ).join('')}
                </div>
            ` : ''}
            
            <div class="job-actions">
                <div class="job-salary">
                    ${formatSalary(job)}
                </div>
                <button class="btn btn-primary" onclick="event.stopPropagation(); applyToJob(${job.id})">
                    ${currentUser ? 'Aplicar' : 'Inicia sesión para aplicar'}
                </button>
            </div>
        </div>
    `).join('');
    
    updatePagination();
}

function formatJobType(type) {
    const types = {
        'tiempo-completo': 'Tiempo Completo',
        'medio-tiempo': 'Medio Tiempo',
        'freelance': 'Freelance',
        'remoto': 'Remoto',
        'hibrido': 'Híbrido'
    };
    return types[type] || type;
}

function formatExperience(level) {
    const levels = {
        'junior': 'Junior',
        'semi-senior': 'Semi Senior',
        'senior': 'Senior',
        'lead': 'Lead/Manager'
    };
    return levels[level] || level;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES');
}

function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
}

function formatSalary(job) {
    if (!job.salaryMin && !job.salaryMax) return 'Salario a convenir';
    
    const symbol = job.currency === 'USD' ? 'US$' : job.currency === 'EUR' ? '€' : '$';
    
    if (job.salaryMin && job.salaryMax) {
        return `${symbol}${job.salaryMin.toLocaleString()} - ${symbol}${job.salaryMax.toLocaleString()}`;
    } else if (job.salaryMin) {
        return `Desde ${symbol}${job.salaryMin.toLocaleString()}`;
    } else {
        return `Hasta ${symbol}${job.salaryMax.toLocaleString()}`;
    }
}

function initializeSearch() {
    const searchBtn = document.getElementById('search-jobs');
    const jobSearch = document.getElementById('job-search');
    const locationSearch = document.getElementById('location-search');
    
    searchBtn.addEventListener('click', performSearch);
    
    // Search on Enter key
    [jobSearch, locationSearch].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    });
}

function performSearch() {
    const jobTitle = document.getElementById('job-search').value.toLowerCase();
    const location = document.getElementById('location-search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    
    filteredJobs = allJobs.filter(job => {
        const titleMatch = !jobTitle || job.title.toLowerCase().includes(jobTitle);
        const locationMatch = !location || job.location.toLowerCase().includes(location);
        const categoryMatch = !category || job.category === category;
        
        return titleMatch && locationMatch && categoryMatch;
    });
    
    applyFilters();
    currentPage = 1;
    renderJobs();
    updateResultsInfo();
}

function initializeFilters() {
    const filters = ['type-filter', 'experience-filter', 'salary-filter'];
    
    filters.forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', applyFilters);
    });
    
    document.getElementById('clear-filters').addEventListener('click', clearAllFilters);
    document.getElementById('sort-by').addEventListener('change', applySorting);
}

function applyFilters() {
    const typeFilter = document.getElementById('type-filter').value;
    const experienceFilter = document.getElementById('experience-filter').value;
    const salaryFilter = document.getElementById('salary-filter').value;
    
    let filtered = [...filteredJobs];
    
    if (typeFilter) {
        filtered = filtered.filter(job => job.type === typeFilter);
    }
    
    if (experienceFilter) {
        filtered = filtered.filter(job => job.experienceLevel === experienceFilter);
    }
    
    if (salaryFilter) {
        filtered = filtered.filter(job => {
            const [min, max] = salaryFilter.split('-').map(s => s.replace('+', ''));
            const jobSalary = job.salaryMax || job.salaryMin || 0;
            
            if (salaryFilter.includes('+')) {
                return jobSalary >= parseInt(min);
            } else {
                return jobSalary >= parseInt(min) && jobSalary <= parseInt(max);
            }
        });
    }
    
    filteredJobs = filtered;
    applySorting();
}

function applySorting() {
    const sortBy = document.getElementById('sort-by').value;
    
    switch (sortBy) {
        case 'newest':
            filteredJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            filteredJobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'salary-high':
            filteredJobs.sort((a, b) => (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0));
            break;
        case 'salary-low':
            filteredJobs.sort((a, b) => (a.salaryMin || a.salaryMax || 0) - (b.salaryMin || b.salaryMax || 0));
            break;
        case 'relevance':
            // Simple relevance based on title match
            const searchTerm = document.getElementById('job-search').value.toLowerCase();
            if (searchTerm) {
                filteredJobs.sort((a, b) => {
                    const aRelevance = a.title.toLowerCase().includes(searchTerm) ? 1 : 0;
                    const bRelevance = b.title.toLowerCase().includes(searchTerm) ? 1 : 0;
                    return bRelevance - aRelevance;
                });
            }
            break;
    }
    
    currentPage = 1;
    renderJobs();
    updateResultsInfo();
}

function clearAllFilters() {
    document.getElementById('job-search').value = '';
    document.getElementById('location-search').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('type-filter').value = '';
    document.getElementById('experience-filter').value = '';
    document.getElementById('salary-filter').value = '';
    document.getElementById('sort-by').value = 'newest';
    
    filteredJobs = [...allJobs];
    currentPage = 1;
    renderJobs();
    updateResultsInfo();
}

function updateResultsInfo() {
    const resultsText = document.getElementById('results-text');
    const total = filteredJobs.length;
    
    if (total === allJobs.length) {
        resultsText.textContent = `Mostrando todos los empleos (${total})`;
    } else {
        resultsText.textContent = `Mostrando ${total} de ${allJobs.length} empleos`;
    }
}

function initializePagination() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderJobs();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderJobs();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

function updatePagination() {
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    // Update button states
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    // Generate page numbers
    let pagesHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pagesHTML += `
            <button class="page-number ${i === currentPage ? 'active' : ''}" 
                    onclick="goToPage(${i})">${i}</button>
        `;
    }
    
    pageNumbers.innerHTML = pagesHTML;
}

function goToPage(page) {
    currentPage = page;
    renderJobs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openJobDetail(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const modal = document.getElementById('job-detail-modal');
    const content = document.getElementById('job-detail-content');
    
    content.innerHTML = `
        <div class="job-detail-header">
            <h2 class="job-detail-title">${job.title}</h2>
            <div class="job-detail-company">${job.companyName || job.company}</div>
            <div class="job-detail-meta">
                <div class="meta-item">
                    <span>📍</span> ${job.location}
                </div>
                <div class="meta-item">
                    <span>⏰</span> ${formatJobType(job.type)}
                </div>
                <div class="meta-item">
                    <span>📅</span> Publicado ${getTimeAgo(job.createdAt)}
                </div>
                ${job.experienceLevel ? `
                    <div class="meta-item">
                        <span>🎯</span> ${formatExperience(job.experienceLevel)}
                    </div>
                ` : ''}
            </div>
            <div class="job-detail-salary">
                ${formatSalary(job)}
            </div>
        </div>
        
        <div class="job-detail-section">
            <h3>Descripción del Puesto</h3>
            <p>${job.description}</p>
        </div>
        
        <div class="job-detail-section">
            <h3>Requisitos</h3>
            <p>${job.requirements}</p>
        </div>
        
        ${job.benefits ? `
            <div class="job-detail-section">
                <h3>Beneficios</h3>
                <p>${job.benefits}</p>
            </div>
        ` : ''}
        
        ${job.skills ? `
            <div class="job-detail-section">
                <h3>Habilidades Requeridas</h3>
                <div class="job-detail-skills">
                    ${job.skills.split(',').map(skill => 
                        `<span class="skill-tag">${skill.trim()}</span>`
                    ).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="job-detail-actions">
            <button class="btn btn-primary" onclick="applyToJob(${job.id})">
                ${currentUser ? 'Aplicar a este empleo' : 'Inicia sesión para aplicar'}
            </button>
            <button class="btn btn-outline" onclick="closeJobDetail()">Cerrar</button>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeJobDetail() {
    document.getElementById('job-detail-modal').style.display = 'none';
}

function applyToJob(jobId) {
    if (!currentUser) {
        showMessage('Debes iniciar sesión para aplicar a empleos', 'warning');
        window.location.href = 'index.html#login';
        return;
    }
    
    if (currentUser.userType !== 'candidato') {
        showMessage('Solo los candidatos pueden aplicar a empleos', 'warning');
        return;
    }
    
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    // Check if already applied
    if (currentUser.applications && currentUser.applications.includes(jobId)) {
        showMessage('Ya has aplicado a este empleo', 'info');
        return;
    }
    
    // Add application
    if (!currentUser.applications) {
        currentUser.applications = [];
    }
    currentUser.applications.push(jobId);
    
    // Update localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    showMessage(`¡Aplicación enviada exitosamente para ${job.title}!`, 'success');
    closeJobDetail();
}

// Modal close functionality
document.addEventListener('click', (e) => {
    const modal = document.getElementById('job-detail-modal');
    if (e.target === modal) {
        closeJobDetail();
    }
});

document.querySelector('#job-detail-modal .close').addEventListener('click', closeJobDetail);

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}