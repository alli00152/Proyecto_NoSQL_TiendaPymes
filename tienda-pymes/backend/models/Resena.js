// Colección "resenas": calificaciones de clientes.  Índice: (productoId, fecha desc)
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const resenaSchema = new mongoose.Schema(
  {
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    comercioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comercio' },
    calificacion: {
      type: Number, required: true, min: 1, max: 5,
      validate: { validator: Number.isInteger, message: 'La calificación debe ser un entero de 1 a 5' },
    },
    comentario: String,
    fecha: { type: Date, default: Date.now },
  },
  opciones
);

module.exports = mongoose.model('Resena', resenaSchema, 'resenas');
