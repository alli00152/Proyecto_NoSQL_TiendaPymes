// Convierte los errores en { error } con el código HTTP correcto
function manejarError(res, err) {
  if (err.name === 'ValidationError') {
  const mensajes = Object.values(err.errors).map((e) => e.message);
  return res.status(400).json({ error: mensajes.join('. ') });
}
if (err.name === 'CastError') {
  return res.status(400).json({ error: `Valor inválido en ${err.path}` });
}
  if (err.code === 11000) {
  return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
 }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = manejarError;
