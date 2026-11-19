
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const { EJSON } = mongoose.mongo.BSON;
const DIR = path.join(__dirname, 'seed-data');
const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tienda_pymes';
const DB_NAME = process.env.DB_NAME || 'tienda_pymes';
const leer = (archivo) => EJSON.parse(fs.readFileSync(path.join(DIR, archivo), 'utf8'));

async function main() {
  if (URI.startsWith('mongodb+srv') && !process.argv.includes('--confirmar')) {
    console.error('La URI apunta a Atlas. Esto BORRA y recrea las colecciones de "' + DB_NAME + '".');
    console.error('Si es lo que quieres, ejecuta:  npm run seed -- --confirmar');
    process.exit(1);
  }

  await mongoose.connect(URI, { dbName: DB_NAME });
  const db = mongoose.connection.db;
  console.log('Conectado a la base:', db.databaseName);

  const esquema = leer('_esquema.json');                    // validadores e índices por colección
  const existentes = (await db.listCollections().toArray()).map((c) => c.name);

  for (const [nombre, def] of Object.entries(esquema)) {
    if (existentes.includes(nombre)) await db.dropCollection(nombre);

    await db.createCollection(nombre, def.validator ? { validator: def.validator } : {});

    const docs = leer(nombre + '.json');
    if (docs.length) await db.collection(nombre).insertMany(docs);

    for (const { keys, options } of def.indexes) await db.collection(nombre).createIndex(keys, options);

    console.log(nombre.padEnd(16), String(docs.length).padStart(2), 'doc(s)', '|', def.indexes.length, 'índice(s)');
  }

  console.log('\nColecciones creadas:', Object.keys(esquema).length);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Error en el seed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
