// ROL 2 (Base de datos) - AJUSTAR al esquema real de "pagos" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' },
    metodo: String,
    monto: { type: Number, min: 0 },
    referencia: String,
    resultado: String,
  }, { timestamps: true });

module.exports = mongoose.model('Pago', schema, 'pagos');
