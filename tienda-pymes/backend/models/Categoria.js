// Alineado con el validador de "categorias" en database/tienda_pymes.js
const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    padreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', default: null },
    ruta: { type: String, trim: true },
  },
  { timestamps: { createdAt: 'creadoEn', updatedAt: false }, versionKey: false }
);

module.exports = mongoose.model('Categoria', categoriaSchema, 'categorias');
