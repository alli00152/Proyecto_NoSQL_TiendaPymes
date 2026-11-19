// Colección "pedidos": órdenes de compra.  Índice: (clienteId, estado) (ix_pedidos_cliente_estado)
// Las líneas copian nombre y precio del producto para conservar el valor histórico.
const mongoose = require('mongoose');
const opciones = require('./_opciones');

const lineaSchema = new mongoose.Schema(
  {
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    sku: String,
    nombre: String,
    talla: String,
    color: String,
    cantidad: { type: Number, min: 1 },
    precioUnit: { type: Number, min: 0 },
  },
  { _id: false }
);

const ESTADOS = ['CREADO', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];

const pedidoSchema = new mongoose.Schema(
  {
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
    comercioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comercio', required: true },
    lineas: {
      type: [lineaSchema],
      validate: { validator: (v) => Array.isArray(v) && v.length >= 1, message: 'El pedido necesita al menos una línea' },
    },
    subtotal: { type: Number, min: 0 },
    impuestos: { type: Number, min: 0 },
    descuento: { type: Number, min: 0 },
    total: { type: Number, required: true, min: 0 },
    cuponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cupon', default: null },
    estado: { type: String, enum: ESTADOS, required: true },
    historial: [new mongoose.Schema({ estado: { type: String, enum: ESTADOS }, fecha: Date }, { _id: false })],
    direccionEntrega: { provincia: String, canton: String, distrito: String, detalle: String },
  },
  { ...opciones, timestamps: { createdAt: 'creadoEn', updatedAt: false } }
);

module.exports = mongoose.model('Pedido', pedidoSchema, 'pedidos');
