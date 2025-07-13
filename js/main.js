// Global variables
let currentUser = null;
let isLoggedIn = false;
let currentPage = 1;
const jobsPerPage = 6;

// DOM Elements
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const mobileLoginBtn = document.getElementById('mobile-login-btn');
const mobileRegisterBtn = document.getElementById('mobile-register-btn');
const mobileProfileBtn = document.getElementById('mobile-profile-btn');
const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
const mobileProfileDropdown = document.getElementById('mobile-profile-dropdown');
const mobileDropdownMenu = document.getElementById('mobile-dropdown-menu');
const jobsGrid = document.getElementById('jobs-grid');
const searchBtn = document.getElementById('search-btn');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing main.js');
    
    // Check session status first
    checkSessionStatus();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize auth buttons
    initializeAuthButtons();
    
    // Initialize mobile auth
    initializeMobileAuth();
    
    // Initialize modal switches
    initializeModalSwitches();
    
    // Initialize search functionality
    initializeSearch();
    
    // Load initial jobs
    loadJobs();
    
    // Initialize pagination
    initializePagination();
    
    // Initialize category cards
    initializeCategoryCards();

    // Botón de registro de empresa
    const companyRegisterBtn = document.getElementById('company-register');
    const companyRegisterModal = document.getElementById('company-register-modal');
    if (companyRegisterBtn && companyRegisterModal) {
        companyRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(companyRegisterModal);
        });
    }
});

// Session Management
function checkSessionStatus() {
    fetch('backend/session_status.php')
        .then(response => response.json())
        .then(data => {
            console.log('Session status:', data);
            if (data.logged_in) {
                currentUser = data.user;
                isLoggedIn = true;
                updateUIForLoggedInUser();
            } else {
                updateUIForLoggedOutUser();
            }
        })
        .catch(error => {
            console.error('Error checking session:', error);
            updateUIForLoggedOutUser();
        });
}

function updateUIForLoggedInUser() {
    console.log('Updating UI for logged in user:', currentUser);
    
    // Hide login/register buttons
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    if (mobileRegisterBtn) mobileRegisterBtn.style.display = 'none';
    
    // Show profile dropdown for mobile
    if (mobileProfileDropdown) mobileProfileDropdown.style.display = 'block';
    
    // Update desktop nav to show profile dropdown
    updateDesktopNavForLoggedInUser();
    
    // Update mobile nav to show profile instead of auth buttons
    updateMobileNavForLoggedInUser();
}

function updateUIForLoggedOutUser() {
    console.log('Updating UI for logged out user');
    
    // Show login/register buttons
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'flex';
    if (mobileRegisterBtn) mobileRegisterBtn.style.display = 'flex';
    
    // Hide profile dropdown
    if (mobileProfileDropdown) mobileProfileDropdown.style.display = 'none';
    
    // Update mobile nav to show auth buttons
    updateMobileNavForLoggedOutUser();
}

