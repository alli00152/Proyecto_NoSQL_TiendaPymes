// Colección "carritos": carritos activos o abandonados.  Índice TTL: expiraEn (ttl_carritos_expiraEn)
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const lineaSchema = new mongoose.Schema(
  {
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    sku: String,
    nombre: String,
    cantidad: { type: Number, min: 1 },
    precioUnit: { type: Number, min: 0 },
  },
  { _id: false }
);

const carritoSchema = new mongoose.Schema(
  {
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    lineas: [lineaSchema],
    estado: { type: String, enum: ['ACTIVO', 'ABANDONADO', 'CONVERTIDO'], default: 'ACTIVO', required: true },
    expiraEn: { type: Date, required: true },
  },
  { ...opciones, timestamps: { createdAt: 'creadoEn', updatedAt: false } }
);

module.exports = mongoose.model('Carrito', carritoSchema, 'carritos');
