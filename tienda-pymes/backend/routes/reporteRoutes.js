// routes/reporteRoutes.js
// Capa de rutas: solo conecta cada metodo y URL con su funcion del controlador.
const express = require('express');
const router = express.Router();
const ReporteController = require('../controllers/reporteController');

router.get('/resumen', ReporteController.getResumen);
router.get('/productos-por-categoria', ReporteController.getProductosPorCategoria);
router.get('/stock-por-producto', ReporteController.getStockPorProducto);
router.get('/precio-por-categoria', ReporteController.getPrecioPorCategoria);
router.get('/stock-bajo', ReporteController.getStockBajo);
router.get('/pedidos-por-estado', ReporteController.getPedidosPorEstado);

module.exports = router;
