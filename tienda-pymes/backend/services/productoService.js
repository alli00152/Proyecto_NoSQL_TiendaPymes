// services/productoService.js

const Producto = require('../models/Producto');

class ProductoService {
    async getProductos() {
        return await Producto.find().sort({ creadoEn: -1 });
    }

    async getProductoById(id) {
        return await Producto.findById(id);
    }

    async createProducto(data) {
        const producto = new Producto(data);
        return await producto.save();
    }

    async updateProducto(id, data) {
        return await Producto.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async deleteProducto(id) {
        return await Producto.findByIdAndDelete(id);
    }
}

module.exports = new ProductoService();
