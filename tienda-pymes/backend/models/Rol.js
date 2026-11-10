// ROL 2 (Base de datos) - AJUSTAR al esquema real de "roles" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    permisos: [String],
  }, { timestamps: true });

module.exports = mongoose.model('Rol', schema, 'roles');
