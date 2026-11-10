// ROL 2 (Base de datos) - AJUSTAR al esquema real de "carritos" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    lineas: [{ productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' }, sku: String, cantidad: { type: Number, min: 1 } }],
    expiraEn: { type: Date },
  }, { timestamps: true });

module.exports = mongoose.model('Carrito', schema, 'carritos');
