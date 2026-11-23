// ROL 4 (JS e integración) - página de reportes
// Consume /api/reportes del backend. El contrato está en backend/README.md.
const API_URL = 'http://localhost:3000/api';

// Título de cada botón, que también se muestra arriba de la tabla
const TITULOS_REPORTE = {
  resumen: 'Resumen',
  'productos-por-categoria': 'Productos por categoría',
  'stock-por-producto': 'Stock por producto',
  'precio-por-categoria': 'Precio por categoría',
  'stock-bajo': 'Stock bajo',
  'pedidos-por-estado': 'Pedidos por estado',
};

// Nombre legible de los campos que devuelven los reportes
const TITULOS_CAMPO = {
  productos: 'Productos',
  categorias: 'Categorías',
  pedidos: 'Pedidos',
  categoria: 'Categoría',
  cantidad: 'Cantidad',
  producto: 'Producto',
  stockTotal: 'Stock total',
  promedio: 'Promedio',
  minimo: 'Mínimo',
  maximo: 'Máximo',
  sku: 'SKU',
  existencias: 'Existencias',
  estado: 'Estado',
};

// Campos que son dinero: se muestran con ₡ y separador de miles.
// Los demás números son cuentas (cantidad, stock) y van tal cual.
const CAMPOS_MONTO = ['promedio', 'minimo', 'maximo'];

// Busca un elemento del HTML por su id
function $(id) {
  return document.getElementById(id);
}

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

// Pide datos a la API y devuelve el JSON. Si algo falla, lanza un error con el mensaje
async function pedir(url) {
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    // Acá no hubo respuesta: el backend no está corriendo o no se puede alcanzar
    throw new Error(`No se pudo conectar con la API. Revise que esté corriendo en ${API_URL}`);
  }
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

// Arma la ruta del reporte. El de stock bajo es el único que lleva parámetro
function rutaDe(nombre) {
  if (nombre === 'stock-bajo') {
    return `/reportes/stock-bajo?limite=${encodeURIComponent($('limite').value)}`;
  }
  return `/reportes/${nombre}`;
}

// Dice si un campo es un monto de dinero
function esCampoMonto(clave) {
  for (const campo of CAMPOS_MONTO) {
    if (campo === clave) {
      return true;
    }
  }
  return false;
}

// Pasa el nombre de un campo a algo legible: "stockTotal" se vuelve "Stock total"
function tituloCampo(clave) {
  if (TITULOS_CAMPO[clave]) {
    return TITULOS_CAMPO[clave];
  }
  const conEspacios = clave.replace(/([A-Z])/g, ' $1').toLowerCase();
  return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
}

// Da el texto de una celda: los montos con ₡ y separador de miles
function celda(clave, valor) {
  if (esCampoMonto(clave) && typeof valor === 'number') {
    return `₡${valor.toLocaleString('es-CR')}`;
  }
  return escapar(valor);
}

// Arma la tabla de cualquiera de los 6 reportes, con las claves de la respuesta.
// El resumen viene como objeto, así que se envuelve para que salga como una fila.
function tablaHtml(datos) {
  let filas;
  if (Array.isArray(datos)) {
    filas = datos;
  } else {
    filas = [datos];
  }
  if (filas.length === 0) {
    return '<p class="text-center text-muted my-3">Sin resultados</p>';
  }
  const columnas = Object.keys(filas[0]);

  let encabezado = '';
  for (const columna of columnas) {
    encabezado = encabezado + `<th>${escapar(tituloCampo(columna))}</th>`;
  }

  let cuerpo = '';
  for (const fila of filas) {
    cuerpo = cuerpo + '<tr>';
    for (const columna of columnas) {
      cuerpo = cuerpo + `<td>${celda(columna, fila[columna])}</td>`;
    }
    cuerpo = cuerpo + '</tr>';
  }

  return (
    '<table class="table table-striped table-hover align-middle mb-0">' +
    `<thead><tr>${encabezado}</tr></thead>` +
    `<tbody>${cuerpo}</tbody>` +
    '</table>'
  );
}

// Pide un reporte a la API y lo dibuja en la tabla
async function verReporte(nombre) {
  let titulo = TITULOS_REPORTE[nombre];
  if (!titulo) {
    titulo = 'Reporte';
  }
  $('tituloReporte').textContent = titulo;
  $('tabla').innerHTML = '<p class="text-center text-muted my-3">Cargando…</p>';
  try {
    const datos = await pedir(API_URL + rutaDe(nombre));
    $('tabla').innerHTML = tablaHtml(datos);
  } catch (err) {
    $('tabla').innerHTML = '';
    mostrarMensaje(err.message, 'danger');
  }
}

// Responde al clic en cualquiera de los botones de reporte
function alTocarBoton(e) {
  const btn = e.target.closest('button[data-reporte]');
  if (!btn) {
    return;
  }
  verReporte(btn.dataset.reporte);
}

// Delegación de eventos para los botones de los reportes
document.addEventListener('click', alTocarBoton);
