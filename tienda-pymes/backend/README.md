# API Tienda Pymes · Contrato de productos

API REST de productos y reportes sobre Node.js + Express + Mongoose. Este documento es lo que
necesitás para consumirla desde el front: cómo levantarla, los endpoints, las reglas de los datos y
los errores que puede devolver.

---

## Cambios del 21/11

- **El SKU lo escribe el usuario y es obligatorio.** La API ya no lo genera: cada variante tiene que
  venir con su `sku`, tanto al crear como al editar.
- **Para editar una variante se manda su SKU**, y con eso se le pueden cambiar la talla, el color y
  el stock. Un SKU que no es del producto se agrega como variante nueva; si ese SKU ya está en uso,
  la API responde 409.
- **Hay reportes nuevos** con agregaciones, bajo `/api/reportes` (sección 5).

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

## 2. Los cinco endpoints de productos

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

Crea un producto. Cada variante va con su `sku`, que es obligatorio. No hace falta mandar
`comercioId`: la API le asigna el primer comercio activo.

**Request**

```json
{
  "nombre": "Camisa de prueba manga corta",
  "descripcion": "Producto de prueba",
  "precio": 12345,
  "activo": true,
  "categoriaId": "675000000000000000000e02",
  "variantes": [{ "sku": "CAM-PRU-M-VER", "talla": "M", "color": "Verde", "stock": 7 }]
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

Fijate en que mandaste `precio` como número y volvió como `{ monto, moneda }`.

Otros códigos: **400** si falta un `sku` o si viene repetido en el mismo request, **409** si alguno
de los `sku` ya está en uso.

### `PUT /api/productos/:id`

Actualiza un producto. Mandá **solo los campos que cambian**; lo que no mandás se queda como está.
Cada variante se identifica por su `sku`.

**Request** — cambiar el precio y subir el stock de una variante:

```json
{
  "precio": 21000,
  "variantes": [{ "sku": "PAN-PRU-30-NEG", "stock": 99 }]
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

Mandaste una sola variante y las otras dos siguen ahí con su stock intacto: solo cambió la del `sku`
que mandaste. Más detalle en la sección 3.

Otros códigos: **404** si el id no existe, **400** si el id es inválido o si a una variante le falta
el `sku`, **409** si mandás un `sku` que ya está en uso en otro producto.

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

- **Lo escribe el usuario y es obligatorio.** Cada variante tiene que venir con su `sku`, tanto en
  el POST como en el PUT. Si falta, la API responde 400.
- **Es único en todo el inventario.** No puede repetirse dentro del mismo request (400) ni estar ya
  en uso por otra variante, de este producto o de otro (409).
- Se le quitan los espacios de los extremos, pero no se cambia nada más: se guarda tal como lo
  escribiste.
- Es la forma de identificar una variante: viene en cada variante de todas las respuestas, y es lo
  que mandás para editarla.

### Variantes en el PUT

El PUT **nunca borra variantes**. Para cada variante que mandás:

| Lo que mandás | Qué pasa |
|---|---|
| un `sku` que ya es del producto | le actualiza la talla, el color y el stock, **solo los que vengan** |
| un `sku` que no es del producto y está libre | agrega la variante nueva, con su fila de inventario |
| un `sku` que ya está en uso en otra parte | **409**, y el producto no se toca |
| una variante sin `sku` | **400**, y el producto no se toca |
| nada (no mandás la clave `variantes`) | no toca ninguna variante |
| `"variantes": []` | no toca ninguna variante |

Las variantes que no mandás se quedan exactamente como estaban.

Para cambiarle solo el stock a una variante, alcanza con su `sku`:

```json
{ "variantes": [{ "sku": "CAM-LIN-L-BLA", "stock": 20 }] }
```

Y para cambiarle la talla o el color, mandás el mismo `sku` con el campo nuevo. El `sku` no cambia:
sigue siendo el de esa variante, y su fila de inventario es la misma.

```json
{ "variantes": [{ "sku": "CAM-LIN-L-BLA", "talla": "XL", "stock": 20 }] }
```

**Para agotar una talla, dejala en 0.** No hay forma de borrar una variante desde el PUT:

```json
{ "variantes": [{ "sku": "CAM-LIN-L-BLA", "stock": 0 }] }
```

### Campos que pone la API sola

| Campo | Valor |
|---|---|
| `comercioId` | el primer comercio con estado `ACTIVO`, si no lo mandás |
| `precio.moneda` | `CRC` |
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
| `Cada variante necesita su SKU` | una variante vino sin `sku`, o con el `sku` vacío |
| `El SKU <sku> está repetido` | el mismo `sku` vino dos veces en el mismo POST |
| `El límite debe ser un número entero mayor o igual a 0` | el `?limite=` de `/api/reportes/stock-bajo` no es un entero ≥ 0 |
| `Valor inválido en <campo>` | un campo tiene un tipo que no corresponde |
| `La base rechazó los datos: revise los campos obligatorios` | el validador de la base rechazó el documento |
| varios mensajes separados por punto | falló más de una validación del modelo a la vez |

### Mensajes de 404 y 409

| Código | Mensaje | Cuándo |
|---|---|---|
| 404 | `Producto no encontrado` | el id tiene forma válida pero no existe |
| 404 | `Ruta no encontrada` | la URL no existe |
| 409 | `El SKU <sku> ya existe` | ese `sku` ya está en uso en el inventario |
| 409 | `Ya existe un registro con esos datos` | choca con otro dato único de la base |
| 500 | `Error interno del servidor` | error del servidor o de la base |

---

## 5. Reportes

Seis `GET` de solo lectura bajo `/api/reportes`. Todos devuelven 200 y JSON. Los ejemplos de abajo
son con los datos de ejemplo de `database/tienda_pymes.js`.

### `GET /api/reportes/resumen`

Cuántos productos, categorías y pedidos hay.

```json
{ "productos": 2, "categorias": 4, "pedidos": 1 }
```

### `GET /api/reportes/productos-por-categoria`

Cuántos productos tiene cada categoría. Los productos sin categoría salen agrupados como
`"Sin categoría"`.

```json
[
  { "cantidad": 1, "categoria": "Camisas" },
  { "cantidad": 1, "categoria": "Pantalones" }
]
```

### `GET /api/reportes/stock-por-producto`

El stock total de cada producto, sumando todas sus variantes. Ordenado de mayor a menor.

```json
[
  { "stockTotal": 27, "producto": "Camisa de lino manga larga" },
  { "stockTotal": 14, "producto": "Pantalón jean slim" }
]
```

### `GET /api/reportes/precio-por-categoria`

Precio promedio, más bajo y más alto de cada categoría. El promedio viene redondeado a 2 decimales.

```json
[
  { "minimo": 18500, "maximo": 18500, "categoria": "Camisas", "promedio": 18500 },
  { "minimo": 24900, "maximo": 24900, "categoria": "Pantalones", "promedio": 24900 }
]
```

### `GET /api/reportes/stock-bajo?limite=5`

Las variantes con menos existencias que el límite. Si no mandás `limite`, usa 5. Ordenado de menos a
más existencias, así que las más críticas salen primero.

```json
[
  { "sku": "CAM-LIN-L-BLA", "existencias": 2, "producto": "Camisa de lino manga larga" }
]
```

Si `limite` no es un entero mayor o igual a 0, responde **400**
`{ "error": "El límite debe ser un número entero mayor o igual a 0" }`.

### `GET /api/reportes/pedidos-por-estado`

Cuántos pedidos hay en cada estado. Los estados posibles son `CREADO`, `PAGADO`, `ENVIADO`,
`ENTREGADO` y `CANCELADO`.

```json
[
  { "cantidad": 1, "estado": "PAGADO" }
]
```

---

## 6. Notas para el front

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

3. **El formulario necesita un campo SKU por variante.** Hoy el HTML tiene `talla`, `color` y
   `stock`, pero no `sku`, y ahora el `sku` es obligatorio: sin él, el POST y el PUT responden 400.
   Hay que agregar un input de texto para el SKU junto a los otros tres, y mandarlo dentro de la
   variante:

   ```js
   datos.variantes.push({
     sku: $('sku').value.trim(),
     talla: $('talla').value.trim(),
     color: $('color').value.trim(),
     stock: Number($('stock').value) || 0,
   });
   ```

   Al editar, cargalo desde la variante que estás mostrando: `$('sku').value = v.sku || ''`.

4. **El `sku` es el que identifica la variante.** Mandándolo podés cambiarle la talla, el color y el
   stock, y la API sabe a cuál te referís:

   ```js
   { variantes: [{ sku: 'CAM-LIN-M-BLA', talla: 'L', stock: 20 }] }
   ```

   Un `sku` que no es del producto se agrega como variante nueva. Si el SKU que escribió el usuario
   ya está en uso, la respuesta es 409 con el mensaje listo para mostrar.

5. **Para agotar una talla, stock en 0.** El PUT no borra variantes.

6. **El formulario maneja una sola variante.** Eso está bien: el PUT solo toca la variante que
   mandás y deja las demás intactas. Tenelo en cuenta al mostrar la tabla, porque un producto puede
   tener varias y `variantes[0]` es solo la primera.

7. **Para vaciar la categoría de un producto** hace falta mandar algo explícito. Hoy `leerFormulario`
   solo agrega `categoriaId` cuando tiene valor, así que elegir "Sin categoría" al editar no manda
   nada y la categoría anterior se queda puesta.
