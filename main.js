// DOM Elements
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const searchBtn = document.getElementById('search-btn');
const jobsGrid = document.getElementById('jobs-grid');
const categoryCards = document.querySelectorAll('.category-card');
const contactForm = document.getElementById('contact-form');
const companyRegisterBtn = document.getElementById('company-register');

// Authentication State
// let currentUser = null;

let currentJobs = [];
let currentPage = 1;
const jobsPerPage = 5;

// Authentication Functions
// function initializeAuth() { ... }
// function updateAuthUI() { ... }
// function registerUser(userData) { ... }
// function loginUser(email, password) { ... }
// function logout() { ... }

// Navigation Toggle
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Modal Functions
function openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Modal Event Listeners
companyRegisterBtn.addEventListener('click', () => openModal(registerModal));

// Agregar listeners para los botones de login y registro del navbar
if (loginBtn) {
    loginBtn.addEventListener('click', () => openModal(loginModal));
}
if (registerBtn) {
    registerBtn.addEventListener('click', () => openModal(registerModal));
}

// Close modals when clicking outside or on close button
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        closeModal(loginModal);
    }
    if (e.target === registerModal) {
        closeModal(registerModal);
    }
});

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        closeModal(modal);
    });
});

// Nueva función para cargar empleos desde la base de datos
async function loadJobsFromBackend() {
    try {
        const res = await fetch('backend/get_jobs.php');
        const data = await res.json();
        if (data.success) {
            currentJobs = data.jobs;
            renderJobs(currentJobs);
        } else {
            jobsGrid.innerHTML = '<p class="text-center">No se pudieron cargar los empleos.</p>';
        }
    } catch (err) {
        jobsGrid.innerHTML = '<p class="text-center">Error de conexión al cargar empleos.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadJobsFromBackend();
});

// Modifica renderJobs para usar los campos del backend
function renderJobs(jobs) {
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const jobsToShow = jobs.slice(startIndex, endIndex);

    jobsGrid.innerHTML = '';

    if (jobsToShow.length === 0) {
        jobsGrid.innerHTML = '<p class="text-center">No se encontraron empleos que coincidan con tu búsqueda.</p>';
        return;
    }

    jobsToShow.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card fade-in-up';
        jobCard.innerHTML = `
            <div class="job-info">
                <h3 class="job-title">${job.title}</h3>
                <div class="job-company">${job.company_name || ''}</div>
                <div class="job-location">📍 ${job.location || ''}</div>
                <div class="job-posted">${job.created_at ? new Date(job.created_at).toLocaleDateString() : ''}</div>
            </div>
            <div class="job-meta">
                <div class="job-salary">${job.salary_min && job.salary_max ? `${job.currency || ''} ${job.salary_min} - ${job.salary_max}` : ''}</div>
                <div class="job-type">${job.type || ''}</div>
                <button class="btn btn-primary apply-btn" data-jobid="${job.id}">Inicia sesión para aplicar</button>
            </div>
        `;
        jobsGrid.appendChild(jobCard);
    });

    // Asignar evento a los botones de aplicar
    document.querySelectorAll('.apply-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            openModal(loginModal);
        });
    });

    updatePagination(jobs.length);
}

function updatePagination(totalJobs) {
    const totalPages = Math.ceil(totalJobs / jobsPerPage);
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    nextBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';
}

// Search Jobs
searchBtn.addEventListener('click', () => {
    const jobTitle = document.getElementById('job-title').value.toLowerCase();
    const jobLocation = document.getElementById('job-location').value.toLowerCase();
    const jobCategory = document.getElementById('job-category').value;

    let filteredJobs = currentJobs.filter(job => {
        const titleMatch = !jobTitle || job.title.toLowerCase().includes(jobTitle);
        const locationMatch = !jobLocation || job.location.toLowerCase().includes(jobLocation);
        const categoryMatch = !jobCategory || job.category === jobCategory;
        
        return titleMatch && locationMatch && categoryMatch;
    });

    currentJobs = filteredJobs;
    currentPage = 1;
    renderJobs(currentJobs);
    
    // Scroll to results
    document.getElementById('empleos').scrollIntoView({ behavior: 'smooth' });
});

