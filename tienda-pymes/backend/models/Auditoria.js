// ROL 2 (Base de datos) - AJUSTAR al esquema real de "auditoria" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    operacion: String,
    entidad: String,
    fecha: { type: Date, default: Date.now },
  }, { timestamps: true });

module.exports = mongoose.model('Auditoria', schema, 'auditoria');
