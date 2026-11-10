// ROL 2 (Base de datos) - AJUSTAR al esquema real de "inventario" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    sku: { type: String, required: true },
    bodega: { type: String, required: true },
    stock: { type: Number, min: 0, default: 0 },
    minimo: { type: Number, min: 0, default: 0 },
    movimientos: [{ tipo: String, cantidad: Number, fecha: { type: Date, default: Date.now } }],
  }, { timestamps: true });

module.exports = mongoose.model('Inventario', schema, 'inventario');
