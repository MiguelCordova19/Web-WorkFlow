// Variables globales
let availableTests = [];
let availableJobs = [];
let candidates = [];
let selectedCandidates = new Set();
let selectedTest = null;
let selectedJob = null;
let selectedDueDate = null;

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const preSelectedTestId = urlParams.get('test_id');

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página de asignar test...');
    
    // Verificar autenticación
    checkAuthentication();
    
    // Cargar datos
    loadTests();
    loadJobs();
    loadCandidates();
    loadRecentTests();
    
    // Event listeners
    setupEventListeners();
});

async function checkAuthentication() {
    try {
        const response = await fetch('../backend/session_status.php', { credentials: 'include' });
        const data = await response.json();
        
        if (!data.logged_in || data.user.userType !== 'empresa') {
            console.log('❌ No autenticado como empresa, redirigiendo...');
            window.location.href = '../index.html';
            return;
        }
        
        console.log('✅ Autenticado como empresa:', data.user);
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        window.location.href = '../index.html';
    }
}

function setupEventListeners() {
    // Test selection
    document.getElementById('test-select').addEventListener('change', function() {
        const testId = this.value;
        if (testId) {
            selectedTest = availableTests.find(t => t.id == testId);
            updateTestInfo();
            updateSummary();
        } else {
            selectedTest = null;
            updateTestInfo();
            updateSummary();
        }
    });
    
    // Job selection
    document.getElementById('job-select').addEventListener('change', function() {
        const jobId = this.value;
        if (jobId) {
            selectedJob = availableJobs.find(j => j.id == jobId);
        } else {
            selectedJob = null;
        }
        updateSummary();
    });
    
    // Due date
    document.getElementById('due-date').addEventListener('change', function() {
        selectedDueDate = this.value;
        updateSummary();
    });
    
    // Candidate search
    document.getElementById('candidate-search').addEventListener('input', function() {
        filterCandidates();
    });
    
    // Candidate filter
    document.getElementById('candidate-filter').addEventListener('change', function() {
        filterCandidates();
    });
}

