const tbodyPostulantes = document.getElementById('tbody-postulantes');

function badgeEstado(estado) {
  if (estado === 'activo') return '<span class="badge-estado badge-activo">Activo</span>';
  if (estado === 'rechazado') return '<span class="badge-estado badge-rechazado">Rechazado</span>';
  return '<span class="badge-estado badge-pendiente">Pendiente</span>';
}
function badgeTest(tipo) {
  if (!tipo || tipo === 'Sin test') return '<span class="badge-test">Sin test</span>';
  if (tipo === 'Programación') return '<span class="badge-test programacion">Programación</span>';
  if (tipo === 'Matemáticas') return '<span class="badge-test matematicas">Matemáticas</span>';
  return `<span class="badge-test">${tipo}</span>`;
}

async function mostrarPostulantes() {
  const res = await fetch('backend/get_postulantes.php');
  const postulantes = await res.json();
  tbodyPostulantes.innerHTML = postulantes.length ? postulantes.map(p => `
    <tr>
      <td>${p.nombre}</td>
      <td>${p.experiencia ? p.experiencia + ' años' : '-'}</td>
      <td>${p.estudios || '-'}</td>
      <td>${p.habilidades || '-'}</td>
      <td>${badgeTest(p.tipoTest)}</td>
      <td>${p.resultadoTest || 'Pendiente'}</td>
      <td>${badgeEstado(p.estado)}</td>
      <td>-</td>
    </tr>
  `).join('') : '<tr><td colspan="8" style="text-align:center; color:#64748b; font-style:italic; background:#fff;">No hay postulantes registrados.</td></tr>';
}

mostrarPostulantes(); 