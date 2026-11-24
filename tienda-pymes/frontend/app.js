// ROL 4 (JS e integración)
// USE_MOCK = true  -> trabaja con datos locales (no necesita la API)
// USE_MOCK = false -> consume la API real (Contrato B)
const USE_MOCK = false;
const API_URL = 'http://localhost:3000/api';

// ---------- Capa de datos ----------
let mockProductos = [
  { _id: '1', nombre: 'Camisa lino manga larga', descripcion: 'Camisa casual', precio: 18500,
    categoriaId: 'c1', variantes: [{ sku: 'CAM-1', talla: 'M', color: 'Azul', stock: 12 }], activo: true },
];
const mockCategorias = [
  { _id: 'c1', nombre: 'Camisas' }, { _id: 'c2', nombre: 'Pantalones' }, { _id: 'c3', nombre: 'Vestidos' },
];

async function pedir(url, opciones) {
  const res = await fetch(url, opciones);
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || `Error ${res.status}`);
  return datos;
}
const jsonOpts = (method, body) => ({
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

const api = {
  listar: async () => (USE_MOCK ? [...mockProductos] : pedir(`${API_URL}/productos`)),
  categorias: async () => (USE_MOCK ? [...mockCategorias] : pedir(`${API_URL}/categorias`)),
  crear: async (p) => {
    if (USE_MOCK) { p._id = String(Date.now()); mockProductos.push(p); return p; }
    return pedir(`${API_URL}/productos`, jsonOpts('POST', p));
  },
  actualizar: async (id, p) => {
    if (USE_MOCK) {
      mockProductos = mockProductos.map((x) => (x._id === id ? { ...x, ...p } : x));
      return p;
    }
    return pedir(`${API_URL}/productos/${id}`, jsonOpts('PUT', p));
  },
  eliminar: async (id) => {
    if (USE_MOCK) { mockProductos = mockProductos.filter((x) => x._id !== id); return { mensaje: 'Eliminado' }; }
    return pedir(`${API_URL}/productos/${id}`, { method: 'DELETE' });
  },
};

// ---------- Interfaz ----------
const $ = (id) => document.getElementById(id);
const form = $('formProducto');
let productos = [];
let categorias = [];
let productoEliminarId = null;

const modalEliminar = new bootstrap.Modal(
  $('modalEliminar')
);

const escapar = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Saca el monto del precio: la API lo devuelve como { monto, moneda } y el mock como número
function montoDe(precio) {
  if (precio && typeof precio === 'object') {
    return precio.monto;
  }
  return precio;
}

function mostrarMensaje(texto, tipo = 'success') {
  $('mensaje').innerHTML =
    `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">${escapar(texto)}` +
    `<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

function nombreCategoria(id) {
  const c = categorias.find((x) => x._id === id);
  return c ? c.nombre : '—';
}

function renderTabla() {
  const tbody = $('tablaProductos');
  if (!productos.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay productos</td></tr>';
    return;
  }
  tbody.innerHTML = productos.map((p) => {
    const lista = p.variantes || [];
    let variantes = '—';
    if (lista.length) {
      variantes = '';
      for (const v of lista) {
        if (variantes !== '') variantes = variantes + '<br>';
        variantes = variantes + `${escapar(v.sku)}: ${escapar(v.talla)} / ${escapar(v.color)} (stock ${escapar(v.stock)})`;
      }
    }
    return `<tr>
      <td>${escapar(p.nombre)}</td>
      <td>${escapar(nombreCategoria(p.categoriaId))}</td>
      <td>₡${Number(montoDe(p.precio)).toLocaleString('es-CR')}</td>
      <td>${variantes}</td>
      <td><span class="badge ${p.activo ? 'bg-success' : 'bg-secondary'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-primary me-2 btn-editar" data-id="${escapar(p._id)}"><i class="fa-solid fa-pen me-1" aria-hidden="true"></i>Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${escapar(p._id)}"><i class="fa-solid fa-trash me-1" aria-hidden="true"></i>Eliminar</button>
      </td></tr>`;
  }).join('');
}

function renderCategorias() {
  $('categoriaId').innerHTML = '<option value="">Sin categoría</option>' +
    categorias.map((c) => `<option value="${escapar(c._id)}">${escapar(c.nombre)}</option>`).join('');
}

async function cargar() {
  try {
    [productos, categorias] = await Promise.all([api.listar(), api.categorias().catch(() => [])]);
    renderCategorias();
    renderTabla();
  } catch (err) {
    mostrarMensaje(`No se pudo cargar: ${err.message}`, 'danger');
  }
}

function limpiarFormulario() {
  form.reset();
  $('productoId').value = '';
  $('stock').value = 0;
  $('activo').checked = true;
  $('sku').readOnly = false;
  $('tituloForm').textContent = 'Agregar producto';
}

function leerFormulario() {
  const datos = {
    nombre: $('nombre').value.trim(),
    descripcion: $('descripcion').value.trim(),
    precio: Number($('precio').value),
    activo: $('activo').checked,
    variantes: [],
  };
  if ($('categoriaId').value) datos.categoriaId = $('categoriaId').value;
  // La variante se arma solo si hay SKU: la API lo exige en cada variante
  if ($('sku').value.trim()) {
    datos.variantes.push({
      sku: $('sku').value.trim(),
      talla: $('talla').value.trim(),
      color: $('color').value.trim(),
      stock: Number($('stock').value) || 0,
    });
  }
  return datos;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = leerFormulario();
  if (!datos.nombre || Number.isNaN(datos.precio) || datos.precio < 0) {
    return mostrarMensaje('Complete el nombre y un precio válido', 'warning');
  }
  if (!$('sku').value.trim() && ($('talla').value.trim() || $('color').value.trim())) {
    return mostrarMensaje('Escriba el SKU de la variante', 'warning');
  }
  const id = $('productoId').value;
  try {
    if (id) await api.actualizar(id, datos); else await api.crear(datos);
    mostrarMensaje(id ? 'Producto actualizado' : 'Producto agregado');
    limpiarFormulario();
    await cargar();
  } catch (err) {
    mostrarMensaje(err.message, 'danger');
  }
});

$('btnCancelar').addEventListener('click', limpiarFormulario);

// Delegación de eventos para los botones de la tabla
$('tablaProductos').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.classList.contains('btn-editar')) {
    const p = productos.find((x) => x._id === id);
    if (!p) return;
    const v = (p.variantes && p.variantes[0]) || {};
    $('productoId').value = p._id;
    $('nombre').value = p.nombre || '';
    $('descripcion').value = p.descripcion || '';
    const monto = montoDe(p.precio);
    if (monto === undefined || monto === null) {
      $('precio').value = '';
    } else {
      $('precio').value = monto;
    }
    $('categoriaId').value = p.categoriaId || '';
    $('sku').value = v.sku || '';
    // El SKU identifica la variante: si se cambia, la API la toma como una variante nueva
    if (v.sku) {
      $('sku').readOnly = true;
    } else {
      $('sku').readOnly = false;
    }
    $('talla').value = v.talla || '';
    $('color').value = v.color || '';
    $('stock').value = v.stock ?? 0;
    $('activo').checked = !!p.activo;
    $('tituloForm').textContent = 'Editar producto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  
     if (btn.classList.contains('btn-eliminar')) {
    const p = productos.find((x) => x._id === id);
    if (!p) return;

    productoEliminarId = id;

    $('modalEliminarNombre').textContent = p.nombre;

    modalEliminar.show();
  }
});

$('btnConfirmarEliminar').addEventListener('click', async () => {
  if (!productoEliminarId) return;

  const boton = $('btnConfirmarEliminar');
  boton.disabled = true;

  try {
    await api.eliminar(productoEliminarId);

    modalEliminar.hide();
    mostrarMensaje('Producto eliminado correctamente');

    limpiarFormulario();
    await cargar();

  } catch (err) {
    modalEliminar.hide();
    mostrarMensaje(err.message, 'danger');

  } finally {
    productoEliminarId = null;
    boton.disabled = false;
  }
});
document.addEventListener('DOMContentLoaded', cargar);
