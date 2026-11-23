// services/categoriaService.js

const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

// Arma un error de regla de negocio: manejarError usa su status para responder
function errorDeNegocio(status, mensaje) {
    const err = new Error(mensaje);
    err.status = status;
    return err;
}

class CategoriaService {
    // Devuelve todas las categorias ordenadas por nombre
    async getCategorias() {
        return await Categoria.find().sort({ nombre: 1 });
    }

    // Devuelve una categoria por su id, o null si no existe
    async getCategoriaById(id) {
        return await Categoria.findById(id);
    }

    // Crea una categoria
    async createCategoria(data) {
        const categoria = new Categoria(data);
        return await categoria.save();
    }

    // Actualiza una categoria y devuelve como queda
    async updateCategoria(id, data) {
        return await Categoria.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    // Borra una categoria, siempre que no tenga productos ni subcategorias
    async deleteCategoria(id) {
        // No se borra una categoria que este en uso: dejaria productos apuntando
        // a una categoria que ya no existe, o subcategorias sin padre
        const productos = await Producto.countDocuments({ categoriaId: id });
        if (productos > 0) {
            throw errorDeNegocio(409, 'La categoría tiene productos asociados');
        }
        const subcategorias = await Categoria.countDocuments({ padreId: id });
        if (subcategorias > 0) {
            throw errorDeNegocio(409, 'La categoría tiene subcategorías');
        }
        return await Categoria.findByIdAndDelete(id);
    }
}

module.exports = new CategoriaService();
