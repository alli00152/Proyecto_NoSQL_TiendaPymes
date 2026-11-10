// ROL 1 (Back-End / API)
// AJUSTAR los campos al esquema real de "productos" (Fig. 3 y 7 del Avance 1).
const mongoose = require('mongoose');

const varianteSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true },
    talla: { type: String, trim: true },
    color: { type: String, trim: true },
    stock: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    descripcion: { type: String, trim: true, default: '' },
    precio: { type: Number, required: [true, 'El precio es obligatorio'], min: 0 },
    comercioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comercio' },
    categoriaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },
    variantes: { type: [varianteSchema], default: [] },
    imagenes: { type: [String], default: [] },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Tercer argumento = nombre EXACTO de la colección ya existente
module.exports = mongoose.model('Producto', productoSchema, 'productos');
