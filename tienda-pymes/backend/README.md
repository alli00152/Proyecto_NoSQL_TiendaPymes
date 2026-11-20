# API Tienda Pymes · Contrato de productos

API REST de productos sobre Node.js + Express + Mongoose. Este documento es lo que necesitás para
consumirla desde el front: cómo levantarla, los cinco endpoints, las reglas de los datos y los
errores que puede devolver.

---

## 1. Cómo levantarla

```bash
cd backend
npm install
```

Creá el archivo `.env` a partir de `.env.example`. Tiene dos variables:

```ini
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/tienda_pymes
```

Si en vez de la base local vas a usar Atlas, cambiá solo `MONGODB_URI`:

```ini
MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@cluster0.xxxxx.mongodb.net/tienda_pymes
```

> `.env` no se sube al repositorio. Poné tus credenciales reales solo en tu copia local y nunca
> escribas contraseñas en `.env.example`, en este README ni en el código.

Levantá la API:

```bash
npm start           # http://localhost:3000
npm run dev         # lo mismo, reiniciando al guardar cambios
```

Al arrancar, el log dice a qué base quedó conectada, con el nombre y el host. Así sabés de una si
estás contra la base local o contra Atlas:

```
MongoDB conectado: tienda_pymes @ 127.0.0.1
API en http://localhost:3000
```

Si ves un host de `mongodb.net`, estás en Atlas. Si la conexión falla, el proceso se cierra con el
motivo en pantalla y la API no queda levantada.

---

## 2. Los cinco endpoints

Todas las rutas van bajo `/api/productos`. Las respuestas son JSON.

Para llenar el `<select>` de categorías hay además un `GET /api/categorias`, que devuelve el arreglo
de categorías con su `_id` y su `nombre`.

### `GET /api/productos`

Lista todos los productos, del más nuevo al más viejo.

**Request**

```
GET /api/productos
```

**Response · 200**

```json
[
  {
    "_id": "675000000000000000000f01",
    "comercioId": "675000000000000000000d01",
    "categoriaId": "675000000000000000000e02",
    "nombre": "Camisa de lino manga larga",
    "descripcion": "Camisa casual de lino, corte regular.",
    "precio": { "monto": 18500, "moneda": "CRC" },
    "variantes": [
      { "sku": "CAM-LIN-M-BLA", "talla": "M", "color": "Blanco", "stock": 15 },
      { "sku": "CAM-LIN-L-BLA", "talla": "L", "color": "Blanco", "stock": 2 },
      { "sku": "CAM-LIN-M-AZU", "talla": "M", "color": "Azul", "stock": 10 }
    ],
    "imagenes": ["camisa_lino_blanca.jpg"],
    "activo": true,
    "creadoEn": "2026-10-01T09:00:00.000Z"
  }
]
```

### `GET /api/productos/:id`

Un producto por su `_id`. La forma del objeto es idéntica a la de la lista.

**Request**

```
GET /api/productos/675000000000000000000f01
```

**Response · 200**

```json
{
  "_id": "675000000000000000000f01",
  "comercioId": "675000000000000000000d01",
  "categoriaId": "675000000000000000000e02",
  "nombre": "Camisa de lino manga larga",
  "descripcion": "Camisa casual de lino, corte regular.",
  "precio": { "monto": 18500, "moneda": "CRC" },
  "variantes": [
    { "sku": "CAM-LIN-M-BLA", "talla": "M", "color": "Blanco", "stock": 15 },
    { "sku": "CAM-LIN-L-BLA", "talla": "L", "color": "Blanco", "stock": 2 },
    { "sku": "CAM-LIN-M-AZU", "talla": "M", "color": "Azul", "stock": 10 }
  ],
  "imagenes": ["camisa_lino_blanca.jpg"],
  "activo": true,
  "creadoEn": "2026-10-01T09:00:00.000Z"
}
```

Otros códigos: **404** si el id no existe, **400** si el id no tiene forma de ObjectId.

### `POST /api/productos`

Crea un producto. No hace falta mandar `comercioId`: la API le asigna el primer comercio activo.

**Request**

```json
{
  "nombre": "Camisa de prueba manga corta",
  "descripcion": "Producto de prueba",
  "precio": 12345,
  "activo": true,
  "categoriaId": "675000000000000000000e02",
  "variantes": [{ "talla": "M", "color": "Verde", "stock": 7 }]
}
```

**Response · 201**

