// Colección "envios": despachos.  Índice: pedidoId
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const envioSchema = new mongoose.Schema(
  {
    pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true },
    transportista: { type: String, required: true, trim: true },
    guia: String,
    estado: { type: String, enum: ['PREPARANDO', 'EN_RUTA', 'ENTREGADO', 'DEVUELTO'], required: true },
    estadosRuta: [new mongoose.Schema({ estado: String, fecha: Date }, { _id: false })],
    fechaEstimada: Date,
  },
  opciones
);

module.exports = mongoose.model('Envio', envioSchema, 'envios');
