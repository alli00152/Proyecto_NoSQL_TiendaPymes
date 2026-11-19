// Colección "notificaciones": mensajes enviados y su estado de entrega.
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const notificacionSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    canal: { type: String, enum: ['CORREO', 'SMS', 'PUSH'], required: true },
    asunto: String,
    mensaje: String,
    pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' },
    estado: { type: String, enum: ['PENDIENTE', 'ENVIADA', 'FALLIDA'], required: true },
    enviadaEn: Date,
  },
  opciones
);

module.exports = mongoose.model('Notificacion', notificacionSchema, 'notificaciones');
