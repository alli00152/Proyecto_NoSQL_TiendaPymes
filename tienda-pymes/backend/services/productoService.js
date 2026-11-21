// services/productoService.js
// Capa de servicio: Mongoose y reglas de negocio. No conoce req ni res.
const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const Inventario = require('../models/Inventario');
const Comercio = require('../models/Comercio');
const Categoria = require('../models/Categoria');

// El validador de la base exige bodega y minimo, que el formulario del front no manda
const BODEGA = 'Principal';
const MINIMO = 0;

// Error de regla de negocio: manejarError usa su status para responder
function errorDeNegocio(status, mensaje) {
    const err = new Error(mensaje);
    err.status = status;
    return err;
}

class ProductoService {
    // ----------------------------- lectura -----------------------------

    async getProductos() {
        const productos = await Producto.aggregate(this.#etapas());
        return productos.map((p) => this.#conStock(p));
    }

    async getProductoById(id) {
        const filtro = { _id: new mongoose.Types.ObjectId(id) };
        const productos = await Producto.aggregate(this.#etapas(filtro));
        return productos.length ? this.#conStock(productos[0]) : null;
    }

    // ---------------------------- escritura ----------------------------

    async createProducto(data) {
        const { variantes = [], precio, comercioId, categoriaId, ...resto } = data;

        // Primero se revisa todo, para no dejar un producto a medias si algo falla
        const porGuardar = [];
        const vistos = new Set();
        for (const v of variantes) {
            const sku = this.#leerSku(v);
            if (vistos.has(sku)) throw errorDeNegocio(400, `El SKU ${sku} está repetido`);
            vistos.add(sku);
            porGuardar.push({
                variante: { sku, talla: v.talla, color: v.color },
                stock: this.#validarStock(v.stock),
            });
        }
        for (const sku of vistos) {
            await this.#revisarSkuLibre(sku);
        }

        const doc = { ...resto };
        doc.precio = this.#normalizarPrecio(precio);
        doc.comercioId = await this.#resolverComercio(comercioId);
        // La base exige que categoriaId sea un objectId: si no viene, no se guarda la clave
        if (categoriaId) doc.categoriaId = await this.#resolverCategoria(categoriaId);
        doc.variantes = porGuardar.map((p) => p.variante);

        const producto = new Producto(doc);
        await producto.save();

        // Sin transacciones (la base local no es replica): si falla el inventario,
        // se deshace el producto recien creado
        try {
            for (const p of porGuardar) {
                await this.#guardarExistencias(producto._id, p.variante, p.stock);
            }
        } catch (err) {
            await Inventario.deleteMany({ productoId: producto._id });
            await Producto.findByIdAndDelete(producto._id);
            throw err;
        }

        return this.getProductoById(producto._id);
    }

    async updateProducto(id, data) {
        const actual = await Producto.findById(id);
        if (!actual) return null;

        const { variantes, precio, comercioId, categoriaId, ...resto } = data;
        const cambios = { ...resto };
        if (precio !== undefined) cambios.precio = this.#normalizarPrecio(precio);
        if (comercioId !== undefined) cambios.comercioId = await this.#resolverComercio(comercioId);
        if (categoriaId) cambios.categoriaId = await this.#resolverCategoria(categoriaId);

        const porGuardar = [];
        if (Array.isArray(variantes)) {
            const lista = actual.variantes.map((v) => ({
                sku: v.sku,
                talla: v.talla,
                color: v.color,
            }));

            // Cada variante se identifica por su sku. Los sku nuevos se revisan en esta
            // pasada, que termina antes del update, para no dejar el producto a medias
            for (const v of variantes) {
                const sku = this.#leerSku(v);
                const existente = lista.find((x) => x.sku === sku);
                if (existente) {
                    // De una variante que ya es del producto se cambia solo lo que venga
                    if (v.talla !== undefined) existente.talla = v.talla;
                    if (v.color !== undefined) existente.color = v.color;
                    if (v.stock !== undefined) {
                        porGuardar.push({ variante: existente, stock: this.#validarStock(v.stock) });
                    }
                } else {
                    await this.#revisarSkuLibre(sku);
                    const nueva = { sku, talla: v.talla, color: v.color };
                    lista.push(nueva);
                    porGuardar.push({ variante: nueva, stock: this.#validarStock(v.stock) });
                }
            }
            // Las que el request no manda se quedan como estan: aca nunca se borra una variante
            cambios.variantes = lista;
        }

        const actualizado = await Producto.findByIdAndUpdate(id, cambios, {
            new: true,
            runValidators: true,
        });
        if (!actualizado) return null;

        for (const p of porGuardar) {
            await this.#guardarExistencias(actualizado._id, p.variante, p.stock);
        }

        return this.getProductoById(id);
    }

    async deleteProducto(id) {
        const producto = await Producto.findByIdAndDelete(id);
        if (!producto) return null;
        await Inventario.deleteMany({ productoId: producto._id });
        return producto;
    }

    // ------------------------- ayudas internas -------------------------

    // $lookup trae las filas de inventario del producto para sacarles las existencias
    #etapas(filtro) {
        const etapas = [];
        if (filtro) etapas.push({ $match: filtro });
        etapas.push({ $sort: { creadoEn: -1 } });
        etapas.push({
            $lookup: {
                from: 'inventario',
                localField: '_id',
                foreignField: 'productoId',
                as: 'inventario',
            },
        });
        return etapas;
    }

    // Deja cada variante como { sku, talla, color, stock } y quita el arreglo auxiliar
    #conStock(producto) {
        const { inventario = [], ...resto } = producto;
        const variantes = (producto.variantes || []).map((v) => {
            const fila = inventario.find((i) => i.sku === v.sku);
            return { sku: v.sku, talla: v.talla, color: v.color, stock: fila ? fila.existencias : 0 };
        });
        return { ...resto, variantes };
    }

    // El sku lo escribe el usuario y es obligatorio
    #leerSku(v) {
        const sku = v.sku ? String(v.sku).trim() : '';
        if (!sku) throw errorDeNegocio(400, 'Cada variante necesita su SKU');
        return sku;
    }

    // Un sku nuevo no puede estar ya en inventario, ni de este producto ni de otro
    async #revisarSkuLibre(sku) {
        if (await Inventario.exists({ sku, bodega: BODEGA })) {
            throw errorDeNegocio(409, `El SKU ${sku} ya existe`);
        }
    }

    // El front manda el precio como numero; la base lo exige como { monto, moneda }
    #normalizarPrecio(precio) {
        const esObjeto = typeof precio === 'object' && precio !== null;
        const monto = esObjeto ? precio.monto : precio;
        if (typeof monto !== 'number' || !Number.isFinite(monto) || monto < 0) {
            throw errorDeNegocio(400, 'El precio debe ser un número mayor o igual a 0');
        }
        return { monto, moneda: (esObjeto && precio.moneda) || 'CRC' };
    }

    #validarStock(stock) {
        const valor = stock === undefined || stock === null ? 0 : stock;
        if (!Number.isInteger(valor) || valor < 0) {
            throw errorDeNegocio(400, 'El stock debe ser un número entero mayor o igual a 0');
        }
        return valor;
    }

    // El front no tiene selector de comercio, asi que se usa el primero que este activo
    async #resolverComercio(comercioId) {
        if (!comercioId) {
            const comercio = await Comercio.findOne({ estado: 'ACTIVO' });
            if (!comercio) {
                throw errorDeNegocio(400, 'No hay comercios activos para asignar el producto');
            }
            return comercio._id;
        }
        if (!mongoose.Types.ObjectId.isValid(comercioId)) {
            throw errorDeNegocio(400, 'El comercio indicado no existe');
        }
        const comercio = await Comercio.findById(comercioId);
        if (!comercio) throw errorDeNegocio(400, 'El comercio indicado no existe');
        return comercio._id;
    }

    async #resolverCategoria(categoriaId) {
        if (!mongoose.Types.ObjectId.isValid(categoriaId)) {
            throw errorDeNegocio(400, 'La categoría indicada no existe');
        }
        const categoria = await Categoria.findById(categoriaId);
        if (!categoria) throw errorDeNegocio(400, 'La categoría indicada no existe');
        return categoria._id;
    }

    // Deja las existencias de una variante en inventario; crea la fila si no existia
    async #guardarExistencias(productoId, variante, stock) {
        const filtro = { productoId, sku: variante.sku, bodega: BODEGA };
        const res = await Inventario.updateOne(filtro, { $set: { existencias: stock } });
        if (res.matchedCount === 0) {
            await Inventario.create({ ...filtro, existencias: stock, minimo: MINIMO });
        }
    }
}

module.exports = new ProductoService();
