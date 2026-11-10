// ROL 2 (Base de datos) - AJUSTAR al esquema real de "pedidos" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    clienteId: { ...{ type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }, required: true },
    comercioId: { ...{ type: mongoose.Schema.Types.ObjectId, ref: 'Comercio' }, required: true },
    lineas: {
      type: [{ productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' }, nombre: String, precio: Number, cantidad: Number }],
      validate: (v) => v.length > 0,
    },
    total: { type: Number, required: true, min: 0 },
    impuestos: { type: Number, default: 0 },
    estado: { type: String, required: true, enum: ['CREADO', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] },
    historial: [{ estado: String, fecha: { type: Date, default: Date.now } }],
    direccionEntrega: { provincia: String, canton: String, distrito: String, detalle: String },
  }, { timestamps: true });

module.exports = mongoose.model('Pedido', schema, 'pedidos');
