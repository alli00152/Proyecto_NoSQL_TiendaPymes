// services/reporteService.js
// Capa de servicio: agregaciones de solo lectura para los reportes. No conoce req ni res.
// Cada pipeline va escrito completo, etapa por etapa, para poder explicarlo en la exposicion.
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Inventario = require('../models/Inventario');
const Pedido = require('../models/Pedido');

class ReporteService {
    // ¿Cuántos productos, categorías y pedidos hay en la base?
    async getResumen() {
        const productos = await Producto.countDocuments();
        const categorias = await Categoria.countDocuments();
        const pedidos = await Pedido.countDocuments();
        return { productos, categorias, pedidos };
    }

    // ¿Cuántos productos tiene cada categoría?
    async getProductosPorCategoria() {
        return await Producto.aggregate([
            // agrupa los productos por su categoría y cuenta cuántos cayeron en cada grupo
            { $group: { _id: '$categoriaId', cantidad: { $sum: 1 } } },
            // busca el nombre de la categoría en la colección categorias
            {
                $lookup: {
                    from: 'categorias',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoria',
                },
            },
            // preserveNullAndEmptyArrays deja pasar al grupo de los productos sin categoría
            { $unwind: { path: '$categoria', preserveNullAndEmptyArrays: true } },
            // arma la salida; el grupo sin categoría queda con el texto "Sin categoría"
            {
                $project: {
                    _id: 0,
                    categoria: { $ifNull: ['$categoria.nombre', 'Sin categoría'] },
                    cantidad: 1,
                },
            },
            { $sort: { categoria: 1 } },
        ]);
    }

    // ¿Cuánto stock tiene cada producto, sumando todas sus variantes?
    async getStockPorProducto() {
        return await Inventario.aggregate([
            // suma las existencias de todas las filas que son del mismo producto
            { $group: { _id: '$productoId', stockTotal: { $sum: '$existencias' } } },
            // busca el nombre del producto en la colección productos
            {
                $lookup: {
                    from: 'productos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'producto',
                },
            },
            { $unwind: '$producto' },
            { $project: { _id: 0, producto: '$producto.nombre', stockTotal: 1 } },
            // del que tiene más stock al que tiene menos
            { $sort: { stockTotal: -1 } },
        ]);
    }

    // ¿Cuál es el precio promedio, el más bajo y el más alto de cada categoría?
    async getPrecioPorCategoria() {
        return await Producto.aggregate([
            // por cada categoría calcula promedio, mínimo y máximo del monto del precio
            {
                $group: {
                    _id: '$categoriaId',
                    promedio: { $avg: '$precio.monto' },
                    minimo: { $min: '$precio.monto' },
                    maximo: { $max: '$precio.monto' },
                },
            },
            // busca el nombre de la categoría en la colección categorias
            {
                $lookup: {
                    from: 'categorias',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoria',
                },
            },
            { $unwind: { path: '$categoria', preserveNullAndEmptyArrays: true } },
            // $round deja el promedio con 2 decimales
            {
                $project: {
                    _id: 0,
                    categoria: { $ifNull: ['$categoria.nombre', 'Sin categoría'] },
                    promedio: { $round: ['$promedio', 2] },
                    minimo: 1,
                    maximo: 1,
                },
            },
            { $sort: { categoria: 1 } },
        ]);
    }

    // ¿Qué variantes tienen menos existencias que el límite que se pide?
    async getStockBajo(limite) {
        return await Inventario.aggregate([
            // $lt deja solo las filas con menos existencias que el límite
            { $match: { existencias: { $lt: limite } } },
            // busca el nombre del producto al que pertenece cada fila
            {
                $lookup: {
                    from: 'productos',
                    localField: 'productoId',
                    foreignField: '_id',
                    as: 'producto',
                },
            },
            { $unwind: '$producto' },
            { $project: { _id: 0, sku: 1, producto: '$producto.nombre', existencias: 1 } },
            // primero las más críticas
            { $sort: { existencias: 1 } },
        ]);
    }

    // ¿Cuántos pedidos hay en cada estado?
    async getPedidosPorEstado() {
        return await Pedido.aggregate([
            // agrupa por el campo estado y cuenta los pedidos de cada grupo
            { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
            // el estado viene en _id: se renombra para que la salida se lea mejor
            { $project: { _id: 0, estado: '$_id', cantidad: 1 } },
            { $sort: { estado: 1 } },
        ]);
    }
}

module.exports = new ReporteService();
