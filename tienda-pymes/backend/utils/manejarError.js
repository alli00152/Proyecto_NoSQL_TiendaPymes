// Convierte los errores en { error } con el código HTTP correcto
function manejarError(res, err) {
  // Reglas de negocio del service: traen su propio status (400, 404, 409)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
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
  // 121 = lo rechazó el validador $jsonSchema de la base; errInfo dice qué campo falló
  if (err.code === 121) {
    console.error(err.errInfo);
    return res.status(400).json({ error: 'La base rechazó los datos: revise los campos obligatorios' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = manejarError;
