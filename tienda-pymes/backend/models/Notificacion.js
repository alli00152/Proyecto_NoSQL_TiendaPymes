// ROL 2 (Base de datos) - AJUSTAR al esquema real de "notificaciones" (script de mongosh del Avance 1)
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    canal: { type: String, enum: ['correo', 'sms', 'push'] },
    mensaje: String,
    estado: String,
  }, { timestamps: true });

module.exports = mongoose.model('Notificacion', schema, 'notificaciones');
