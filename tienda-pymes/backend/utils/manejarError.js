// Convierte los errores en { error } con el código HTTP correcto
function manejarError(res, err) {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 121) {
    return res.status(400).json({ error: 'Los datos no cumplen la validación de la base' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = manejarError;
