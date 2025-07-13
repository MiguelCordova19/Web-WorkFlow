// Variables globales
let allTests = [];
let filteredTests = [];
let currentTestResults = null;
let currentCandidate = null;

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página de resultados de tests...');
    
    // Verificar autenticación
    checkAuthentication();
    
    // Cargar datos
    loadTests();
    
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
    // Filtros
    document.getElementById('test-filter').addEventListener('change', applyFilters);
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('date-filter').addEventListener('change', applyFilters);
}

async function loadTests() {
    try {
        const response = await fetch('../backend/get_my_tests.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            allTests = data.tests;
            filteredTests = [...allTests];
            
            populateTestFilter();
            displayTests();
            updateStatistics();
        } else {
            console.error('Error cargando tests:', data.message);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

function populateTestFilter() {
    const testFilter = document.getElementById('test-filter');
    testFilter.innerHTML = '<option value="">Todos los tests</option>';
    
    allTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        option.textContent = test.title;
        testFilter.appendChild(option);
    });
}

function displayTests() {
    const testsList = document.getElementById('tests-list');
    
    if (filteredTests.length === 0) {
        testsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-clipboard-x text-muted" style="font-size: 3rem;"></i>
                <h5 class="text-muted mt-3">No hay tests disponibles</h5>
                <p class="text-muted">Crea tu primer test de habilidades para ver resultados</p>
                <a href="crear-test.html" class="btn btn-primary">
                    <i class="bi bi-plus-circle"></i> Crear Test
                </a>
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredTests.forEach(test => {
        const completionRate = test.assignments_count > 0 ? 
            Math.round((test.completed_count / test.assignments_count) * 100) : 0;
        
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">${test.title}</h5>
                            <p class="card-text text-muted">${test.description || 'Sin descripción'}</p>
                            <div class="d-flex gap-2 mb-2">
                                <span class="badge bg-primary">${test.questions_count} preguntas</span>
                                <span class="badge bg-info">${test.time_limit} min</span>
                                <span class="badge bg-secondary">${test.assignments_count} asignaciones</span>
                                <span class="badge bg-success">${test.completed_count} completados</span>
                            </div>
                            <div class="progress mb-2" style="height: 8px;">
                                <div class="progress-bar bg-success" style="width: ${completionRate}%"></div>
                            </div>
                            <small class="text-muted">Tasa de finalización: ${completionRate}%</small>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group-vertical">
                                <button class="btn btn-outline-primary" onclick="viewTestResults(${test.id})">
                                    <i class="bi bi-graph-up"></i> Ver Resultados
                                </button>
                                <button class="btn btn-outline-success" onclick="assignTest(${test.id})">
                                    <i class="bi bi-send"></i> Asignar
                                </button>
                                <button class="btn btn-outline-info" onclick="editTest(${test.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    testsList.innerHTML = html;
}

function updateStatistics() {
    const totalAssignments = allTests.reduce((sum, test) => sum + test.assignments_count, 0);
    const completedTests = allTests.reduce((sum, test) => sum + test.completed_count, 0);
    const activeTests = allTests.filter(test => test.is_active).length;
    
    // Calcular puntuación promedio
    let totalScore = 0;
    let totalMaxScore = 0;
    allTests.forEach(test => {
        // Aquí podrías calcular la puntuación promedio basada en los resultados reales
        // Por ahora usamos un valor estimado
        totalScore += test.completed_count * 75; // Puntuación promedio estimada
        totalMaxScore += test.completed_count * 100;
    });
    
    const averageScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    
    document.getElementById('total-assignments').textContent = totalAssignments;
    document.getElementById('completed-tests').textContent = completedTests;
    document.getElementById('average-score').textContent = `${averageScore}%`;
    document.getElementById('active-tests').textContent = activeTests;
}

function applyFilters() {
    const testFilter = document.getElementById('test-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    
    filteredTests = allTests.filter(test => {
        // Filtro por test
        if (testFilter && test.id != testFilter) {
            return false;
        }
        
        // Filtro por estado (basado en asignaciones)
        if (statusFilter) {
            switch (statusFilter) {
                case 'completed':
                    if (test.completed_count === 0) return false;
                    break;
                case 'in_progress':
                    if (test.assignments_count === test.completed_count) return false;
                    break;
                case 'assigned':
                    if (test.assignments_count === 0) return false;
                    break;
            }
        }
        
        // Filtro por fecha (implementar según necesidad)
        if (dateFilter) {
            const testDate = new Date(test.created_at);
            const now = new Date();
            
            switch (dateFilter) {
                case 'today':
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    if (testDate < today) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (testDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    if (testDate < monthAgo) return false;
                    break;
            }
        }
        
        return true;
    });
    
    displayTests();
}

async function viewTestResults(testId) {
    try {
        const response = await fetch(`../backend/get_test_results.php?test_id=${testId}`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentTestResults = data;
            showResultsModal(data);
        } else {
            showMessage('Error cargando resultados: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error cargando resultados:', error);
        showMessage('Error de conexión al cargar resultados', 'error');
    }
}

function showResultsModal(data) {
    const modalTitle = document.getElementById('resultsModalTitle');
    const modalBody = document.getElementById('resultsModalBody');
    
    modalTitle.textContent = `Resultados: ${data.test.title}`;
    
    let html = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h6><i class="bi bi-info-circle"></i> Información del Test</h6>
                <p><strong>${data.test.title}</strong></p>
                <p class="text-muted">${data.test.description || 'Sin descripción'}</p>
            </div>
            <div class="col-md-6">
                <h6><i class="bi bi-graph-up"></i> Estadísticas</h6>
                <div class="row">
                    <div class="col-6">
                        <div class="text-center">
                            <h4 class="text-primary">${data.statistics.total_assignments}</h4>
                            <small class="text-muted">Total Asignaciones</small>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="text-center">
                            <h4 class="text-success">${data.statistics.completed}</h4>
                            <small class="text-muted">Completados</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <h6><i class="bi bi-people"></i> Asignaciones</h6>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Candidato</th>
                        <th>Estado</th>
                        <th>Puntuación</th>
                        <th>Fecha Asignación</th>
                        <th>Fecha Completado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    data.assignments.forEach(assignment => {
        const statusBadge = getStatusBadge(assignment.status);
        const scoreText = assignment.total_score !== null ? 
            `${assignment.total_score}/${assignment.max_score} (${assignment.score_percentage}%)` : 
            'N/A';
        html += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-person-circle text-primary me-2"></i>
                        <div>
                            <strong>${assignment.user.name}</strong><br>
                            <small class="text-muted">${assignment.user.email}</small>
                        </div>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td>${scoreText}</td>
                <td>${formatDate(assignment.assigned_at)}</td>
                <td>${assignment.completed_at ? formatDate(assignment.completed_at) : 'N/A'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewCandidateDetails(${assignment.user.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${assignment.status === 'completed' ? 
                            `<button class="btn btn-outline-success" onclick="reviewAnswers(${assignment.assignment_id})">
                                <i class="bi bi-check-circle"></i>
                            </button>` : ''
                        }
                    </div>
                </td>
            </tr>
        `;
    });
    html += `
                </tbody>
            </table>
        </div>
    `;
    modalBody.innerHTML = html;
    // Mostrar el modal sin fondo gris ni bloqueo
    const modal = new bootstrap.Modal(document.getElementById('resultsModal'), {
        backdrop: false,
        keyboard: true
    });
    modal.show();
}

function getStatusBadge(status) {
    const badges = {
        'assigned': '<span class="badge bg-warning">Asignado</span>',
        'in_progress': '<span class="badge bg-info">En Progreso</span>',
        'completed': '<span class="badge bg-success">Completado</span>',
        'expired': '<span class="badge bg-secondary">Expirado</span>'
    };
    
    return badges[status] || '<span class="badge bg-secondary">Desconocido</span>';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function viewCandidateDetails(userId) {
    // Buscar el candidato en los datos actuales
    const assignment = currentTestResults.assignments.find(a => a.user.id === userId);
    if (!assignment) return;
    
    currentCandidate = assignment.user;
    
    const modalBody = document.getElementById('candidateModalBody');
    
    let html = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="bi bi-person"></i> Información Personal</h6>
                <p><strong>Nombre:</strong> ${assignment.user.name}</p>
                <p><strong>Email:</strong> ${assignment.user.email}</p>
                <p><strong>Empleo asociado:</strong> ${assignment.job_title || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <h6><i class="bi bi-clipboard-check"></i> Información del Test</h6>
                <p><strong>Estado:</strong> ${getStatusBadge(assignment.status).replace(/<[^>]*>/g, '')}</p>
                <p><strong>Puntuación:</strong> ${assignment.total_score !== null ? 
                    `${assignment.total_score}/${assignment.max_score} (${assignment.score_percentage}%)` : 
                    'N/A'}</p>
                <p><strong>Fecha asignación:</strong> ${formatDate(assignment.assigned_at)}</p>
                ${assignment.completed_at ? `<p><strong>Fecha completado:</strong> ${formatDate(assignment.completed_at)}</p>` : ''}
            </div>
        </div>
    `;
    
    modalBody.innerHTML = html;
    // Mostrar el modal sin fondo gris ni bloqueo
    const modal = new bootstrap.Modal(document.getElementById('candidateModal'), {
        backdrop: false,
        keyboard: true
    });
    modal.show();
}

function assignTest(testId) {
    window.location.href = `asignar-test.html?test_id=${testId}`;
}

function editTest(testId) {
    window.location.href = `crear-test.html?edit_id=${testId}`;
}

function reviewAnswers(assignmentId) {
    // Implementar revisión de respuestas específicas
    showMessage('Función de revisión de respuestas en desarrollo', 'info');
}

function contactCandidate() {
    if (!currentCandidate) return;
    
    // Implementar contacto con candidato
    showMessage(`Contactando a ${currentCandidate.name}...`, 'info');
}

function exportResults() {
    if (!currentTestResults) return;
    
    // Implementar exportación de resultados
    showMessage('Función de exportación en desarrollo', 'info');
}

function refreshData() {
    loadTests();
    showMessage('Datos actualizados', 'success');
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