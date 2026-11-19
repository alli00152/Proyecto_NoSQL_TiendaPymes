// Colección "pagos": transacciones.  Índice: pedidoId
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const pagoSchema = new mongoose.Schema(
  {
    pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true },
    metodo: { type: String, enum: ['TARJETA', 'SINPE', 'TRANSFERENCIA', 'EFECTIVO'], required: true },
    monto: { type: Number, required: true, min: 0 },
    moneda: { type: String, default: 'CRC' },
    referenciaPasarela: String,
    resultado: { type: String, enum: ['APROBADO', 'RECHAZADO', 'PENDIENTE'], required: true },
    fecha: Date,
  },
  opciones
);

module.exports = mongoose.model('Pago', pagoSchema, 'pagos');
