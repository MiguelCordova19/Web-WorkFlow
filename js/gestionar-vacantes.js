// Publicar vacante
const formVacante = document.getElementById('form-vacante');
const listaVacantes = document.getElementById('lista-vacantes');

formVacante.addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(formVacante);
  const res = await fetch('backend/post_vacante.php', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  alert(data.message);
  if (data.success) {
    formVacante.reset();
    fetchVacantes();
  }
});

async function fetchVacantes() {
  const res = await fetch('backend/get_vacantes.php');
  const vacantes = await res.json();
  listaVacantes.innerHTML = vacantes.length
    ? vacantes.map(v => `
      <div class="vacante">
        <strong>${v.cargo}</strong> (${v.tipo_contrato})<br>
        <em>Salario:</em> $${v.salario}<br>
        <em>Descripción:</em> ${v.descripcion}<br>
        <small>Publicado: ${v.fecha_publicacion}</small>
      </div>
    `).join('')
    : '<p>No hay vacantes publicadas.</p>';
}

fetchVacantes(); 