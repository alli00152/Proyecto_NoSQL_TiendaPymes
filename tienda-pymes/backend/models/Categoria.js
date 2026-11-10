// ROL 2 (Base de datos) - AJUSTAR al esquema real de "categorias"
const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    padreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Categoria', categoriaSchema, 'categorias');
