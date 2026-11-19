// Colección "auditoria": bitácora de acciones sensibles.  Índice: (usuarioId, fecha desc)
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const auditoriaSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    operacion: { type: String, required: true },
    entidad: { type: String, required: true },
    entidadId: mongoose.Schema.Types.ObjectId,
    detalle: mongoose.Schema.Types.Mixed,          // ej. { antes: 17900, despues: 18500 }
    ip: String,
    fecha: { type: Date, required: true, default: Date.now },
  },
  opciones
);

module.exports = mongoose.model('Auditoria', auditoriaSchema, 'auditoria');
