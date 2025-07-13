// Variables globales
let currentTest = {
    title: '',
    description: '',
    instructions: '',
    category: '',
    timeLimit: 60,
    questions: []
};

let editingQuestionIndex = -1;

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página de crear test...');
    
    // Verificar autenticación
    checkAuthentication();
    
    // Cargar plantillas
    loadTemplates();
    
    // Cargar tests existentes
    loadMyTests();
    
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
    // Actualizar puntos totales cuando se agregan/editan preguntas
    document.getElementById('test-total-points').addEventListener('input', updateTotalPoints);
    
    // Cambio en tipo de pregunta
    document.getElementById('question-type').addEventListener('change', function() {
        const type = this.value;
        if (type === 'open_ended') {
            // Ocultar opciones múltiples si las hay
            console.log('Pregunta abierta seleccionada');
        }
    });
}

function addQuestion() {
    editingQuestionIndex = -1;
    document.getElementById('questionModalTitle').textContent = 'Agregar Pregunta';
    document.getElementById('question-form').reset();
    document.getElementById('question-points').value = '10';
    document.getElementById('question-type').value = 'open_ended';
    document.getElementById('question-required').checked = true;
    
    const modal = new bootstrap.Modal(document.getElementById('questionModal'));
    modal.show();
}

function editQuestion(index) {
    editingQuestionIndex = index;
    const question = currentTest.questions[index];
    
    document.getElementById('questionModalTitle').textContent = 'Editar Pregunta';
    document.getElementById('question-text').value = question.question_text;
    document.getElementById('question-type').value = question.question_type;
    document.getElementById('question-points').value = question.points;
    document.getElementById('question-required').checked = question.is_required;
    
    const modal = new bootstrap.Modal(document.getElementById('questionModal'));
    modal.show();
}

function saveQuestion() {
    const questionText = document.getElementById('question-text').value.trim();
    const questionType = document.getElementById('question-type').value;
    const points = parseInt(document.getElementById('question-points').value);
    const isRequired = document.getElementById('question-required').checked;
    
    if (!questionText) {
        showMessage('La pregunta no puede estar vacía', 'error');
        return;
    }
    
    const question = {
        question_text: questionText,
        question_type: questionType,
        points: points,
        is_required: isRequired,
        order_index: currentTest.questions.length
    };
    
    if (editingQuestionIndex >= 0) {
        // Editar pregunta existente
        currentTest.questions[editingQuestionIndex] = question;
    } else {
        // Agregar nueva pregunta
        currentTest.questions.push(question);
    }
    
    updateQuestionsList();
    updateTotalPoints();
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('questionModal'));
    modal.hide();
    
    showMessage('Pregunta guardada correctamente', 'success');
}

function deleteQuestion(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
        currentTest.questions.splice(index, 1);
        updateQuestionsList();
        updateTotalPoints();
        showMessage('Pregunta eliminada', 'success');
    }
}

