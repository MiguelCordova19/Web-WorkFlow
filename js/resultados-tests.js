// Tabs
const tabs = document.querySelectorAll('.tab-btn');
const contents = {
  logica: document.getElementById('tab-logica'),
  programacion: document.getElementById('tab-programacion'),
  matematicas: document.getElementById('tab-matematicas')
};
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.keys(contents).forEach(k => contents[k].style.display = 'none');
    contents[btn.dataset.tab].style.display = 'block';
  });
});

// Mostrar resultados
function mostrarResultados(tipo, tablaId) {
  const resultados = JSON.parse(localStorage.getItem('resultados_' + tipo) || '[]');
  const tbody = document.getElementById(tablaId);
  tbody.innerHTML = resultados.length ? resultados.map(r => `
    <tr>
      <td>${r.nombre}</td>
      <td>${r.puntaje}</td>
      <td>${r.fecha}</td>
    </tr>
  `).join('') : '<tr><td colspan="3">Sin resultados</td></tr>';
}

mostrarResultados('logica', 'tabla-logica');
mostrarResultados('programacion', 'tabla-programacion');
mostrarResultados('matematicas', 'tabla-matematicas'); 