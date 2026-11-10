// ROL 1 (Back-End / API) - CRUD de productos (Contrato B)
const express = require('express');
const mongoose = require('mongoose');
const Producto = require('../models/Producto');

const router = express.Router();

// Convierte errores de Mongoose en { error } con el código correcto
function manejarError(res, err) {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

function idValido(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/productos -> 200 + arreglo
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    res.json(productos);
  } catch (err) {
    manejarError(res, err);
  }
});

// POST /api/productos -> 201 + producto creado
router.post('/', async (req, res) => {
  try {
    const nuevo = await Producto.create(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    manejarError(res, err);
  }
});

// PUT /api/productos/:id -> 200 + producto actualizado
router.put('/:id', async (req, res) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!actualizado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(actualizado);
  } catch (err) {
    manejarError(res, err);
  }
});

// DELETE /api/productos/:id -> 200 + { mensaje }
router.delete('/:id', async (req, res) => {
  try {
    if (!idValido(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
    const eliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Eliminado' });
  } catch (err) {
    manejarError(res, err);
  }
});

module.exports = router;
