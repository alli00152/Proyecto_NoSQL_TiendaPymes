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

// ---------------------------------------------------------------------
// Funciones de apoyo. La clase de abajo solo tiene los 5 metodos del CRUD.
// ---------------------------------------------------------------------

// Arma un error de regla de negocio: manejarError usa su status para responder
function errorDeNegocio(status, mensaje) {
    const err = new Error(mensaje);
    err.status = status;
    return err;
}

// Devuelve el sku de una variante sin espacios. El usuario lo escribe y es obligatorio
function leerSku(variante) {
    let sku = '';
    if (variante.sku) {
        sku = String(variante.sku).trim();
    }
    if (sku === '') {
        throw errorDeNegocio(400, 'Cada variante necesita su SKU');
    }
    return sku;
}

// Revisa que un sku nuevo no este ya en inventario, ni de este producto ni de otro
async function revisarSkuLibre(sku) {
    const existe = await Inventario.exists({ sku: sku, bodega: BODEGA });
    if (existe) {
        throw errorDeNegocio(409, `El SKU ${sku} ya existe`);
    }
}

// Dice si un sku ya aparecio en la lista de sku vistos
function yaEsta(vistos, sku) {
    for (const visto of vistos) {
        if (visto === sku) {
            return true;
        }
    }
    return false;
}

// Busca una variante por su sku dentro de una lista. Devuelve null si no esta
function buscarPorSku(lista, sku) {
    for (const variante of lista) {
        if (variante.sku === sku) {
            return variante;
        }
    }
    return null;
}

// Pasa el precio al formato de la base: el front lo manda como numero y la base
// lo exige como { monto, moneda }
function normalizarPrecio(precio) {
    let monto = precio;
    let moneda = 'CRC';
    if (typeof precio === 'object' && precio !== null) {
        monto = precio.monto;
        if (precio.moneda) {
            moneda = precio.moneda;
        }
    }
    if (typeof monto !== 'number' || !Number.isFinite(monto) || monto < 0) {
        throw errorDeNegocio(400, 'El precio debe ser un número mayor o igual a 0');
    }
    return { monto: monto, moneda: moneda };
}

// Revisa que el stock sea un entero mayor o igual a 0. Si no viene, vale 0
function validarStock(stock) {
    let valor = stock;
    if (stock === undefined || stock === null) {
        valor = 0;
    }
    if (!Number.isInteger(valor) || valor < 0) {
        throw errorDeNegocio(400, 'El stock debe ser un número entero mayor o igual a 0');
    }
    return valor;
}

// Devuelve el id del primer comercio activo: el front no elige comercio
async function comercioActivo() {
    const comercio = await Comercio.findOne({ estado: 'ACTIVO' });
    if (!comercio) {
        throw errorDeNegocio(400, 'No hay comercios activos para asignar el producto');
    }
    return comercio._id;
}

// Revisa que la categoria exista y devuelve su id
async function resolverCategoria(categoriaId) {
    if (!mongoose.Types.ObjectId.isValid(categoriaId)) {
        throw errorDeNegocio(400, 'La categoría indicada no existe');
    }
    const categoria = await Categoria.findById(categoriaId);
    if (!categoria) {
        throw errorDeNegocio(400, 'La categoría indicada no existe');
    }
    return categoria._id;
}

// Busca en las filas de inventario las existencias de un sku. Si no hay fila, da 0
function existenciasDe(filas, sku) {
    for (const fila of filas) {
        if (fila.sku === sku) {
            return fila.existencias;
        }
    }
    return 0;
}

// Deja cada variante como { sku, talla, color, stock } y quita el arreglo del $lookup
function conStock(producto) {
    let filas = producto.inventario;
    if (!filas) {
        filas = [];
    }
    let variantes = producto.variantes;
    if (!variantes) {
        variantes = [];
    }
    const conExistencias = [];
    for (const variante of variantes) {
        conExistencias.push({
            sku: variante.sku,
            talla: variante.talla,
            color: variante.color,
            stock: existenciasDe(filas, variante.sku),
        });
    }
    producto.variantes = conExistencias;
    delete producto.inventario;
    return producto;
}

// Guarda las existencias de una variante en inventario; crea la fila si no existia
async function guardarExistencias(productoId, sku, stock) {
    const res = await Inventario.updateOne(
        { productoId: productoId, sku: sku, bodega: BODEGA },
        { $set: { existencias: stock } }
    );
    if (res.matchedCount === 0) {
        await Inventario.create({
            productoId: productoId,
            sku: sku,
            bodega: BODEGA,
            existencias: stock,
            minimo: MINIMO,
        });
    }
}

// ---------------------------------------------------------------------

class ProductoService {
    // Devuelve todos los productos, del mas nuevo al mas viejo, con el stock de cada variante
    async getProductos() {
        const productos = await Producto.aggregate([
            // del mas nuevo al mas viejo
            { $sort: { creadoEn: -1 } },
            // trae las filas de inventario de cada producto, para sacarles las existencias
            {
                $lookup: {
                    from: 'inventario',
                    localField: '_id',
                    foreignField: 'productoId',
                    as: 'inventario',
                },
            },
        ]);
        const lista = [];
        for (const producto of productos) {
            lista.push(conStock(producto));
        }
        return lista;
    }

