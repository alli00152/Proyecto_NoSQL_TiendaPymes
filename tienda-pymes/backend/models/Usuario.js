// ROL 2 (Base de datos) - AJUSTAR al esquema real de "usuarios" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    rolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rol' },
    estado: { type: String, default: 'activo' },
    fechaRegistro: { type: Date, default: Date.now },
  }, { timestamps: true });

module.exports = mongoose.model('Usuario', schema, 'usuarios');
