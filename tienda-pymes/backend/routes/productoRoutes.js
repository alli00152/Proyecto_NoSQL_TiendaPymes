// routes/productoRoutes.js
// Capa de rutas: solo conecta cada metodo y URL con su funcion del controlador.
const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/productoController');

router.get('/', ProductoController.getProductos);
router.get('/:id', ProductoController.getProductoById);
router.post('/', ProductoController.createProducto);
router.put('/:id', ProductoController.updateProducto);
router.delete('/:id', ProductoController.deleteProducto);

module.exports = router;