```json
{
  "_id": "6b007bfaeb24b7ec0de674cd",
  "comercioId": "675000000000000000000d01",
  "categoriaId": "675000000000000000000e02",
  "nombre": "Camisa de prueba manga corta",
  "descripcion": "Producto de prueba",
  "precio": { "monto": 12345, "moneda": "CRC" },
  "variantes": [{ "sku": "CAM-PRU-M-VER", "talla": "M", "color": "Verde", "stock": 7 }],
  "imagenes": [],
  "activo": true,
  "creadoEn": "2026-11-20T16:57:30.093Z"
}
```

Fijate en dos cosas: mandaste `precio` como número y volvió como `{ monto, moneda }`, y no mandaste
`sku` pero la API lo generó.

### `PUT /api/productos/:id`

Actualiza un producto. Mandá **solo los campos que cambian**; lo que no mandás se queda como está.

**Request** — cambiar el precio y subir el stock de una talla:

```json
{
  "precio": 21000,
  "variantes": [{ "talla": "30", "color": "Negro", "stock": 99 }]
}
```

**Response · 200**

```json
{
  "_id": "6b007b4e9a5d918d83ff751f",
  "comercioId": "675000000000000000000d01",
  "nombre": "Pantalon de prueba slim",
  "descripcion": "",
  "precio": { "monto": 21000, "moneda": "CRC" },
  "variantes": [
    { "sku": "PAN-PRU-30-NEG", "talla": "30", "color": "Negro", "stock": 99 },
    { "sku": "PAN-PRU-32-NEG", "talla": "32", "color": "Negro", "stock": 6 },
    { "sku": "PAN-PRU-34-AZU", "talla": "34", "color": "Azul", "stock": 7 }
  ],
  "imagenes": [],
  "activo": true
}
```

Mandaste una sola variante y las otras dos siguen ahí con su stock intacto: solo cambió la que
coincidió. Más detalle en la sección 3.

Otros códigos: **404** si el id no existe, **400** si el id es inválido o si los datos no pasan.

### `DELETE /api/productos/:id`

Borra el producto y sus existencias.

**Request**

```
DELETE /api/productos/6b007bfaeb24b7ec0de674cd
```

**Response · 200**

```json
{ "mensaje": "Eliminado" }
```

Otros códigos: **404** si el id no existe, **400** si el id es inválido.

---

## 3. Reglas de los datos

### Precio

- Se **manda como número**, no como texto: `"precio": 18500`, nunca `"precio": "18500"`. Si el input
  del formulario te da texto, convertilo con `Number(...)` antes de enviar.
- **Vuelve como objeto**: `"precio": { "monto": 18500, "moneda": "CRC" }`, porque así lo guarda la
  base de datos. Para mostrarlo usá `p.precio.monto`.
- Tiene que ser mayor o igual a 0.

### Stock

- Va **dentro de cada variante**, en `variantes[].stock`, y se manda como número entero: `"stock": 7`,
  nunca `"stock": "7"` ni `"stock": 2.5`.
- En la base vive en una colección aparte (`inventario`), pero eso no te afecta: la API lo recibe y
  lo devuelve siempre dentro de la variante.
- Tiene que ser un entero mayor o igual a 0.

### SKU

- **Lo genera la API**, no lo mandés al crear. Se arma con el nombre del producto, la talla y el
  color: "Camisa de lino manga larga" + talla `M` + color `Blanco` da `CAM-LIN-M-BLA`.
- Viene en cada variante de todas las respuestas. Guardalo si querés poder editar esa variante
  después (ver abajo).

### Variantes en el PUT

El PUT **nunca borra variantes**. Para cada variante que mandás:

| Lo que mandás | Qué pasa |
|---|---|
| `{ talla, color, stock }` y esa talla + color ya existe | le actualiza el stock |
| `{ talla, color, stock }` con una combinación nueva | agrega una variante nueva, con su sku |
| `{ sku, stock }` con un sku del producto | le actualiza el stock a esa variante |
| nada (no mandás la clave `variantes`) | no toca ninguna variante |
| `"variantes": []` | no toca ninguna variante |

El emparejamiento es por `sku` si lo mandás, y si no por `talla` + `color`.

**La comparación de talla y color distingue mayúsculas y espacios.** `"Blanco"`, `"blanco"` y
`"Blanco "` son tres valores distintos, y mandar el que no coincide agrega una variante repetida en
vez de actualizar la que ya estaba. Por eso conviene que talla y color sean listas desplegables con
valores fijos, y no campos de texto libre.

**Para agotar una talla, dejala en 0.** No hay forma de borrar una variante desde el PUT:

```json
{ "variantes": [{ "sku": "CAM-LIN-L-BLA", "stock": 0 }] }
```

Si mandás un `sku` tiene que ser de ese producto y con su misma talla y color; si no, la API
responde 400 en vez de hacer algo raro. Los dos casos están en la tabla de errores.

### Campos que pone la API sola