    // Devuelve un producto por su id, o null si no existe
    async getProductoById(id) {
        const productos = await Producto.aggregate([
            // un solo producto, el del id que se pide
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            // trae sus filas de inventario, para sacarles las existencias
            {
                $lookup: {
                    from: 'inventario',
                    localField: '_id',
                    foreignField: 'productoId',
                    as: 'inventario',
                },
            },
        ]);
        if (productos.length === 0) {
            return null;
        }
        return conStock(productos[0]);
    }

    // Crea un producto con sus variantes y una fila de inventario por variante
    async createProducto(data) {
        let variantes = data.variantes;
        if (variantes === undefined) {
            variantes = [];
        }

        // Primero se revisa todo, para no dejar un producto a medias si algo falla
        const porGuardar = [];
        const vistos = [];
        for (const variante of variantes) {
            const sku = leerSku(variante);
            if (yaEsta(vistos, sku)) {
                throw errorDeNegocio(400, `El SKU ${sku} está repetido`);
            }
            vistos.push(sku);
            porGuardar.push({
                sku: sku,
                talla: variante.talla,
                color: variante.color,
                stock: validarStock(variante.stock),
            });
        }
        for (const sku of vistos) {
            await revisarSkuLibre(sku);
        }

        const precio = normalizarPrecio(data.precio);
        const comercioId = await comercioActivo();

        const soloVariantes = [];
        for (const item of porGuardar) {
            soloVariantes.push({ sku: item.sku, talla: item.talla, color: item.color });
        }

        // El documento se arma campo por campo: lo que no este aca, no se guarda
        const doc = {
            comercioId: comercioId,
            nombre: data.nombre,
            descripcion: data.descripcion,
            activo: data.activo,
            atributos: data.atributos,
            imagenes: data.imagenes,
            precio: precio,
            variantes: soloVariantes,
        };
        // La base exige que categoriaId sea un objectId: si no viene, no se guarda la clave
        if (data.categoriaId) {
            doc.categoriaId = await resolverCategoria(data.categoriaId);
        }

        const producto = new Producto(doc);
        await producto.save();

        // Sin transacciones (la base local no es replica): si falla el inventario,
        // se deshace el producto recien creado
        try {
            for (const item of porGuardar) {
                await guardarExistencias(producto._id, item.sku, item.stock);
            }
        } catch (err) {
            await Inventario.deleteMany({ productoId: producto._id });
            await Producto.findByIdAndDelete(producto._id);
            throw err;
        }

        return this.getProductoById(producto._id);
    }

    // Actualiza un producto: cambia solo los campos que vengan y nunca borra variantes
    async updateProducto(id, data) {
        const actual = await Producto.findById(id);
        if (!actual) {
            return null;
        }

        // Solo se cambian los campos que vengan en el request
        const cambios = {};
        if (data.nombre !== undefined) cambios.nombre = data.nombre;
        if (data.descripcion !== undefined) cambios.descripcion = data.descripcion;
        if (data.activo !== undefined) cambios.activo = data.activo;
        if (data.atributos !== undefined) cambios.atributos = data.atributos;
        if (data.imagenes !== undefined) cambios.imagenes = data.imagenes;
        if (data.precio !== undefined) cambios.precio = normalizarPrecio(data.precio);
        if (data.categoriaId) cambios.categoriaId = await resolverCategoria(data.categoriaId);

        const porGuardar = [];
        if (Array.isArray(data.variantes)) {
            const lista = [];
            for (const variante of actual.variantes) {
                lista.push({ sku: variante.sku, talla: variante.talla, color: variante.color });
            }

            // Cada variante se identifica por su sku. Los sku nuevos se revisan en esta
            // pasada, que termina antes del update, para no dejar el producto a medias
            for (const variante of data.variantes) {
                const sku = leerSku(variante);
                const existente = buscarPorSku(lista, sku);
                if (existente) {
                    // De una variante que ya es del producto se cambia solo lo que venga
                    if (variante.talla !== undefined) existente.talla = variante.talla;
                    if (variante.color !== undefined) existente.color = variante.color;
                    if (variante.stock !== undefined) {
                        porGuardar.push({ sku: sku, stock: validarStock(variante.stock) });
                    }
                } else {
                    await revisarSkuLibre(sku);
                    lista.push({ sku: sku, talla: variante.talla, color: variante.color });
                    porGuardar.push({ sku: sku, stock: validarStock(variante.stock) });
                }
            }
            // Las que el request no manda se quedan como estan: aca nunca se borra una variante
            cambios.variantes = lista;
        }

        const actualizado = await Producto.findByIdAndUpdate(id, cambios, {
            new: true,
            runValidators: true,
        });
        if (!actualizado) {
            return null;
        }

        for (const item of porGuardar) {
            await guardarExistencias(actualizado._id, item.sku, item.stock);
        }

        return this.getProductoById(id);
    }

    // Borra un producto y las filas de inventario de sus variantes
    async deleteProducto(id) {
        const producto = await Producto.findByIdAndDelete(id);
        if (!producto) {
            return null;
        }
        await Inventario.deleteMany({ productoId: producto._id });
        return producto;
    }
}

module.exports = new ProductoService();
