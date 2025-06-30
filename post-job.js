// Post Job functionality
let currentUser = null;

function showSessionError(message) {
    // Mostrar mensaje de error en pantalla
    let errorDiv = document.getElementById('session-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'session-error';
        errorDiv.style.background = '#ffdddd';
        errorDiv.style.color = '#a00';
        errorDiv.style.padding = '16px';
        errorDiv.style.margin = '16px';
        errorDiv.style.border = '1px solid #a00';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.fontWeight = 'bold';
        document.body.prepend(errorDiv);
    }
    errorDiv.textContent = message;
}

async function checkSessionAndInit() {
    try {
        const res = await fetch('backend/session_status.php', { credentials: 'include' });
        const data = await res.json();
        console.log('Respuesta de session_status.php:', data);
        if (!data.loggedIn || !data.user || data.user.userType !== 'empresa') {
            localStorage.removeItem('currentUser');
            showSessionError('No tienes una sesión activa de empresa.');
            return;
        }
        currentUser = data.user;
        console.log('currentUser asignado:', currentUser);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        initializeAuth();
        initializeForm();
        setupPreview();
    } catch (err) {
        console.error('Error al verificar sesión:', err);
        showSessionError('Error de red o servidor al verificar sesión.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkSessionAndInit();
});

function initializeAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
}