// Category Filter
categoryCards.forEach(card => {
    card.addEventListener('click', () => {
        const category = card.dataset.category;
        document.getElementById('job-category').value = category;
        
        const filteredJobs = currentJobs.filter(job => job.category === category);
        currentJobs = filteredJobs;
        currentPage = 1;
        renderJobs(currentJobs);
        
        // Scroll to results
        document.getElementById('empleos').scrollIntoView({ behavior: 'smooth' });
    });
});

// Pagination
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderJobs(currentJobs);
        document.querySelector('.job-listings').scrollIntoView({ behavior: 'smooth' });
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(currentJobs.length / jobsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderJobs(currentJobs);
        document.querySelector('.job-listings').scrollIntoView({ behavior: 'smooth' });
    }
});

// Contact Form
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    
    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.innerHTML = '<div class="loading"></div> Enviando...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        showMessage(`¡Gracias ${name}! Hemos recibido tu mensaje y te contactaremos pronto.`, 'success');
        contactForm.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

// Form Submissions
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const userType = formData.get('userType');
            let endpoint = '';
            if (userType === 'empresa') {
                endpoint = 'backend/login_company.php';
            } else {
                endpoint = 'backend/login.php';
            }
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.success) {
                    updateNavActions({ name: data.name || 'Usuario', userType: data.userType });
                    closeModal(loginModal);
                    showMessage('¡Bienvenido! Has iniciado sesión.', 'success');
                    // Redirigir según tipo
                    if (data.userType === 'empresa') {
                        window.location.href = 'company-dashboard.html';
                    } else {
                        window.location.href = 'profile.html';
                    }
                } else {
                    showMessage(data.message || 'Error al iniciar sesión', 'danger');
                }
            } catch (err) {
                showMessage('Error de conexión con el servidor', 'danger');
            }
        });
    }

    // --- REGISTRO ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const userType = formData.get('userType');
            let endpoint = '';
            if (userType === 'empresa') {
                endpoint = 'backend/register_company.php';
            } else {
                endpoint = 'backend/register.php';
            }
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    showMessage('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
                    // Cerrar modal de registro y abrir login
                    document.getElementById('register-modal').style.display = 'none';
                    document.getElementById('login-modal').style.display = 'block';
                } else {
                    showMessage(data.message || 'Error al registrarse', 'danger');
                }
            } catch (err) {
                showMessage('Error de conexión con el servidor', 'danger');
            }
        });
    }
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        
        // Close mobile menu if open
        navMenu.classList.remove('active');
    });
});

// Scroll to Top on Logo Click
document.querySelector('.nav-brand').addEventListener('click', () => {
    // If we're not on the main page, go to it
    if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    } else {
        // If we're on the main page, scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Add scroll effect to header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#fff';
        header.style.backdropFilter = 'none';
    }
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const elementsToAnimate = document.querySelectorAll('.category-card, .service-card, .testimonial-card');
    elementsToAnimate.forEach(el => observer.observe(el));
    
    // Initial render of jobs
    renderJobs(currentJobs);
});

// Counter Animation for Hero Stats
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^0-9]/g, ''));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.floor(current).toLocaleString() + '+';
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString() + '+';
            }
        };
        
        updateCounter();
    });
}

// Trigger counter animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-stats');
    if (heroSection) {
        heroObserver.observe(heroSection);
    }
});

// Search on Enter Key
document.getElementById('job-title').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

document.getElementById('job-location').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Dynamic Job Type Colors
function getJobTypeColor(type) {
    switch(type.toLowerCase()) {
        case 'tiempo completo':
            return { bg: '#dcfce7', color: '#166534' };
        case 'medio tiempo':
            return { bg: '#fef3c7', color: '#92400e' };
        case 'freelance':
            return { bg: '#e0f2fe', color: '#0277bd' };
        case 'remoto':
            return { bg: '#f3e8ff', color: '#7c3aed' };
        default:
            return { bg: '#e0f2fe', color: '#0277bd' };
    }
}

