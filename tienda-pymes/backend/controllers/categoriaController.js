// controllers/categoriaController.js

const mongoose = require('mongoose');
const categoriaService = require('../services/categoriaService');
const manejarError = require('../utils/manejarError');

class CategoriaController {
    async getCategorias(req, res) {
        try {
            const categorias = await categoriaService.getCategorias();
            res.json(categorias);
        } catch (error) {
            manejarError(res, error);       
        }
    }

    async getCategoriaById(req, res) {
        try {
            if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const categoria = await categoriaService.getCategoriaById(req.params.id);
            if (!categoria){
                return res.status(404).json({ error: 'Categoría no encontrada' });
            }
            res.json(categoria);
        }catch (error) {
            manejarError(res, error);
        }
    }

    async createCategoria(req, res) {
        try {
            const categoria = await categoriaService.createCategoria(req.body);
            res.status(201).json(categoria);
        } catch (error) {
            manejarError(res, error);
        }
    }

    async updateCategoria(req, res) {
        try {
            if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const categoria = await categoriaService.updateCategoria(req.params.id, req.body);
            if (!categoria){
                return res.status(404).json({ error: 'Categoría no encontrada' });
            }
            res.json(categoria);
        }catch (error) {
            manejarError(res, error);
        }
    }

    async deleteCategoria(req, res) {
        try {
            if(!mongoose.Types.ObjectId.isValid(req.params.id)) {   
                return res.status(400).json({ error: 'ID inválido' });
            }
            const categoria = await categoriaService.deleteCategoria(req.params.id);
            if (!categoria){
                return res.status(404).json({ error: 'Categoría no encontrada' });
            }
            res.json({ mensaje: 'Categoría eliminada correctamente' });
        }catch (error) {
            manejarError(res, error);
        }
    }
}

module.exports = new CategoriaController();