function updateDesktopNavForLoggedInUser() {
    const navActions = document.getElementById('nav-actions');
    if (navActions && currentUser) {
        // Determine the correct profile link based on user type
        const profileLink = currentUser.userType === 'empresa' ? 'html/company-dashboard.html' : 'html/profile.html';
        const profileText = currentUser.userType === 'empresa' ? 'Mi Panel' : 'Mi Perfil';
        
        navActions.innerHTML = `
            <div class="user-menu">
                <span class="user-greeting">Hola, ${currentUser.name}</span>
                <div class="dropdown">
                    <button class="dropdown-toggle" id="desktop-profile-btn">
                        <i class="bi bi-person-circle"></i>
                        <span>${profileText}</span>
                        <i class="bi bi-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu" id="desktop-dropdown-menu">
                        <a href="${profileLink}" class="dropdown-item">
                            <i class="bi bi-person"></i>
                            <span>${profileText}</span>
                        </a>
                        <button class="dropdown-item logout" id="desktop-logout-btn">
                            <i class="bi bi-box-arrow-right"></i>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize desktop dropdown functionality
        setTimeout(() => {
            initializeDesktopDropdown();
        }, 100);
    }
}

function updateMobileNavForLoggedInUser() {
    const mobileAuthContainer = document.querySelector('.mobile-auth-container');
    if (mobileAuthContainer && currentUser) {
        // Determine the correct profile link based on user type
        const profileLink = currentUser.userType === 'empresa' ? 'html/company-dashboard.html' : 'html/profile.html';
        const profileText = currentUser.userType === 'empresa' ? 'Mi Panel' : 'Mi Perfil';
        
        mobileAuthContainer.innerHTML = `
            <div class="mobile-profile-dropdown" id="mobile-profile-dropdown">
                <button class="mobile-auth-btn mobile-profile-btn" id="mobile-profile-btn">
                    <i class="bi bi-person-circle"></i>
                    <span>${profileText}</span>
                </button>
                <div class="mobile-dropdown-menu" id="mobile-dropdown-menu">
                    <a href="${profileLink}" class="mobile-dropdown-item">
                        <i class="bi bi-person"></i>
                        <span>${profileText}</span>
                    </a>
                    <button class="mobile-dropdown-item mobile-logout-btn" id="mobile-logout-btn">
                        <i class="bi bi-box-arrow-right"></i>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        `;
        
        // Re-initialize mobile auth after DOM update
        setTimeout(() => {
            initializeMobileAuth();
        }, 100);
    }
}

function updateMobileNavForLoggedOutUser() {
    const mobileAuthContainer = document.querySelector('.mobile-auth-container');
    if (mobileAuthContainer) {
        mobileAuthContainer.innerHTML = `
            <button class="mobile-auth-btn mobile-login-btn" id="mobile-login-btn">
                <i class="bi bi-box-arrow-in-right"></i>
                <span>Login</span>
            </button>
            <button class="mobile-auth-btn mobile-register-btn" id="mobile-register-btn">
                <i class="bi bi-person-plus"></i>
                <span>Registro</span>
            </button>
        `;
        
        // Re-initialize mobile auth after DOM update
        setTimeout(() => {
            initializeMobileAuth();
        }, 100);
    }
}

// Navigation Functions
function initializeNavigation() {
    // Mobile navigation items
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            mobileNavItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Smooth scroll to section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Auth Button Functions
function initializeAuthButtons() {
    // Desktop auth buttons
    if (loginBtn) {
        loginBtn.addEventListener('click', handleDesktopLogin);
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', handleDesktopRegister);
    }
}

// Desktop event handlers
function handleDesktopLogin(e) {
    e.preventDefault();
    console.log('Desktop login clicked');
    openModal(loginModal);
}

function handleDesktopRegister(e) {
    e.preventDefault();
    console.log('Desktop register clicked');
    openModal(registerModal);
}

// Desktop Dropdown Functions
function initializeDesktopDropdown() {
    const desktopProfileBtn = document.getElementById('desktop-profile-btn');
    const desktopDropdownMenu = document.getElementById('desktop-dropdown-menu');
    const desktopLogoutBtn = document.getElementById('desktop-logout-btn');

    // Desktop profile button
    if (desktopProfileBtn) {
        desktopProfileBtn.addEventListener('click', handleDesktopProfile);
    }

    // Desktop logout button
    if (desktopLogoutBtn) {
        desktopLogoutBtn.addEventListener('click', handleDesktopLogout);
    }

    // Close desktop dropdown when clicking outside
    document.addEventListener('click', handleDesktopOutsideClick);
}

// Desktop event handlers
function handleDesktopProfile(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Desktop profile clicked');
    toggleDesktopDropdown();
}

function handleDesktopLogout(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Desktop logout clicked');
    handleLogout();
}

function toggleDesktopDropdown() {
    const desktopDropdownMenu = document.getElementById('desktop-dropdown-menu');
    if (desktopDropdownMenu) {
        desktopDropdownMenu.classList.toggle('show');
    }
}

function handleDesktopOutsideClick(e) {
    const desktopProfileBtn = document.getElementById('desktop-profile-btn');
    const desktopDropdownMenu = document.getElementById('desktop-dropdown-menu');
    
    if (desktopProfileBtn && desktopDropdownMenu && !desktopProfileBtn.contains(e.target)) {
        desktopDropdownMenu.classList.remove('show');
    }
}

// Mobile Auth Functions
function initializeMobileAuth() {
    // Get fresh references after DOM updates
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileRegisterBtn = document.getElementById('mobile-register-btn');
    const mobileProfileBtn = document.getElementById('mobile-profile-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const mobileProfileDropdown = document.getElementById('mobile-profile-dropdown');
    const mobileDropdownMenu = document.getElementById('mobile-dropdown-menu');

    // Mobile login button
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', handleMobileLogin);
    }

    // Mobile register button
    if (mobileRegisterBtn) {
        mobileRegisterBtn.addEventListener('click', handleMobileRegister);
    }

    // Mobile profile button
    if (mobileProfileBtn) {
        mobileProfileBtn.addEventListener('click', handleMobileProfile);
    }

    // Mobile logout button
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', handleMobileLogout);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', handleOutsideClick);
}

// Mobile event handlers
function handleMobileLogin(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile login clicked');
    openModal(loginModal);
}

function handleMobileRegister(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile register clicked');
    openModal(registerModal);
}

function handleMobileProfile(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile profile clicked');
    toggleMobileDropdown();
}

function handleMobileLogout(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Mobile logout clicked');
    handleLogout();
}

function handleOutsideClick(e) {
    const mobileProfileDropdown = document.getElementById('mobile-profile-dropdown');
    const mobileDropdownMenu = document.getElementById('mobile-dropdown-menu');
    
    if (mobileProfileDropdown && mobileDropdownMenu && !mobileProfileDropdown.contains(e.target)) {
        closeMobileDropdown();
    }
}

// Modal Switch Functions
function initializeModalSwitches() {
    // Switch from login to register
    const switchToRegister = document.getElementById('switch-to-register');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal(loginModal);
            openModal(registerModal);
        });
    }
    
    // Switch from register to login
    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal(registerModal);
            openModal(loginModal);
        });
    }
    
    // Switch to company register
    const switchToCompanyLogin = document.getElementById('switch-to-company-login');
    if (switchToCompanyLogin) {
        switchToCompanyLogin.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal(document.getElementById('company-register-modal'));
            openModal(loginModal);
        });
    }
}

// Mobile Dropdown Functions
function toggleMobileDropdown() {
    const mobileDropdownMenu = document.getElementById('mobile-dropdown-menu');
    if (mobileDropdownMenu) {
        mobileDropdownMenu.classList.toggle('show');
    }
}

function closeMobileDropdown() {
    const mobileDropdownMenu = document.getElementById('mobile-dropdown-menu');
    if (mobileDropdownMenu) {
        mobileDropdownMenu.classList.remove('show');
    }
}

// Modal Functions
function openModal(modal) {
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

// Close modals with X button
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
    });
});

// Form Submissions
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
}

// Company register form
const companyRegisterForm = document.getElementById('company-register-form');
if (companyRegisterForm) {
    companyRegisterForm.addEventListener('submit', handleCompanyRegister);
}

function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    const userType = formData.get('userType');
    
    // Determinar el endpoint según el tipo de usuario
    const endpoint = userType === 'empresa' ? 'backend/login_company.php' : 'backend/login.php';
    
    // Preparar los datos según el tipo de usuario
    const bodyData = userType === 'empresa' 
        ? `company_email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        : `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Inicio de sesión exitoso', 'success');
            currentUser = data;
            isLoggedIn = true;
            closeModal(loginModal);
            updateUIForLoggedInUser();
        } else {
            showMessage(data.message || 'Error en el inicio de sesión', 'error');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showMessage('Error en el inicio de sesión', 'error');
    });
}

function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(registerForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    fetch('backend/register.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Registro exitoso', 'success');
            currentUser = data.user;
            isLoggedIn = true;
            closeModal(registerModal);
            updateUIForLoggedInUser();
        } else {
            showMessage(data.message || 'Error en el registro', 'error');
        }
    })
    .catch(error => {
        console.error('Register error:', error);
        showMessage('Error en el registro', 'error');
    });
}

function handleCompanyRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(companyRegisterForm);
    const companyName = formData.get('company_name');
    const companyEmail = formData.get('company_email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    const ruc = formData.get('ruc');
    const website = formData.get('website');
    const phone = formData.get('phone');
    const location = formData.get('location');
    const description = formData.get('description');
    
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }
    
    fetch('backend/register_company.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `company_name=${encodeURIComponent(companyName)}&company_email=${encodeURIComponent(companyEmail)}&password=${encodeURIComponent(password)}&ruc=${encodeURIComponent(ruc)}&website=${encodeURIComponent(website)}&phone=${encodeURIComponent(phone)}&location=${encodeURIComponent(location)}&description=${encodeURIComponent(description)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Registro de empresa exitoso', 'success');
            currentUser = data.user;
            isLoggedIn = true;
            closeModal(document.getElementById('company-register-modal'));
            updateUIForLoggedInUser();
        } else {
            showMessage(data.message || 'Error en el registro de empresa', 'error');
        }
    })
    .catch(error => {
        console.error('Company register error:', error);
        showMessage('Error en el registro de empresa', 'error');
    });
}

