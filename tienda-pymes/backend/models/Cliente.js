// Colección "clientes": datos personales del comprador, teléfonos y direcciones.
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const telefonoSchema = new mongoose.Schema(
  { tipo: String, numero: String },
  { _id: false }
);

const direccionSchema = new mongoose.Schema(
  { alias: String, provincia: String, canton: String, distrito: String, detalle: String, predeterminada: Boolean },
  { _id: false }
);

const clienteSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    telefonos: [telefonoSchema],
    direcciones: [direccionSchema],
  },
  opciones
);

module.exports = mongoose.model('Cliente', clienteSchema, 'clientes');