| Campo | Valor |
|---|---|
| `comercioId` | el primer comercio con estado `ACTIVO`, si no lo mandás |
| `precio.moneda` | `CRC` |
| `sku` de cada variante | generado a partir del nombre, la talla y el color |
| `creadoEn` | la fecha de creación |

`categoriaId` es opcional. Si no lo mandás, el producto queda sin categoría; si lo mandás, tiene
que ser el `_id` de una categoría que exista.

---

## 4. Errores

**Todos los errores vienen con la misma forma**, así que siempre podés leer `datos.error`:

```json
{ "error": "El precio debe ser un número mayor o igual a 0" }
```

Nunca hay un campo `message` en los errores. Los mensajes están en español y se pueden mostrar
directamente al usuario.

| Código | Cuándo |
|---|---|
| **400** | los datos del request no sirven: id mal formado, JSON roto, precio o stock inválidos, referencia a algo que no existe |
| **404** | el id tiene forma válida pero no hay un producto con ese id |
| **409** | choca con un dato que tiene que ser único |
| **500** | error del servidor o de la base |

### Mensajes de 400

| Mensaje | Causa |
|---|---|
| `ID inválido` | el `:id` de la URL no tiene forma de ObjectId |
| `JSON inválido` | el cuerpo del request no es JSON válido |
| `El precio debe ser un número mayor o igual a 0` | `precio` vino como texto, vacío, negativo o ausente |
| `El stock debe ser un número entero mayor o igual a 0` | `stock` vino como texto, negativo o con decimales |
| `La categoría indicada no existe` | `categoriaId` no corresponde a ninguna categoría |
| `El comercio indicado no existe` | `comercioId` no corresponde a ningún comercio |
| `No hay comercios activos para asignar el producto` | no mandaste `comercioId` y no hay ninguno `ACTIVO` en la base |
| `La variante indicada no existe en este producto` | mandaste un `sku` que no es de ese producto |
| `Para otra talla o color, agregá una variante nueva (la anterior se puede dejar en 0)` | mandaste un `sku` del producto pero con otra talla u otro color |
| `Valor inválido en <campo>` | un campo tiene un tipo que no corresponde |
| `La base rechazó los datos: revise los campos obligatorios` | el validador de la base rechazó el documento |
| varios mensajes separados por punto | falló más de una validación del modelo a la vez |

### Mensajes de 404 y 409

| Código | Mensaje |
|---|---|
| 404 | `Producto no encontrado` |
| 404 | `Ruta no encontrada` (la URL no existe) |
| 409 | `Ya existe un registro con esos datos` |
| 500 | `Error interno del servidor` |

---

## 5. Notas para el front

1. **Apagá el mock.** En `frontend/app.js`, poné `USE_MOCK = false`. `API_URL` ya apunta a
   `http://localhost:3000/api`, que es el puerto por defecto de la API.

2. **Leé el precio del objeto.** La API devuelve `precio: { monto, moneda }`, así que
   `Number(p.precio)` da `NaN`. Usá `p.precio.monto`:

   ```js
   // en la tabla
   `₡${Number(p.precio.monto).toLocaleString('es-CR')}`

   // al cargar el formulario para editar
   $('precio').value = p.precio?.monto ?? '';
   ```

   Al **enviar** no cambia nada: seguí mandando `precio` como número.

3. **Talla y color, en listas desplegables.** La API empareja las variantes comparando talla y color
   exactamente, distinguiendo mayúsculas y espacios. Con campos de texto libre es fácil escribir
   `"blanco"` y terminar con una variante repetida en vez de actualizar la que ya existía.

4. **Mandá el `sku` para editar una variante que ya existe.** Viene en cada variante del GET.
   Es la forma segura de decirle a la API "esta variante, no otra":

   ```js
   { variantes: [{ sku: 'CAM-LIN-M-BLA', stock: 20 }] }
   ```

   Sin `sku`, el emparejamiento depende de que talla y color coincidan letra por letra. Y ojo: el
   `sku` sirve para cambiar el stock, no para cambiar la talla o el color de esa variante; para otra
   talla o color, agregá una variante nueva.

5. **Para agotar una talla, stock en 0.** El PUT no borra variantes.

6. **El formulario maneja una sola variante.** Eso está bien: el PUT solo toca la variante que
   mandás y deja las demás intactas. Tenelo en cuenta al mostrar la tabla, porque un producto puede
   tener varias y `variantes[0]` es solo la primera.

7. **Para vaciar la categoría de un producto** hace falta mandar algo explícito. Hoy `leerFormulario`
   solo agrega `categoriaId` cuando tiene valor, así que elegir "Sin categoría" al editar no manda
   nada y la categoría anterior se queda puesta.
