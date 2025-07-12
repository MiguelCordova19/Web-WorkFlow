const nombreCandidato = localStorage.getItem('nombre_candidato') || '';
document.getElementById('nombre-candidato').textContent = nombreCandidato;

document.getElementById('form-logica').addEventListener('submit', function(e) {
  e.preventDefault();
  const respuestasCorrectas = [
    '32', // Pregunta 1
    'si', // Pregunta 2 (aceptar variantes)
    'jueves', // Pregunta 3
    '6', // Pregunta 4
    '5' // Pregunta 5
  ];
  const variantesSi = ['si', 'sí', 'SI', 'Sí'];
  const respuestasUsuario = [
    document.querySelector('[name="respuesta1"]').value.trim().toLowerCase(),
    document.querySelector('[name="respuesta2"]').value.trim().toLowerCase(),
    document.querySelector('[name="respuesta3"]').value.trim().toLowerCase(),
    document.querySelector('[name="respuesta4"]').value.trim().toLowerCase(),
    document.querySelector('[name="respuesta5"]').value.trim().toLowerCase()
  ];
  let resultadoHTML = '';
  let puntaje = 0;
  // Pregunta 1
  if(respuestasUsuario[0] === respuestasCorrectas[0]) {
    resultadoHTML += 'Pregunta 1: Correcta<br>';
    puntaje++;
  } else {
    resultadoHTML += 'Pregunta 1: Incorrecta<br>';
  }
  // Pregunta 2
  if(variantesSi.includes(respuestasUsuario[1])) {
    resultadoHTML += 'Pregunta 2: Correcta<br>';
    puntaje++;
  } else {
    resultadoHTML += 'Pregunta 2: Incorrecta<br>';
  }
  // Pregunta 3
  if(respuestasUsuario[2] === respuestasCorrectas[2]) {
    resultadoHTML += 'Pregunta 3: Correcta<br>';
    puntaje++;
  } else {
    resultadoHTML += 'Pregunta 3: Incorrecta<br>';
  }
  // Pregunta 4
  if(respuestasUsuario[3] === respuestasCorrectas[3]) {
    resultadoHTML += 'Pregunta 4: Correcta<br>';
    puntaje++;
  } else {
    resultadoHTML += 'Pregunta 4: Incorrecta<br>';
  }
  // Pregunta 5
  if(respuestasUsuario[4] === respuestasCorrectas[4]) {
    resultadoHTML += 'Pregunta 5: Correcta<br>';
    puntaje++;
  } else {
    resultadoHTML += 'Pregunta 5: Incorrecta<br>';
  }
  resultadoHTML += `<strong>Resultado: ${puntaje}/5 correctas</strong>`;
  document.getElementById('resultado-test').innerHTML = resultadoHTML;
  const form = document.getElementById('form-logica');
  Array.from(form.elements).forEach(function(element) {
    element.disabled = true;
  });
  localStorage.setItem('resultados_logica', JSON.stringify({
    puntaje,
    detalles: [
      resultadoHTML
    ],
    nombre: nombreCandidato
  }));
  document.getElementById('ver-resultado-logica').style.display = 'inline-block';
  document.getElementById('ver-resultado-logica').onclick = function() {
    window.location.href = 'resultados-logica.html';
  };
  setTimeout(function() {
    window.location.href = 'resultados-logica.html';
  }, 1000);
}); 