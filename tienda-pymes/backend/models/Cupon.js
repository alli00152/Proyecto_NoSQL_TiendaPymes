// ROL 2 (Base de datos) - AJUSTAR al esquema real de "cupones" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    codigo: { type: String, required: true, unique: true },
    descuento: { type: Number, min: 0 },
    vigenciaHasta: Date,
    limiteUsos: Number,
  }, { timestamps: true });

module.exports = mongoose.model('Cupon', schema, 'cupones');
