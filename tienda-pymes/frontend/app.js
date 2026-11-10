// ROL 4 (JS e integración)
// USE_MOCK = true  -> trabaja con datos locales (no necesita la API)
// USE_MOCK = false -> consume la API real (Contrato B)
const USE_MOCK = true;
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

const escapar = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
    const v = (p.variantes && p.variantes[0]) || {};
    const variante = v.talla || v.color ? `${escapar(v.talla)} / ${escapar(v.color)} (stock ${escapar(v.stock)})` : '—';
    return `<tr>
      <td>${escapar(p.nombre)}</td>
      <td>${escapar(nombreCategoria(p.categoriaId))}</td>
      <td>₡${Number(p.precio).toLocaleString('es-CR')}</td>
      <td>${variante}</td>
      <td><span class="badge ${p.activo ? 'bg-success' : 'bg-secondary'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${escapar(p._id)}">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${escapar(p._id)}">Eliminar</button>
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
  if ($('talla').value.trim() || $('color').value.trim()) {
    datos.variantes.push({
      talla: $('talla').value.trim(), color: $('color').value.trim(), stock: Number($('stock').value) || 0,
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
    $('precio').value = p.precio ?? '';
    $('categoriaId').value = p.categoriaId || '';
    $('talla').value = v.talla || '';
    $('color').value = v.color || '';
    $('stock').value = v.stock ?? 0;
    $('activo').checked = !!p.activo;
    $('tituloForm').textContent = 'Editar producto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (btn.classList.contains('btn-eliminar')) {
    // TODO (Rol 3): cambiar confirm() por un modal de Bootstrap
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.eliminar(id);
      mostrarMensaje('Producto eliminado');
      await cargar();
    } catch (err) {
      mostrarMensaje(err.message, 'danger');
    }
  }
});

document.addEventListener('DOMContentLoaded', cargar);