async function loadTests() {
    try {
        const response = await fetch('../backend/get_my_tests.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            availableTests = data.tests;
            populateTestSelect();
        } else {
            console.error('Error cargando tests:', data.message);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

function populateTestSelect() {
    const testSelect = document.getElementById('test-select');
    testSelect.innerHTML = '<option value="">Seleccionar test...</option>';
    
    availableTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        option.textContent = test.title;
        testSelect.appendChild(option);
    });
    
    // Preseleccionar test si viene en la URL
    if (preSelectedTestId) {
        testSelect.value = preSelectedTestId;
        selectedTest = availableTests.find(t => t.id == preSelectedTestId);
        if (selectedTest) {
            updateTestInfo();
            updateSummary();
        }
    }
}

async function loadJobs() {
    try {
        const response = await fetch('../backend/get_company_jobs.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            availableJobs = data.jobs;
            populateJobSelect();
        } else {
            console.error('Error cargando empleos:', data.message);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

function populateJobSelect() {
    const jobSelect = document.getElementById('job-select');
    jobSelect.innerHTML = '<option value="">Sin empleo específico</option>';
    
    availableJobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = job.title;
        jobSelect.appendChild(option);
    });
}

async function loadCandidates() {
    try {
        const response = await fetch('../backend/get_candidates_for_tests.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            candidates = data.candidates;
            displayCandidates();
        } else {
            console.error('Error cargando candidatos:', data.message);
            showMessage('Error cargando candidatos: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showMessage('Error de conexión al cargar candidatos', 'error');
    }
}

function displayCandidates() {
    const candidatesList = document.getElementById('candidates-list');
    
    if (candidates.length === 0) {
        candidatesList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-people text-muted" style="font-size: 3rem;"></i>
                <h5 class="text-muted mt-3">No hay candidatos disponibles</h5>
                <p class="text-muted">Los candidatos aparecerán aquí cuando apliquen a tus empleos</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    candidates.forEach(candidate => {
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card candidate-card" data-candidate-id="${candidate.user_id}">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <div class="candidate-avatar me-3">
                                <i class="bi bi-person-circle text-primary" style="font-size: 2rem;"></i>
                            </div>
                            <div class="candidate-info">
                                <h6 class="mb-0">${candidate.name}</h6>
                                <small class="text-muted">${candidate.email}</small>
                            </div>
                        </div>
                        
                        <div class="candidate-details mb-3">
                            <div class="row">
                                <div class="col-6">
                                    <small class="text-muted">Experiencia:</small>
                                    <p class="mb-1">${candidate.experience || 'No especificada'}</p>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted">Estudios:</small>
                                    <p class="mb-1">${candidate.education || 'No especificados'}</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12">
                                    <small class="text-muted">Habilidades:</small>
                                    <p class="mb-1">${candidate.skills || 'No especificadas'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="candidate-actions">
                            <div class="form-check">
                                <input class="form-check-input candidate-checkbox" type="checkbox" 
                                       id="candidate-${candidate.user_id}" 
                                       onchange="toggleCandidate(${candidate.user_id})">
                                <label class="form-check-label" for="candidate-${candidate.user_id}">
                                    Seleccionar candidato
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    candidatesList.innerHTML = html;
}

function toggleCandidate(candidateId) {
    if (selectedCandidates.has(candidateId)) {
        selectedCandidates.delete(candidateId);
    } else {
        selectedCandidates.add(candidateId);
    }
    
    updateSummary();
    updateCandidateCards();
}

function updateCandidateCards() {
    const cards = document.querySelectorAll('.candidate-card');
    cards.forEach(card => {
        const candidateId = parseInt(card.dataset.candidateId);
        const checkbox = card.querySelector('.candidate-checkbox');
        
        if (selectedCandidates.has(candidateId)) {
            card.classList.add('border-primary');
            checkbox.checked = true;
        } else {
            card.classList.remove('border-primary');
            checkbox.checked = false;
        }
    });
}

function selectAllCandidates() {
    candidates.forEach(candidate => {
        selectedCandidates.add(candidate.user_id);
    });
    updateSummary();
    updateCandidateCards();
}

function deselectAllCandidates() {
    selectedCandidates.clear();
    updateSummary();
    updateCandidateCards();
}

function filterCandidates() {
    const searchTerm = document.getElementById('candidate-search').value.toLowerCase();
    const filterType = document.getElementById('candidate-filter').value;
    
    const cards = document.querySelectorAll('.candidate-card');
    cards.forEach(card => {
        const candidateId = parseInt(card.dataset.candidateId);
        const candidate = candidates.find(c => c.user_id === candidateId);
        
        let show = true;
        
        // Search filter
        if (searchTerm) {
            const searchText = `${candidate.name} ${candidate.email} ${candidate.skills || ''} ${candidate.experience || ''} ${candidate.education || ''}`.toLowerCase();
            if (!searchText.includes(searchTerm)) {
                show = false;
            }
        }
        
        // Type filter
        if (filterType && show) {
            switch (filterType) {
                case 'recent':
                    // Mostrar candidatos con aplicaciones recientes (últimos 7 días)
                    const applicationDate = new Date(candidate.application_date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    show = applicationDate >= weekAgo;
                    break;
                case 'pending':
                    show = candidate.status === 'pending';
                    break;
                case 'shortlisted':
                    show = candidate.status === 'shortlisted';
                    break;
            }
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

function updateTestInfo() {
    const testInfo = document.getElementById('test-info');
    
    if (selectedTest) {
        testInfo.innerHTML = `
            <strong>${selectedTest.title}</strong><br>
            <small>${selectedTest.questions_count} preguntas • ${selectedTest.time_limit} minutos</small><br>
            <small class="text-muted">${selectedTest.description || 'Sin descripción'}</small>
        `;
    } else {
        testInfo.textContent = 'Selecciona un test para ver su información';
    }
}

function updateSummary() {
    // Test info
    const selectedTestInfo = document.getElementById('selected-test-info');
    if (selectedTest) {
        selectedTestInfo.textContent = selectedTest.title;
    } else {
        selectedTestInfo.textContent = 'Ninguno';
    }
    
    // Candidates count
    const selectedCandidatesCount = document.getElementById('selected-candidates-count');
    selectedCandidatesCount.textContent = `${selectedCandidates.size} candidatos`;
    
    // Job info
    const selectedJobInfo = document.getElementById('selected-job-info');
    if (selectedJob) {
        selectedJobInfo.textContent = selectedJob.title;
    } else {
        selectedJobInfo.textContent = 'Ninguno';
    }
    
    // Due date
    const selectedDueDate = document.getElementById('selected-due-date');
    if (selectedDueDate) {
        const date = new Date(selectedDueDate);
        selectedDueDate.textContent = date.toLocaleString('es-ES');
    } else {
        selectedDueDate.textContent = 'Sin fecha límite';
    }
    
    // Enable/disable assign button
    const assignBtn = document.getElementById('assign-btn');
    assignBtn.disabled = !selectedTest || selectedCandidates.size === 0;
}

function assignTest() {
    if (!selectedTest || selectedCandidates.size === 0) {
        showMessage('Debes seleccionar un test y al menos un candidato', 'error');
        return;
    }
    
    // Mostrar modal de confirmación
    showConfirmationModal();
}

function showConfirmationModal() {
    const summary = document.getElementById('assignment-summary');
    
    let html = `
        <div class="row">
            <div class="col-12">
                <h6><i class="bi bi-clipboard-check"></i> Test:</h6>
                <p><strong>${selectedTest.title}</strong></p>
                
                <h6><i class="bi bi-people"></i> Candidatos seleccionados:</h6>
                <ul class="list-unstyled">
    `;
    
    candidates.forEach(candidate => {
        if (selectedCandidates.has(candidate.user_id)) {
            html += `<li><i class="bi bi-person"></i> ${candidate.name} (${candidate.email})</li>`;
        }
    });
    
    html += `
                </ul>
                
                <h6><i class="bi bi-briefcase"></i> Empleo asociado:</h6>
                <p>${selectedJob ? selectedJob.title : 'Ninguno'}</p>
                
                <h6><i class="bi bi-calendar"></i> Fecha límite:</h6>
                <p>${selectedDueDate ? new Date(selectedDueDate).toLocaleString('es-ES') : 'Sin fecha límite'}</p>
            </div>
        </div>
    `;
    
    summary.innerHTML = html;
    
    // Mostrar el modal sin fondo gris ni bloqueo
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'), {
        backdrop: false,
        keyboard: true
    });
    modal.show();
}

async function confirmAssignment() {
    try {
        const response = await fetch('../backend/assign_test.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                test_id: selectedTest.id,
                user_ids: Array.from(selectedCandidates),
                job_id: selectedJob ? selectedJob.id : null,
                due_date: selectedDueDate
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
            modal.hide();
            
            showMessage(`Test asignado exitosamente a ${data.assigned_count} candidatos`, 'success');
            
            // Limpiar selección
            selectedCandidates.clear();
            selectedTest = null;
            selectedJob = null;
            selectedDueDate = null;
            
            // Actualizar UI
            updateSummary();
            updateCandidateCards();
            document.getElementById('test-select').value = '';
            document.getElementById('job-select').value = '';
            document.getElementById('due-date').value = '';
            updateTestInfo();
            
        } else {
            showMessage('Error asignando test: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error asignando test:', error);
        showMessage('Error de conexión al asignar el test', 'error');
    }
}

function previewAssignment() {
    if (!selectedTest || selectedCandidates.size === 0) {
        showMessage('Debes seleccionar un test y al menos un candidato', 'error');
        return;
    }
    
    const previewContent = document.getElementById('preview-content');
    
    let html = `
        <div class="preview-assignment">
            <h4><i class="bi bi-eye"></i> Vista Previa de la Asignación</h4>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-clipboard-check"></i> Test Seleccionado</h6>
                        </div>
                        <div class="card-body">
                            <h5>${selectedTest.title}</h5>
                            <p class="text-muted">${selectedTest.description || 'Sin descripción'}</p>
                            <div class="d-flex gap-2">
                                <span class="badge bg-primary">${selectedTest.questions_count} preguntas</span>
                                <span class="badge bg-info">${selectedTest.time_limit} minutos</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-people"></i> Candidatos Seleccionados</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>${selectedCandidates.size} candidatos</strong></p>
                            <div class="candidate-preview-list">
    `;
    
    candidates.forEach(candidate => {
        if (selectedCandidates.has(candidate.user_id)) {
            html += `
                <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-person-circle text-primary me-2"></i>
                    <div>
                        <strong>${candidate.name}</strong><br>
                        <small class="text-muted">${candidate.email}</small>
                    </div>
                </div>
            `;
        }
    });
    
    html += `
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-briefcase"></i> Empleo Asociado</h6>
                        </div>
                        <div class="card-body">
                            <p>${selectedJob ? selectedJob.title : 'Ninguno'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-calendar"></i> Fecha Límite</h6>
                        </div>
                        <div class="card-body">
                            <p>${selectedDueDate ? new Date(selectedDueDate).toLocaleString('es-ES') : 'Sin fecha límite'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    previewContent.innerHTML = html;
    
    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    modal.show();
}

async function loadRecentTests() {
    try {
        const response = await fetch('../backend/get_my_tests.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            const recentTests = data.tests.slice(0, 5); // Mostrar solo los 5 más recientes
            displayRecentTests(recentTests);
        }
    } catch (error) {
        console.error('Error cargando tests recientes:', error);
    }
}

function displayRecentTests(tests) {
    const recentTestsContainer = document.getElementById('recent-tests');
    
    if (tests.length === 0) {
        recentTestsContainer.innerHTML = '<p class="text-muted">No hay tests creados</p>';
        return;
    }
    
    let html = '';
    tests.forEach(test => {
        html += `
            <div class="recent-test-item mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${test.title}</h6>
                        <small class="text-muted">${test.questions_count} preguntas • ${test.assignments_count} asignaciones</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="selectRecentTest(${test.id})">
                        <i class="bi bi-check"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    recentTestsContainer.innerHTML = html;
}

function selectRecentTest(testId) {
    document.getElementById('test-select').value = testId;
    selectedTest = availableTests.find(t => t.id == testId);
    updateTestInfo();
    updateSummary();
}

function showMessage(message, type = 'info') {
    // Crear toast de Bootstrap
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.innerHTML = toastHtml;
    document.body.appendChild(toastContainer);
    
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remover el toast después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
} 