function handleLogout() {
    fetch('backend/logout.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Sesión cerrada exitosamente', 'success');
                currentUser = null;
                isLoggedIn = false;
                updateUIForLoggedOutUser();
            } else {
                showMessage('Error al cerrar sesión', 'error');
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
            showMessage('Error al cerrar sesión', 'error');
        });
}

// Message Display
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Search Functions
function initializeSearch() {
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    // Combo box: búsqueda automática al cambiar
    const jobLocation = document.getElementById('job-location');
    const jobCategory = document.getElementById('job-category');
    if (jobLocation) {
        jobLocation.addEventListener('change', performSearch);
    }
    if (jobCategory) {
        jobCategory.addEventListener('change', performSearch);
    }
}

function performSearch() {
    const jobTitle = document.getElementById('job-title').value;
    const jobLocation = document.getElementById('job-location').value;
    const jobCategory = document.getElementById('job-category').value;
    
    currentPage = 1;
    loadJobs(jobTitle, jobLocation, jobCategory);
}

// Job Loading Functions
function loadJobs(title = '', location = '', category = '') {
    const params = new URLSearchParams({
        page: currentPage,
        limit: jobsPerPage,
        title: title,
        location: location,
        category: category
    });
    
    fetch(`backend/get_jobs.php?${params}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayJobs(data.jobs);
                // Si el backend no envía paginación, la calculamos aquí
                let total = data.total ?? data.jobs.length;
                let totalPages = data.total_pages ?? Math.ceil(total / jobsPerPage);
                let current = data.current_page ?? currentPage;
                updatePagination(total, current, totalPages);
            } else {
                console.error('Error loading jobs:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading jobs:', error);
        });
}

function displayJobs(jobs) {
    if (!jobsGrid) return;
    
    jobsGrid.innerHTML = '';
    
    jobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.innerHTML = `
            <div class="job-info">
                <h3 class="job-title">${job.title}</h3>
                <p class="job-company">${job.company}</p>
                <p class="job-location">📍 ${job.location}</p>
                <p class="job-posted">📅 ${job.posted_date}</p>
            </div>
            <div class="job-meta">
                <span class="job-salary">💰 ${job.salary}</span>
                <span class="job-type">${job.type}</span>
            </div>
        `;
        jobsGrid.appendChild(jobCard);
    });
}

// Pagination Functions
function initializePagination() {
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadJobs();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            loadJobs();
        });
    }
}

function updatePagination(total, current, totalPages) {
    if (pageInfo) {
        pageInfo.textContent = `Página ${current} de ${totalPages}`;
    }
    
    if (prevPageBtn) {
        prevPageBtn.disabled = current <= 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = current >= totalPages;
    }
}

// Category Cards
function initializeCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            document.getElementById('job-category').value = category;
            performSearch();
        });
    });
}