// services/categoriaService.js

const Categoria = require('../models/Categoria');

class CategoriaService {
    async getCategorias() {
        return await Categoria.find().sort({ nombre: 1 });
    }

    async getCategoriaById(id) {
        return await Categoria.findById(id);
    }

    async createCategoria(data) {
        const categoria = new Categoria(data);
        return await categoria.save();
    }

    async updateCategoria(id, data) {
        return await Categoria.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async deleteCategoria(id) {
        return await Categoria.findByIdAndDelete(id);
    }
}

module.exports = new CategoriaService();
