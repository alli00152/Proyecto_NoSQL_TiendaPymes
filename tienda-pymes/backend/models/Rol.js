// Colección "roles": perfiles y permisos.  Índice único: nombre
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const rolSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String },
    permisos: { type: [String], required: true },
  },
  opciones
);

module.exports = mongoose.model('Rol', rolSchema, 'roles');
