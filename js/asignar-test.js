document.getElementById('form-asignar-test').addEventListener('submit', function(e) {
  e.preventDefault();
  const nombre = this.candidato.value.trim();
  const tipo = this.tipo_test.value;
  if (!nombre || !tipo) return alert('Completa todos los campos');
  localStorage.setItem('nombre_candidato', nombre);
  localStorage.setItem('tipo_test', tipo);
  if (tipo === 'logica') {
    window.location.href = 'realizar-test-logica.html';
  } else if (tipo === 'programacion') {
    window.location.href = 'realizar-test-programacion.html';
  } else if (tipo === 'matematicas') {
    window.location.href = 'realizar-test-matematicas.html';
  }
}); 