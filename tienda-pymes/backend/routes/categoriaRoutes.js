// ROL 1 (Back-End / API) - solo lectura, para llenar el <select> del formulario
const express = require('express');
const Categoria = require('../models/Categoria');

const router = express.Router();

// GET /api/categorias -> 200 + arreglo
router.get('/', async (req, res) => {
  try {
    res.json(await Categoria.find().sort({ nombre: 1 }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
