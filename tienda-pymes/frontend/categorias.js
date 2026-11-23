// ROL 4 (JS e integración) - administración de categorías
// Consume /api/categorias del backend. El contrato está en backend/README.md.
const API_URL = 'http://localhost:3000/api';

// ---------- Capa de datos ----------

// Pide datos a la API y devuelve el JSON. Si algo falla, lanza un error con el mensaje
async function pedir(url, opciones) {
  const res = await fetch(url, opciones);
  let datos = {};
  try {
    datos = await res.json();
  } catch (err) {
    datos = {};
  }
  if (!res.ok) {
    if (datos.error) {
      throw new Error(datos.error);
    }
    throw new Error(`Error ${res.status}`);
  }
  return datos;
}

// Arma las opciones del fetch para mandar un objeto como JSON
function jsonOpts(method, body) {
  return {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

const api = {
  // Pide la lista de categorías
  listar() {
    return pedir(`${API_URL}/categorias`);
  },
  // Crea una categoría
  crear(categoria) {
    return pedir(`${API_URL}/categorias`, jsonOpts('POST', categoria));
  },
  // Actualiza una categoría
  actualizar(id, categoria) {
    return pedir(`${API_URL}/categorias/${id}`, jsonOpts('PUT', categoria));
  },
  // Borra una categoría
  eliminar(id) {
    return pedir(`${API_URL}/categorias/${id}`, { method: 'DELETE' });
  },
};

// ---------- Interfaz ----------

// Busca un elemento del HTML por su id
function $(id) {
  return document.getElementById(id);
}

const form = $('formCategoria');
let categorias = [];

// Cambia un caracter que el navegador podría tomar como HTML por su código
function escaparCaracter(caracter) {
  if (caracter === '&') return '&amp;';
  if (caracter === '<') return '&lt;';
  if (caracter === '>') return '&gt;';
  if (caracter === '"') return '&quot;';
  return '&#39;';
}

// Deja un texto listo para ponerlo dentro del HTML
function escapar(texto) {
  if (texto === undefined || texto === null) {
    return '';
  }
  return String(texto).replace(/[&<>"']/g, escaparCaracter);
}

// Muestra un aviso de color arriba de la página
function mostrarMensaje(texto, tipo = 'success') {
  $('mensaje').innerHTML =
    `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">${escapar(texto)}` +
    `<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

// Busca una categoría de la lista por su id. Devuelve null si no está
function buscarCategoria(id) {
  for (const categoria of categorias) {
    if (categoria._id === id) {
      return categoria;
    }
  }
  return null;
}

// Devuelve el nombre de la categoría padre, o un guion si no tiene
function nombrePadre(id) {
  const categoria = buscarCategoria(id);
  if (categoria) {
    return categoria.nombre;
  }
  return '—';
}

// Dibuja la tabla con todas las categorías
function renderTabla() {
  const tbody = $('tablaCategorias');
  if (categorias.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay categorías</td></tr>';
    return;
  }
  let filas = '';
  for (const c of categorias) {
    filas = filas + `<tr>
      <td>${escapar(c.nombre)}</td>
      <td>${escapar(nombrePadre(c.padreId))}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${escapar(c._id)}"><i class="fa-solid fa-pen me-1" aria-hidden="true"></i>Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${escapar(c._id)}"><i class="fa-solid fa-trash me-1" aria-hidden="true"></i>Eliminar</button>
      </td></tr>`;
  }
  tbody.innerHTML = filas;
}

// Llena el select de padres. No ofrece la categoría que se está editando,
// porque no puede ser su propio padre
function renderPadres(excluirId) {
  let opciones = '<option value="">Ninguna</option>';
  for (const c of categorias) {
    if (c._id !== excluirId) {
      opciones = opciones + `<option value="${escapar(c._id)}">${escapar(c.nombre)}</option>`;
    }
  }
  $('padreId').innerHTML = opciones;
}

// Trae las categorías de la API y dibuja la pantalla
async function cargar() {
  try {
    categorias = await api.listar();
    renderPadres($('categoriaId').value);
    renderTabla();
  } catch (err) {
    mostrarMensaje(`No se pudo cargar: ${err.message}`, 'danger');
  }
}

// Vacía el formulario y lo deja listo para agregar
function limpiarFormulario() {
  form.reset();
  $('categoriaId').value = '';
  renderPadres();
  $('tituloForm').textContent = 'Agregar categoría';
}

// Lee los campos del formulario
function leerFormulario() {
  let padreId = null;
  if ($('padreId').value) {
    padreId = $('padreId').value;
  }
  return {
    nombre: $('nombre').value.trim(),
    // null le quita el padre: en esta colección la base acepta padreId nulo
    padreId: padreId,
  };
}

// Guarda el formulario: crea una categoría nueva o actualiza la que se está editando
async function guardarFormulario(e) {
  e.preventDefault();
  const datos = leerFormulario();
  if (!datos.nombre) {
    mostrarMensaje('Escriba el nombre de la categoría', 'warning');
    return;
  }
  const id = $('categoriaId').value;
  try {
    if (id) {
      await api.actualizar(id, datos);
      mostrarMensaje('Categoría actualizada');
    } else {
      await api.crear(datos);
      mostrarMensaje('Categoría agregada');
    }
    limpiarFormulario();
    await cargar();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

// Carga una categoría en el formulario para editarla
function editarCategoria(id) {
  const c = buscarCategoria(id);
  if (!c) {
    return;
  }
  $('categoriaId').value = c._id;
  $('nombre').value = c.nombre || '';
  renderPadres(c._id);
  $('padreId').value = c.padreId || '';
  $('tituloForm').textContent = 'Editar categoría';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Borra una categoría, después de confirmar
async function eliminarCategoria(id) {
  if (!confirm('¿Eliminar esta categoría?')) {
    return;
  }
  try {
    await api.eliminar(id);
    mostrarMensaje('Categoría eliminada');
    await cargar();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
}

// Responde al clic en los botones Editar y Eliminar de la tabla
function alTocarTabla(e) {
  const btn = e.target.closest('button[data-id]');
  if (!btn) {
    return;
  }
  if (btn.classList.contains('btn-editar')) {
    editarCategoria(btn.dataset.id);
  }
  if (btn.classList.contains('btn-eliminar')) {
    eliminarCategoria(btn.dataset.id);
  }
}

form.addEventListener('submit', guardarFormulario);
$('btnCancelar').addEventListener('click', limpiarFormulario);
$('tablaCategorias').addEventListener('click', alTocarTabla);
document.addEventListener('DOMContentLoaded', cargar);
