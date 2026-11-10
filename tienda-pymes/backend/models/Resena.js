// ROL 2 (Base de datos) - AJUSTAR al esquema real de "resenas" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    calificacion: { type: Number, min: 1, max: 5 },
    comentario: String,
  }, { timestamps: true });

module.exports = mongoose.model('Resena', schema, 'resenas');
