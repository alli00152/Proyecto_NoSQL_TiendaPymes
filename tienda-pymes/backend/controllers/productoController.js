// controllers/productoController.js
// Capa de controlador: lee la peticion, llama al servicio y decide el codigo HTTP.
const mongoose = require('mongoose');
const ProductoService = require('../services/productoService');
const manejarError = require('../utils/manejarError');

class ProductoController {
    async getProductos(req, res) {
        try {
            const productos = await ProductoService.getProductos();
            res.json(productos);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async getProductoById(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const producto = await ProductoService.getProductoById(req.params.id);
            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json(producto);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async createProducto(req, res) {
        try {
            const producto = await ProductoService.createProducto(req.body);
            res.status(201).json(producto);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async updateProducto(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const producto = await ProductoService.updateProducto(req.params.id, req.body);
            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json(producto);
        } catch (err) {
            manejarError(res, err);
        }
    }

    async deleteProducto(req, res) {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const producto = await ProductoService.deleteProducto(req.params.id);
            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ mensaje: 'Eliminado' });
        } catch (err) {
            manejarError(res, err);
        }
    }
}

module.exports = new ProductoController();
