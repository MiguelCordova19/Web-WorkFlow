const nombreCandidato = localStorage.getItem('nombre_candidato') || '';
document.getElementById('nombre-candidato').textContent = nombreCandidato;

document.getElementById('form-programacion').addEventListener('submit', function(e) {
  e.preventDefault();
  const respuestasCorrectas = [
    '22', // Pregunta 1
    '', // Pregunta 2 (abierta)
    'hypertext markup language', // Pregunta 3
    'false', // Pregunta 4
    '', // Pregunta 5 (abierta)
  ];
  const variantesHTML = [
    'html', 'hypertext markup language', 'lenguaje de marcado de hipertexto'
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
  // Pregunta 1
  if(respuestasUsuario[0] === respuestasCorrectas[0]) {
    resultadoHTML += 'Pregunta 1: Correcta<br>';
    puntaje++;
  } else {
    resultadoHTML += 'Pregunta 1: Incorrecta<br>';
  }
  // Pregunta 2 (aceptar palabras clave)
  if(
    respuestasUsuario[1].includes('almacenar') ||
    respuestasUsuario[1].includes('guardar') ||
    respuestasUsuario[1].includes('valor') ||
    respuestasUsuario[1].includes('dato')
  ) {
    resultadoHTML += 'Pregunta 2: Correcta<br>';
    puntaje++;
  } else {
    resultadoHTML += 'Pregunta 2: Incorrecta<br>';
  }
  // Pregunta 3 (aceptar variantes)
  if(variantesHTML.includes(respuestasUsuario[2])) {
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
  // Pregunta 5 (aceptar palabras clave)
  if(
    respuestasUsuario[4].includes('repetir') ||
    respuestasUsuario[4].includes('iterar') ||
    respuestasUsuario[4].includes('ciclo') ||
    respuestasUsuario[4].includes('varias veces')
  ) {
    resultadoHTML += 'Pregunta 5: Correcta<br>';
    puntaje++;
  } else {
    resultadoHTML += 'Pregunta 5: Incorrecta<br>';
  }
  resultadoHTML += `<strong>Resultado: ${puntaje}/5 correctas</strong>`;
  document.getElementById('resultado-test').innerHTML = resultadoHTML;
  // Deshabilitar inputs y botón
  const form = document.getElementById('form-programacion');
  Array.from(form.elements).forEach(function(element) {
    element.disabled = true;
  });
  // Guardar resultados en localStorage
  localStorage.setItem('resultados_programacion', JSON.stringify({
    puntaje,
    detalles: resultadoHTML,
    nombre: nombreCandidato
  }));
  // Mostrar botón para ver resultados
  document.getElementById('ver-resultado-programacion').style.display = 'inline-block';
  document.getElementById('ver-resultado-programacion').onclick = function() {
    window.location.href = 'resultados-programacion.html';
  };
  // Redirigir automáticamente después de 1 segundo
  setTimeout(function() {
    window.location.href = 'resultados-programacion.html';
  }, 1000);
}); 