// controllers/reporteController.js
// Capa de controlador: lee la peticion, llama al servicio y decide el codigo HTTP.
const ReporteService = require('../services/reporteService');
const manejarError = require('../utils/manejarError');

// Si el request no pide un limite, se consideran bajas las variantes con menos de 5
const LIMITE_POR_DEFECTO = 5;

class ReporteController {
    async getResumen(req, res) {
        try {
            const resumen = await ReporteService.getResumen();
            res.json(resumen);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async getProductosPorCategoria(req, res) {
        try {
            const reporte = await ReporteService.getProductosPorCategoria();
            res.json(reporte);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async getStockPorProducto(req, res) {
        try {
            const reporte = await ReporteService.getStockPorProducto();
            res.json(reporte);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async getPrecioPorCategoria(req, res) {
        try {
            const reporte = await ReporteService.getPrecioPorCategoria();
            res.json(reporte);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async getStockBajo(req, res) {
        try {
            const pedido = req.query.limite;
            const limite = pedido === undefined || pedido === '' ? LIMITE_POR_DEFECTO : Number(pedido);
            if (!Number.isInteger(limite) || limite < 0) {
                return res
                    .status(400)
                    .json({ error: 'El límite debe ser un número entero mayor o igual a 0' });
            }
            const reporte = await ReporteService.getStockBajo(limite);
            res.json(reporte);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async getPedidosPorEstado(req, res) {
        try {
            const reporte = await ReporteService.getPedidosPorEstado();
            res.json(reporte);
        } catch (err) {
            manejarError(res, err);
        }
    }
}

module.exports = new ReporteController();