function updateAuthUI() {
    const navActions = document.getElementById('nav-actions');
    
    if (currentUser) {
        navActions.innerHTML = `
            <div class="user-menu">
                <span class="user-greeting">Hola, ${currentUser.name}</span>
                <button class="btn btn-primary" onclick="logout()">Cerrar Sesión</button>
            </div>
        `;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function initializeForm() {
    // Set default values
    document.getElementById('salary-currency').value = 'ARS';
    document.getElementById('salary-period').value = 'mensual';
    document.getElementById('positions-available').value = '1';
    
    // Set application email to company email
    if (currentUser.email) {
        document.getElementById('application-email').value = currentUser.email;
    }
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('application-deadline').min = today;
    
    // Add form validation
    const form = document.getElementById('post-job-form');
    form.addEventListener('submit', handleFormSubmit);
}

function setupPreview() {
    // Update preview company name
    document.getElementById('preview-company').textContent = currentUser.name;
    
    // Add event listeners for real-time preview
    const formInputs = document.querySelectorAll('#post-job-form input, #post-job-form select, #post-job-form textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });
    
    // Preview button
    document.getElementById('preview-job').addEventListener('click', updatePreview);
    
    // Initial preview update
    updatePreview();
}

function updatePreview() {
    const formData = new FormData(document.getElementById('post-job-form'));
    
    // Update title
    const title = formData.get('title') || 'Título del Empleo';
    document.getElementById('preview-title').textContent = title;
    
    // Update location
    const location = formData.get('location') || 'Ubicación';
    document.getElementById('preview-location').textContent = `📍 ${location}`;
    
    // Update type
    const type = formData.get('type') || 'Tipo';
    const typeText = type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    document.getElementById('preview-type').textContent = `⏰ ${typeText}`;
    
    // Update salary
    const salaryMin = formData.get('salaryMin');
    const salaryMax = formData.get('salaryMax');
    const currency = formData.get('currency') || 'ARS';
    const period = formData.get('period') || 'mensual';
    const negotiable = formData.get('negotiable');
    
    let salaryText = '💰 ';
    if (salaryMin && salaryMax) {
        salaryText += `${formatCurrency(salaryMin, currency)} - ${formatCurrency(salaryMax, currency)} ${period}`;
    } else if (salaryMin) {
        salaryText += `Desde ${formatCurrency(salaryMin, currency)} ${period}`;
    } else if (salaryMax) {
        salaryText += `Hasta ${formatCurrency(salaryMax, currency)} ${period}`;
    } else {
        salaryText += 'A convenir';
    }
    
    if (negotiable) {
        salaryText += ' (Negociable)';
    }
    
    document.getElementById('preview-salary').textContent = salaryText;
    
    // Update description
    const description = formData.get('description') || 'La descripción aparecerá aquí...';
    document.getElementById('preview-desc').textContent = description;
    
    // Update requirements
    const requirements = formData.get('requirements') || 'Los requisitos aparecerán aquí...';
    document.getElementById('preview-req').textContent = requirements;
    
    // Update skills
    const skills = formData.get('skills');
    const skillsSection = document.getElementById('preview-skills-section');
    const skillsList = document.getElementById('preview-skills-list');
    
    if (skills && skills.trim()) {
        const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill);
        skillsList.innerHTML = skillsArray.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');
        skillsSection.style.display = 'block';
    } else {
        skillsSection.style.display = 'none';
    }
}

function formatCurrency(amount, currency) {
    const symbols = {
        'ARS': '$',
        'USD': 'US$',
        'EUR': '€'
    };
    
    return `${symbols[currency] || '$'}${parseInt(amount).toLocaleString()}`;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const jobData = {
        id: Date.now(),
        title: formData.get('title'),
        category: formData.get('category'),
        location: formData.get('location'),
        type: formData.get('type'),
        description: formData.get('description'),
        requirements: formData.get('requirements'),
        benefits: formData.get('benefits'),
        salaryMin: formData.get('salaryMin'),
        salaryMax: formData.get('salaryMax'),
        currency: formData.get('currency'),
        period: formData.get('period'),
        negotiable: formData.get('negotiable') === 'on',
        experienceLevel: formData.get('experienceLevel'),
        educationLevel: formData.get('educationLevel'),
        skills: formData.get('skills'),
        deadline: formData.get('deadline'),
        positions: parseInt(formData.get('positions')) || 1,
        applicationEmail: formData.get('applicationEmail'),
        requireCV: formData.get('requireCV') === 'on',
        requireCoverLetter: formData.get('requireCoverLetter') === 'on',
        companyId: currentUser.id,
        companyName: currentUser.name,
        status: 'active',
        createdAt: new Date().toISOString(),
        applications: 0,
        views: 0
    };
    
    // Validate required fields
    const requiredFields = ['title', 'category', 'location', 'type', 'description', 'requirements', 'experienceLevel'];
    const missingFields = requiredFields.filter(field => !jobData[field]);
    
    if (missingFields.length > 0) {
        showMessage('Por favor completa todos los campos obligatorios', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<div class="loading"></div> Publicando...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Save job to localStorage
            const companyJobs = JSON.parse(localStorage.getItem(`company_jobs_${currentUser.id}`) || '[]');
            companyJobs.push(jobData);
            localStorage.setItem(`company_jobs_${currentUser.id}`, JSON.stringify(companyJobs));
            
            // Also save to global jobs list for search
            const allJobs = JSON.parse(localStorage.getItem('all_jobs') || '[]');
            allJobs.push(jobData);
            localStorage.setItem('all_jobs', JSON.stringify(allJobs));
            
            // Show success message
            showSuccessMessage(jobData);
            
            // Reset form
            e.target.reset();
            updatePreview();
            
        } catch (error) {
            showMessage('Error al publicar el empleo. Inténtalo de nuevo.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }, 2000);
}

function showSuccessMessage(jobData) {
    const formContainer = document.querySelector('.job-form-container');
    const successHTML = `
        <div class="success-message">
            <h4>¡Empleo publicado exitosamente! 🎉</h4>
            <p>Tu oferta de trabajo "${jobData.title}" ha sido publicada y ya está disponible para los candidatos.</p>
            <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center;">
                <button class="btn btn-primary" onclick="window.location.href='company-dashboard.html'">Ver en Mi Panel</button>
                <button class="btn btn-outline" onclick="location.reload()">Publicar Otro Empleo</button>
            </div>
        </div>
    `;
    
    formContainer.innerHTML = successHTML;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Auto-save draft functionality
let draftTimer;
function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
        const formData = new FormData(document.getElementById('post-job-form'));
        const draftData = {};
        
        for (let [key, value] of formData.entries()) {
            draftData[key] = value;
        }
        
        localStorage.setItem(`job_draft_${currentUser.id}`, JSON.stringify(draftData));
    }, 1000);
}

// Load draft on page load
function loadDraft() {
    const draft = localStorage.getItem(`job_draft_${currentUser.id}`);
    if (draft) {
        const draftData = JSON.parse(draft);
        const form = document.getElementById('post-job-form');
        
        Object.keys(draftData).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = draftData[key] === 'on';
                } else {
                    input.value = draftData[key];
                }
            }
        });
        
        updatePreview();
        showMessage('Se ha cargado un borrador guardado', 'info');
    }
}

// Add auto-save listeners
document.addEventListener('DOMContentLoaded', () => {
    const formInputs = document.querySelectorAll('#post-job-form input, #post-job-form select, #post-job-form textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', saveDraft);
        input.addEventListener('change', saveDraft);
    });
    
    // Load draft after a short delay
    setTimeout(loadDraft, 500);
});

// Clear draft when job is successfully posted
function clearDraft() {
    localStorage.removeItem(`job_draft_${currentUser.id}`);
}