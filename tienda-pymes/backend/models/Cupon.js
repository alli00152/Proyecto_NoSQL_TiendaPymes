// Colección "cupones": promociones.  Índice único: codigo
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const cuponSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, trim: true, uppercase: true },
    tipo: { type: String, enum: ['PORCENTAJE', 'MONTO_FIJO'], required: true },
    valor: { type: Number, required: true, min: 0 },
    comercioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comercio' },
    usosMaximos: Number,
    usosActuales: { type: Number, default: 0 },
    montoMinimo: Number,
    vigenteDesde: Date,
    vigenteHasta: { type: Date, required: true },
    activo: { type: Boolean, default: true },
  },
  opciones
);

module.exports = mongoose.model('Cupon', cuponSchema, 'cupones');
