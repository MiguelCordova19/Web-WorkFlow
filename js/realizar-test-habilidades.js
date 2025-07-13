// Variables globales
let currentTest = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timeRemaining = 0;
let timerInterval = null;
let assignmentId = null;

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const testId = urlParams.get('test_id');
const assignmentIdParam = urlParams.get('assignment_id');

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página de realizar test...');
    
    // Verificar autenticación
    checkAuthentication();
    
    // Cargar test si se proporciona ID
    if (testId && assignmentIdParam) {
        loadTest(testId, assignmentIdParam);
    } else {
        showError('ID de test o asignación no proporcionado');
    }
});

async function checkAuthentication() {
    try {
        const response = await fetch('../backend/session_status.php', { credentials: 'include' });
        const data = await response.json();
        
        if (!data.logged_in || data.user.userType !== 'usuario') {
            console.log('❌ No autenticado como usuario, redirigiendo...');
            window.location.href = '../index.html';
            return;
        }
        
        console.log('✅ Autenticado como usuario:', data.user);
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        window.location.href = '../index.html';
    }
}

async function loadTest(testId, assignmentIdParam) {
    try {
        const response = await fetch(`../backend/get_test_for_user.php?test_id=${testId}&assignment_id=${assignmentIdParam}`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentTest = data.test;
            currentQuestions = data.questions;
            assignmentId = assignmentIdParam; // Asignar correctamente el assignmentId global
            
            // Verificar si ya está en progreso
            if (data.assignment.status === 'in_progress') {
                userAnswers = data.assignment.answers || {};
                timeRemaining = data.assignment.time_remaining || currentTest.time_limit * 60;
            } else {
                // Iniciar test
                await startTest();
            }
            
            displayTestInfo();
            displayInstructions();
            displayQuestion();
            setupNavigation();
            startTimer();
            
        } else {
            showError('Error cargando test: ' + data.message);
        }
    } catch (error) {
        console.error('Error cargando test:', error);
        showError('Error de conexión al cargar el test');
    }
}

async function startTest() {
    try {
        const response = await fetch('../backend/start_test.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                assignment_id: assignmentId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            timeRemaining = currentTest.time_limit * 60;
            userAnswers = {};
            console.log('✅ Test iniciado correctamente');
        } else {
            showError('Error iniciando test: ' + data.message);
        }
    } catch (error) {
        console.error('Error iniciando test:', error);
        showError('Error de conexión al iniciar el test');
    }
}

function displayTestInfo() {
    document.getElementById('test-info').textContent = `${currentTest.title} - ${currentQuestions.length} preguntas - ${currentTest.time_limit} minutos`;
}

function displayInstructions() {
    if (currentTest.instructions) {
        document.getElementById('instructions-content').innerHTML = currentTest.instructions;
        document.getElementById('test-instructions').style.display = 'block';
    }
}

function displayQuestion() {
    if (currentQuestions.length === 0) {
        showError('No hay preguntas disponibles');
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    
    document.getElementById('question-title').textContent = `Pregunta ${questionNumber}`;
    document.getElementById('question-text').textContent = question.question_text;
    document.getElementById('question-points').textContent = `${question.points} puntos`;
    
    // Cargar respuesta guardada si existe
    const savedAnswer = userAnswers[question.id];
    document.getElementById('answer-text').value = savedAnswer || '';
    
    // Mostrar contenedor de pregunta
    document.getElementById('question-container').style.display = 'block';
    document.getElementById('navigation-buttons').style.display = 'flex';
    
    // Actualizar botones de navegación
    updateNavigationButtons();
    updateProgress();
}

function setupNavigation() {
    const questionNav = document.getElementById('question-nav');
    let html = '';
    
    currentQuestions.forEach((question, index) => {
        html += `<button class="question-nav-btn" onclick="goToQuestion(${index})">${index + 1}</button>`;
    });
    
    questionNav.innerHTML = html;
    updateQuestionNav();
}

function updateQuestionNav() {
    const buttons = document.querySelectorAll('.question-nav-btn');
    
    buttons.forEach((button, index) => {
        button.classList.remove('current', 'answered');
        
        if (index === currentQuestionIndex) {
            button.classList.add('current');
        } else if (userAnswers[currentQuestions[index].id]) {
            button.classList.add('answered');
        }
    });
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');
    
    prevBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';
    nextBtn.style.display = currentQuestionIndex < currentQuestions.length - 1 ? 'block' : 'none';
    finishBtn.style.display = currentQuestionIndex === currentQuestions.length - 1 ? 'block' : 'none';
}

function updateProgress() {
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = currentQuestions.length;
    const progress = (answeredCount / totalQuestions) * 100;
    
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-bar').textContent = `${answeredCount}/${totalQuestions}`;
}

function saveCurrentAnswer() {
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const answerText = document.getElementById('answer-text').value.trim();
    
    if (answerText) {
        userAnswers[currentQuestion.id] = answerText;
    } else {
        delete userAnswers[currentQuestion.id];
    }
    
    updateQuestionNav();
    updateProgress();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        saveCurrentAnswer();
        currentQuestionIndex--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        saveCurrentAnswer();
        currentQuestionIndex++;
        displayQuestion();
    }
}

