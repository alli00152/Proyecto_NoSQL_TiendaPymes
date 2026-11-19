// Colección "comercios": negocios vendedores.  Índice único: cedulaJuridica
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const comercioSchema = new mongoose.Schema(
  {
    razonSocial: { type: String, required: true, trim: true },
    cedulaJuridica: { type: String, required: true, trim: true },
    contacto: { correo: String, telefono: String },
    propietarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    estado: { type: String, enum: ['ACTIVO', 'SUSPENDIDO', 'PENDIENTE'], required: true },
  },
  { ...opciones, timestamps: { createdAt: 'creadoEn', updatedAt: false } }
);

module.exports = mongoose.model('Comercio', comercioSchema, 'comercios');
