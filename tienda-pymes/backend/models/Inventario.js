// Colección "inventario": existencias por producto, SKU y bodega.  Índice único: (sku, bodega)
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const entero = { validator: Number.isInteger, message: '{PATH} debe ser un entero' };

const movimientoSchema = new mongoose.Schema(
  { tipo: String, cantidad: Number, fecha: Date },
  { _id: false }
);

const inventarioSchema = new mongoose.Schema(
  {
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    sku: { type: String, required: true, trim: true },
    bodega: { type: String, required: true, trim: true },
    existencias: { type: Number, required: true, min: 0, validate: entero },
    minimo: { type: Number, required: true, min: 0, validate: entero },
    movimientos: [movimientoSchema],
  },
  opciones
);

module.exports = mongoose.model('Inventario', inventarioSchema, 'inventario');
