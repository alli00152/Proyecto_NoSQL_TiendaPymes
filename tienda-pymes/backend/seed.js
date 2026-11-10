// ROL 2 (Base de datos)
// Carga los archivos de seed-data/<coleccion>.json en la base indicada por MONGODB_URI.
//  - Un archivo por colección; el nombre del archivo = nombre de la colección.
//  - Formato: arreglo JSON (se admite Extended JSON de mongoexport: {"$oid": "..."}).
//  - Para reemplazar los ejemplos con sus datos reales:
//      mongoexport --db tienda_pymes --collection productos --jsonArray --out seed-data/productos.json
//  Uso: npm run seed     (BORRA y recarga cada colección que tenga archivo)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const { EJSON } = mongoose.mongo.BSON;
const DIR = path.join(__dirname, 'seed-data');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tienda_pymes');
  console.log('Conectado a', mongoose.connection.name);

  const archivos = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
  for (const archivo of archivos) {
    const coleccion = path.basename(archivo, '.json');
    const docs = EJSON.parse(fs.readFileSync(path.join(DIR, archivo), 'utf8'));
    const col = mongoose.connection.collection(coleccion);
    await col.deleteMany({});
    if (docs.length) await col.insertMany(docs);
    console.log(`${coleccion}: ${docs.length} documentos`);
  }
  await mongoose.disconnect();
  console.log('Seed terminado');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