function updateQuestionsList() {
    const questionsList = document.getElementById('questions-list');
    
    if (currentTest.questions.length === 0) {
        questionsList.innerHTML = '<p class="text-muted">No hay preguntas agregadas</p>';
        return;
    }
    
    let html = '';
    currentTest.questions.forEach((question, index) => {
        html += `
            <div class="card mb-2">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">Pregunta ${index + 1}</h6>
                            <p class="mb-1 small">${question.question_text.substring(0, 100)}${question.question_text.length > 100 ? '...' : ''}</p>
                            <div class="d-flex gap-2">
                                <span class="badge bg-primary">${question.question_type}</span>
                                <span class="badge bg-secondary">${question.points} pts</span>
                                ${question.is_required ? '<span class="badge bg-warning">Obligatoria</span>' : ''}
                            </div>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="editQuestion(${index})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="deleteQuestion(${index})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    questionsList.innerHTML = html;
}

function updateTotalPoints() {
    const totalPoints = currentTest.questions.reduce((sum, question) => sum + question.points, 0);
    document.getElementById('test-total-points').value = totalPoints;
}

async function saveTest() {
    // Obtener datos del formulario
    currentTest.title = document.getElementById('test-title').value.trim();
    currentTest.description = document.getElementById('test-description').value.trim();
    currentTest.instructions = document.getElementById('test-instructions').value.trim();
    currentTest.category = document.getElementById('test-category').value;
    currentTest.timeLimit = parseInt(document.getElementById('test-time-limit').value);
    
    // Validaciones
    if (!currentTest.title) {
        showMessage('El título del test es obligatorio', 'error');
        return;
    }
    
    if (currentTest.questions.length === 0) {
        showMessage('Debes agregar al menos una pregunta', 'error');
        return;
    }
    
    try {
        const response = await fetch('../backend/create_skill_test.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentTest)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Test creado exitosamente', 'success');
            // Limpiar formulario
            document.getElementById('create-test-form').reset();
            currentTest.questions = [];
            updateQuestionsList();
            updateTotalPoints();
            // Recargar mis tests
            loadMyTests();
        } else {
            showMessage('Error al crear el test: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error guardando test:', error);
        showMessage('Error de conexión al guardar el test', 'error');
    }
}

async function loadTemplates() {
    try {
        const response = await fetch('../backend/get_test_templates.php');
        const data = await response.json();
        
        if (data.success) {
            displayTemplates(data.templates);
        } else {
            console.error('Error cargando plantillas:', data.message);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

function displayTemplates(templates) {
    const templatesList = document.getElementById('templates-list');
    
    let html = '';
    templates.forEach(template => {
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${template.name}</h5>
                        <p class="card-text">${template.description}</p>
                        <div class="mb-2">
                            <span class="badge bg-primary">${template.category}</span>
                            <span class="badge bg-secondary">${template.questions_count} preguntas</span>
                        </div>
                        <button class="btn btn-primary" onclick="useTemplate(${template.id})">
                            <i class="bi bi-plus-circle"></i> Usar Plantilla
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    templatesList.innerHTML = html;
}

async function useTemplate(templateId) {
    try {
        const response = await fetch(`../backend/get_template_questions.php?template_id=${templateId}`);
        const data = await response.json();
        
        if (data.success) {
            // Cargar preguntas de la plantilla
            currentTest.questions = data.questions;
            updateQuestionsList();
            updateTotalPoints();
            
            // Cambiar a la pestaña de crear test
            const createTab = new bootstrap.Tab(document.getElementById('create-tab'));
            createTab.show();
            
            showMessage('Plantilla cargada correctamente', 'success');
        } else {
            showMessage('Error cargando plantilla: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error usando plantilla:', error);
        showMessage('Error de conexión al cargar plantilla', 'error');
    }
}

async function loadMyTests() {
    try {
        const response = await fetch('../backend/get_my_tests.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            displayMyTests(data.tests);
        } else {
            console.error('Error cargando tests:', data.message);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

function displayMyTests(tests) {
    const myTestsList = document.getElementById('my-tests-list');
    
    if (tests.length === 0) {
        myTestsList.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-clipboard-x text-muted" style="font-size: 3rem;"></i>
                <h5 class="text-muted mt-3">No has creado ningún test aún</h5>
                <p class="text-muted">Crea tu primer test de habilidades para evaluar a tus candidatos</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    tests.forEach(test => {
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title">${test.title}</h5>
                            <p class="card-text">${test.description || 'Sin descripción'}</p>
                            <div class="d-flex gap-2 mb-2">
                                <span class="badge bg-primary">${test.category || 'Sin categoría'}</span>
                                <span class="badge bg-secondary">${test.questions_count} preguntas</span>
                                <span class="badge bg-info">${test.time_limit} min</span>
                                ${test.is_active ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-warning">Inactivo</span>'}
                            </div>
                            <small class="text-muted">Creado: ${formatDate(test.created_at)}</small>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary btn-sm" onclick="editTest(${test.id})">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="viewTestResults(${test.id})">
                                <i class="bi bi-graph-up"></i> Resultados
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="assignTest(${test.id})">
                                <i class="bi bi-send"></i> Asignar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    myTestsList.innerHTML = html;
}

function refreshMyTests() {
    loadMyTests();
    showMessage('Tests actualizados', 'success');
}

function previewTest() {
    if (currentTest.questions.length === 0) {
        showMessage('No hay preguntas para mostrar en la vista previa', 'error');
        return;
    }
    
    const previewContent = document.getElementById('preview-content');
    let html = `
        <div class="test-preview">
            <h3>${currentTest.title || 'Título del Test'}</h3>
            <p class="text-muted">${currentTest.description || 'Descripción del test'}</p>
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> ${currentTest.instructions || 'Instrucciones para el candidato'}
            </div>
            <hr>
    `;
    
    currentTest.questions.forEach((question, index) => {
        html += `
            <div class="question-preview mb-4">
                <h5>Pregunta ${index + 1} <span class="badge bg-secondary">${question.points} puntos</span></h5>
                <p>${question.question_text}</p>
                <div class="answer-preview">
                    <textarea class="form-control" rows="4" placeholder="Respuesta del candidato..." disabled></textarea>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    previewContent.innerHTML = html;
    
    // Crear y mostrar el modal correctamente
    const modalElement = document.getElementById('previewModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error('Modal element not found');
    }
}

function editTest(testId) {
    // Implementar edición de test
    showMessage('Función de edición en desarrollo', 'info');
}

function viewTestResults(testId) {
    // Redirigir a la página de resultados
    window.location.href = `resultados-tests.html?test_id=${testId}`;
}

function assignTest(testId) {
    // Redirigir a la página de asignación
    window.location.href = `asignar-test.html?test_id=${testId}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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