function goToQuestion(index) {
    if (index >= 0 && index < currentQuestions.length) {
        saveCurrentAnswer();
        currentQuestionIndex = index;
        displayQuestion();
    }
}

function finishTest() {
    saveCurrentAnswer();
    
    // Verificar si todas las preguntas obligatorias están respondidas
    const requiredQuestions = currentQuestions.filter(q => q.is_required);
    const answeredRequired = requiredQuestions.every(q => userAnswers[q.id]);
    
    if (!answeredRequired) {
        const unanswered = requiredQuestions.filter(q => !userAnswers[q.id]);
        showError(`Debes responder las siguientes preguntas obligatorias: ${unanswered.map(q => currentQuestions.indexOf(q) + 1).join(', ')}`);
        return;
    }
    
    // Mostrar modal de confirmación sin fondo gris ni bloqueo
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'), {
        backdrop: false,
        keyboard: true
    });
    modal.show();
}

async function submitTest() {
    try {
        // Enviar respuestas al backend
        const response = await fetch('../backend/submit_test.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                assignment_id: assignmentId,
                answers: userAnswers
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Ocultar modal de confirmación
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
            modal.hide();
            
            // Mostrar resultados
            showResults(data.results);
        } else {
            showError('Error enviando test: ' + data.message);
        }
    } catch (error) {
        console.error('Error enviando test:', error);
        showError('Error de conexión al enviar el test');
    }
}

function showResults(results) {
    // Mostrar resultados en el modal
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = `
        <div class="alert alert-success">
            <h4 class="alert-heading"><i class="bi bi-check-circle"></i> ¡Test Completado!</h4>
            <p>Tu test ha sido enviado correctamente.</p>
        </div>
        <ul class="list-group mb-3">
            <li class="list-group-item"><strong>Preguntas respondidas:</strong> ${results.questions_answered} / ${results.total_questions}</li>
            <li class="list-group-item"><strong>Puntaje obtenido:</strong> ${results.score} / ${results.max_score}</li>
            <li class="list-group-item"><strong>Tiempo utilizado:</strong> ${formatTime(results.time_used)}</li>
        </ul>
        <p class="text-muted">Puedes revisar tus resultados en tu perfil.</p>
    `;
    // Mostrar el modal sin fondo gris ni bloqueo
    const modal = new bootstrap.Modal(document.getElementById('resultsModal'), {
        backdrop: false,
        keyboard: true
    });
    modal.show();
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            showError('¡Tiempo agotado! El test se enviará automáticamente.');
            submitTest();
            return;
        }
        
        document.getElementById('time-remaining').textContent = formatTime(timeRemaining);
        
        // Cambiar color cuando queden menos de 5 minutos
        const timer = document.getElementById('timer');
        if (timeRemaining <= 300) { // 5 minutos
            timer.style.background = '#dc3545';
            timer.style.animation = 'pulse 1s infinite';
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function goToProfile() {
    window.location.href = 'profile.html';
}

function showError(message) {
    // Crear alerta de error
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle"></i> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Remover automáticamente después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Guardar respuestas automáticamente cada 30 segundos
setInterval(() => {
    if (currentQuestions.length > 0) {
        saveCurrentAnswer();
    }
}, 30000);

// Advertencia antes de salir de la página
window.addEventListener('beforeunload', function(e) {
    if (currentQuestions.length > 0 && Object.keys(userAnswers).length > 0) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres salir? Tus respuestas se perderán.';
        return e.returnValue;
    }
}); 