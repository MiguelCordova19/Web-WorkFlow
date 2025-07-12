// Shared authentication functionality
// function initializeAuth() { ... }
// function updateAuthUI() { ... }
// function logout() { ... }
// function requireAuth() { ... }
// function requireCompanyAuth() { ... }
// function requireCandidateAuth() { ... }

// Mantener solo la lógica de UI para mostrar/ocultar modales y navegación
// Switch between login and register modals
document.addEventListener('DOMContentLoaded', function() {
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    
    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginModal) loginModal.style.display = 'none';
            if (registerModal) registerModal.style.display = 'block';
        });
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerModal) registerModal.style.display = 'none';
            if (loginModal) loginModal.style.display = 'block';
        });
    }
});