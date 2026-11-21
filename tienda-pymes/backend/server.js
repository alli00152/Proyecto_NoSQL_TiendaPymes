// ROL 1 (Back-End / API)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const productoRoutes = require('./routes/productoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tienda_pymes';

// Middleware básico
app.use(cors());
app.use(bodyParser.json());

// Rutas
app.get('/', (req, res) => res.json({ mensaje: 'API tienda_pymes funcionando' }));
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/reportes', reporteRoutes);

// 404 y manejo de errores (siempre responden { error })
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB conectado:', mongoose.connection.name, '@', mongoose.connection.host);
    app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
