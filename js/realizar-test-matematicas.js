const nombreCandidato = localStorage.getItem('nombre_candidato') || '';
document.getElementById('nombre-candidato').textContent = nombreCandidato;

document.getElementById('form-matematicas').addEventListener('submit', function(e) {
  e.preventDefault();
  const respuestasCorrectas = [
    '56', // Pregunta 1
    '9', // Pregunta 2
    '42', // Pregunta 3
    '25', // Pregunta 4
    '81' // Pregunta 5
  ];
  const respuestasUsuario = [
    document.querySelector('[name="respuesta1"]').value.trim().toLowerCase(),
    document.querySelector('[name="respuesta2"]').value.trim().toLowerCase(),
    document.querySelector('[name="respuesta3"]').value.trim().toLowerCase(),
    document.querySelector('[name="respuesta4"]').value.trim().toLowerCase(),
    document.querySelector('[name="respuesta5"]').value.trim().toLowerCase()
  ];
  let resultadoHTML = '';
  let puntaje = 0;
  for(let i=0; i<5; i++) {
    if(respuestasUsuario[i] === respuestasCorrectas[i]) {
      resultadoHTML += `Pregunta ${i+1}: Correcta<br>`;
      puntaje++;
    } else {
      resultadoHTML += `Pregunta ${i+1}: Incorrecta<br>`;
    }
  }
  resultadoHTML += `<strong>Resultado: ${puntaje}/5 correctas</strong>`;
  document.getElementById('resultado-test').innerHTML = resultadoHTML;
  // Deshabilitar inputs y botón
  const form = document.getElementById('form-matematicas');
  Array.from(form.elements).forEach(function(element) {
    element.disabled = true;
  });
  // Guardar resultados en localStorage
  localStorage.setItem('resultados_matematicas', JSON.stringify({
    puntaje,
    detalles: resultadoHTML,
    nombre: nombreCandidato
  }));
  // Mostrar botón para ver resultados
  document.getElementById('ver-resultado-matematicas').style.display = 'inline-block';
  document.getElementById('ver-resultado-matematicas').onclick = function() {
    window.location.href = 'resultados-matematicas.html';
  };
  // Redirigir automáticamente después de 1 segundo
  setTimeout(function() {
    window.location.href = 'resultados-matematicas.html';
  }, 1000);
}); 