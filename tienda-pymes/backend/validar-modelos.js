
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const modelos = require('./models');

const { EJSON } = mongoose.mongo.BSON;
const DIR = path.join(__dirname, 'seed-data');
const aNombre = { // colección -> modelo
  roles: 'Rol', usuarios: 'Usuario', clientes: 'Cliente', comercios: 'Comercio', categorias: 'Categoria',
  productos: 'Producto', inventario: 'Inventario', carritos: 'Carrito', pedidos: 'Pedido', pagos: 'Pago',
  envios: 'Envio', resenas: 'Resena', cupones: 'Cupon', notificaciones: 'Notificacion', auditoria: 'Auditoria',
};

let fallos = 0;
for (const [coleccion, nombreModelo] of Object.entries(aNombre)) {
  const Modelo = modelos[nombreModelo];
  const docs = EJSON.parse(fs.readFileSync(path.join(DIR, coleccion + '.json'), 'utf8'));
  const errores = docs.flatMap((d, i) => {
    const e = new Modelo(d).validateSync();
    return e ? Object.values(e.errors).map((x) => `doc ${i + 1}: ${x.message}`) : [];
  });
  const coincide = Modelo.collection.name === coleccion;
  if (errores.length || !coincide) fallos++;
  console.log(
    (errores.length || !coincide ? 'X ' : 'OK ') + coleccion.padEnd(15), `${docs.length} doc(s)`,
    coincide ? '' : `| colección del modelo: ${Modelo.collection.name}`, ...errores
  );
}
console.log(fallos ? `\n${fallos} colección(es) con problemas` : '\nLos 15 modelos validan todos los documentos de ejemplo');
process.exit(fallos ? 1 : 0);
