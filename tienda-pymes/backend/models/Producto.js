// ROL 1 (Back-End / API)
// Alineado con el validador de "productos" en database/tienda_pymes.js
const mongoose = require('mongoose');

const varianteSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true },
    talla: { type: String, trim: true },
    color: { type: String, trim: true },
  },
  { _id: false }
);

const productoSchema = new mongoose.Schema(
  {
    comercioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comercio', required: [true, 'El comercio es obligatorio'] },
    categoriaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },
    nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
    descripcion: { type: String, trim: true, default: '' },
    precio: {
      monto: { type: Number, required: [true, 'El precio es obligatorio'], min: 0 },
      moneda: { type: String, enum: ['CRC', 'USD'], default: 'CRC' },
    },
    atributos: { type: mongoose.Schema.Types.Mixed, default: {} },
    variantes: { type: [varianteSchema], default: [] },
    imagenes: { type: [String], default: [] },
    activo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'creadoEn', updatedAt: false } }
);

module.exports = mongoose.model('Producto', productoSchema, 'productos');
