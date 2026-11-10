// ROL 2 (Base de datos) - AJUSTAR al esquema real de "envios" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' },
    transportista: String,
    guia: String,
    estados: [{ estado: String, fecha: { type: Date, default: Date.now } }],
    fechaEstimada: Date,
  }, { timestamps: true });

module.exports = mongoose.model('Envio', schema, 'envios');
