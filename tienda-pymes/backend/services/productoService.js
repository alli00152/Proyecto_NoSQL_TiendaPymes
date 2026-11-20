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

// Tres letras sin acentos y en mayuscula, como los sku de los datos de ejemplo
function tresLetras(texto) {
    return String(texto)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita las tildes
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 3);
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

        const doc = { ...resto };
        doc.precio = this.#normalizarPrecio(precio);
        doc.comercioId = await this.#resolverComercio(comercioId);
        // La base exige que categoriaId sea un objectId: si no viene, no se guarda la clave
        if (categoriaId) doc.categoriaId = await this.#resolverCategoria(categoriaId);

        const usados = new Set();
        const porGuardar = [];
        for (const v of variantes) {
            const stock = this.#validarStock(v.stock);
            const sku = v.sku
                ? String(v.sku).trim()
                : await this.#generarSku(data.nombre, v.talla, v.color, usados);
            porGuardar.push({ variante: { sku, talla: v.talla, color: v.color }, stock });
        }
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
            const nombre = cambios.nombre || actual.nombre;
            const usados = new Set(actual.variantes.map((v) => v.sku));
            const lista = actual.variantes.map((v) => ({ sku: v.sku, talla: v.talla, color: v.color }));

            for (const v of variantes) {
                const stock = this.#validarStock(v.stock);
                const existente = this.#emparejarVariante(lista, v);
                if (existente) {
                    porGuardar.push({ variante: existente, stock });
                } else {
                    // Acá nunca viene sku: si viniera, #emparejarVariante ya habría respondido
                    const sku = await this.#generarSku(nombre, v.talla, v.color, usados);
                    const nueva = { sku, talla: v.talla, color: v.color };
                    lista.push(nueva);
                    porGuardar.push({ variante: nueva, stock });
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

    // Busca a cuál variante del producto se refiere la que llega en el request.
    // Con sku: tiene que ser una variante de este producto y con su misma talla y color.
    // Sin sku (el caso del formulario): se empareja por talla + color.
    #emparejarVariante(lista, v) {
        if (v.sku) {
            const sku = String(v.sku).trim();
            const existente = lista.find((x) => x.sku === sku);
            if (!existente) {
                throw errorDeNegocio(400, 'La variante indicada no existe en este producto');
            }
            const otraTalla = v.talla !== undefined && (v.talla || '') !== (existente.talla || '');
            const otroColor = v.color !== undefined && (v.color || '') !== (existente.color || '');
            if (otraTalla || otroColor) {
                throw errorDeNegocio(
                    400,
                    'Para otra talla o color, agregá una variante nueva (la anterior se puede dejar en 0)'
                );
            }
            return existente;
        }
        return (
            lista.find(
                (x) => (x.talla || '') === (v.talla || '') && (x.color || '') === (v.color || '')
            ) || null
        );
    }

    // Formato de los datos de ejemplo: CAM-LIN-M-BLA
    // (tres letras de las dos primeras palabras largas del nombre, talla y color)
    async #generarSku(nombre, talla, color, usados) {
        const palabras = String(nombre || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // quita las tildes
            .split(/\s+/)
            .filter((p) => p.length >= 3);
        const partes = palabras.slice(0, 2).map(tresLetras);
        if (talla) partes.push(tresLetras(talla));
        if (color) partes.push(tresLetras(color));

        const base = partes.filter(Boolean).join('-') || 'SKU';
        // El indice (sku, bodega) de inventario es unico: si ya esta, se le agrega un sufijo
        let sku = base;
        let n = 1;
        while (usados.has(sku) || (await Inventario.exists({ sku, bodega: BODEGA }))) {
            n += 1;
            sku = `${base}-${n}`;
        }
        usados.add(sku);
        return sku;
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