// Enhanced Job Card Styling
function enhanceJobCards() {
    const jobCards = document.querySelectorAll('.job-card');
    jobCards.forEach(card => {
        const jobType = card.querySelector('.job-type');
        if (jobType) {
            const colors = getJobTypeColor(jobType.textContent);
            jobType.style.backgroundColor = colors.bg;
            jobType.style.color = colors.color;
        }
    });
}

// Call enhance function after rendering jobs
const originalRenderJobs = renderJobs;
renderJobs = function(jobs) {
    originalRenderJobs(jobs);
    setTimeout(enhanceJobCards, 100);
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize authentication
    // initializeAuth();
});

// Función para mostrar mensajes flotantes
function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.position = 'fixed';
    messageEl.style.top = '30px';
    messageEl.style.left = '50%';
    messageEl.style.transform = 'translateX(-50%)';
    messageEl.style.zIndex = '9999';
    messageEl.style.padding = '12px 24px';
    messageEl.style.borderRadius = '8px';
    messageEl.style.background = type === 'success' ? '#22c55e' : type === 'danger' ? '#ef4444' : '#2563eb';
    messageEl.style.color = '#fff';
    messageEl.style.fontWeight = 'bold';
    messageEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    document.body.appendChild(messageEl);
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Función para actualizar el navbar según el usuario logueado
function updateNavActions(user) {
    const navActions = document.getElementById('nav-actions');
    if (!navActions) return;
    if (user) {
        navActions.innerHTML = `
            <div class="user-menu">
                <span class="user-greeting">Hola, ${user.name}</span>
                <button class="btn btn-outline" id="profile-btn">Mi Perfil</button>
                <button class="btn btn-primary" id="logout-btn">Cerrar Sesión</button>
            </div>
        `;
        document.getElementById('profile-btn').addEventListener('click', () => {
            if (user.userType === 'empresa') {
                window.location.href = 'company-dashboard.html';
            } else {
                window.location.href = 'profile.html';
            }
        });
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await fetch('backend/logout.php', { method: 'POST', credentials: 'include' });
            window.location.reload();
        });
    } else {
        navActions.innerHTML = `
            <button class="btn btn-outline" id="login-btn">Iniciar Sesión</button>
            <button class="btn btn-primary" id="register-btn">Registrarse</button>
        `;
        document.getElementById('login-btn').addEventListener('click', () => openModal(loginModal));
        document.getElementById('register-btn').addEventListener('click', () => openModal(registerModal));
    }
}

// Al cargar la página, consultar el estado de sesión
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('backend/session_status.php', { credentials: 'include' });
        const data = await res.json();
        if (data.loggedIn) {
            updateNavActions(data.user);
        } else {
            updateNavActions(null);
        }
    } catch (e) {
        updateNavActions(null);
    }
});

// Obtener el modal y formulario de empresa
const companyRegisterModal = document.getElementById('company-register-modal');
const companyRegisterForm = document.getElementById('company-register-form');

// Botón para abrir el modal de empresa
if (companyRegisterBtn) {
    companyRegisterBtn.addEventListener('click', () => openModal(companyRegisterModal));
}

// Cerrar modal de empresa al hacer click en la X o fuera del modal
companyRegisterModal.querySelector('.close').addEventListener('click', () => closeModal(companyRegisterModal));
window.addEventListener('click', (e) => {
    if (e.target === companyRegisterModal) closeModal(companyRegisterModal);
});

// Enviar formulario de registro de empresa
if (companyRegisterForm) {
    companyRegisterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(companyRegisterForm);
        try {
            const res = await fetch('backend/register_company.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                showMessage('Empresa registrada exitosamente. Ahora puedes iniciar sesión.', 'success');
                companyRegisterForm.reset();
                closeModal(companyRegisterModal);
            } else {
                showMessage(data.message || 'Error al registrar empresa', 'danger');
            }
        } catch (err) {
            showMessage('Error de conexión con el servidor', 'danger');
        }
    });
}