# Tienda Pymes · Avance 2 (50 %)

Plataforma de comercio electrónico para tiendas de ropa pymes. Node.js + Express + MongoDB (Mongoose) y front con HTML, JS y Bootstrap.

## Estructura

```
tienda-pymes/
├── backend/
│   ├── models/          15 modelos (Producto.js completo; el resto, a ajustar)
│   ├── routes/          productoRoutes.js (CRUD) y categoriaRoutes.js (lectura)
│   ├── seed-data/       un .json por colección (nombre del archivo = colección)
│   ├── seed.js          carga seed-data/ en MongoDB
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── index.html
    ├── app.js           USE_MOCK = true/false
    └── styles.css
```

## Puesta en marcha

```bash
cd backend
npm install
cp .env.example .env      # ajustar MONGODB_URI
npm run seed              # opcional: carga los datos de seed-data/
npm start                 # API en http://localhost:3000
```

Front: abrir `frontend/index.html` (o con la extensión Live Server de VS Code).
En `frontend/app.js`, poner `USE_MOCK = false` para usar la API real.

## Contratos (acordados el día 1)

- Endpoints: `GET/POST /api/productos`, `PUT/DELETE /api/productos/:id`, `GET /api/categorias`.
- Errores: `{ "error": "texto" }` (400 validación, 404 no existe, 500 servidor).
- IDs del HTML: `formProducto`, `productoId`, `nombre`, `descripcion`, `precio`, `categoriaId`,
  `talla`, `color`, `stock`, `activo`, `btnCancelar`, `tablaProductos`.

## Quién toca qué

| Rol | Archivos |
|---|---|
| 1. Back-End / API | `server.js`, `models/Producto.js`, `routes/*` |
| 2. Base de datos | `models/*` (menos Producto), `seed.js`, `seed-data/*`, Atlas |
| 3. Front-End / UI | `index.html`, `styles.css` |
| 4. JS e integración | `app.js`, este README |

## Pendiente por rol

- **Rol 2:** ajustar los 14 modelos al esquema real, exportar los datos con `mongoexport` a `seed-data/`, subir a Atlas.
- **Rol 1:** ajustar `Producto.js` al esquema real; probar los 4 endpoints en Postman.
- **Rol 3:** diseño final y modal de confirmación para eliminar.
- **Rol 4:** apagar el mock al integrar, manejo de errores, despliegue opcional (Render + Atlas).
