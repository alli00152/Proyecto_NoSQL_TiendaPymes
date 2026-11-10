// ROL 2 (Base de datos) - AJUSTAR al esquema real de "comercios" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    razonSocial: { type: String, required: true },
    cedulaJuridica: { type: String, required: true, unique: true },
    contacto: { nombre: String, correo: String, telefono: String },
    estado: { type: String, default: 'activo' },
  }, { timestamps: true });

module.exports = mongoose.model('Comercio', schema, 'comercios');
