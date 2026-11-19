// Colección "usuarios": cuentas de acceso.  Índice único: correo (ux_usuarios_correo)
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const usuarioSchema = new mongoose.Schema(
  {
    correo: { type: String, required: true, trim: true, match: /^.+@.+\..+$/ },
    passwordHash: { type: String, required: true },
    rolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rol', required: true },
    estado: { type: String, enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'], default: 'ACTIVO', required: true },
  },
  { ...opciones, timestamps: { createdAt: 'creadoEn', updatedAt: false } }
);

module.exports = mongoose.model('Usuario', usuarioSchema, 'usuarios');
