// =====================================================================
// tienda_pymes - Estructura inicial (15 colecciones) + datos de ejemplo
// Ejecutar en local:  mongosh "mongodb://localhost:27017" tienda_pymes.js
// Ejecutar en Atlas:  mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/" --username USUARIO tienda_pymes.js
// (o pegar por bloques en mongosh)
// =====================================================================

use("tienda_pymes");

// Reinicio limpio para poder re-ejecutar el script.
// OJO: esta línea borra TODA la base tienda_pymes.
// En local se puede correr las veces que haga falta.
// En Atlas, solo una vez para montarla, y avisando al grupo.
db.dropDatabase();

// ---------------------------------------------------------------------
// IDs fijos para poder referenciar entre colecciones.
// Son iguales en todas las máquinas y en Atlas, así que sirven para
// las pruebas de Postman de todo el grupo.
// ---------------------------------------------------------------------
const idRolAdmin = ObjectId("675000000000000000000a01"), idRolVend = ObjectId("675000000000000000000a02"),
      idRolCli   = ObjectId("675000000000000000000a03"), idRolSop  = ObjectId("675000000000000000000a04");
const idUsrAdmin = ObjectId("675000000000000000000b01"), idUsrVend = ObjectId("675000000000000000000b02"),
      idUsrCli   = ObjectId("675000000000000000000b03");
const idCliente  = ObjectId("675000000000000000000c01"), idComercio = ObjectId("675000000000000000000d01");
const idCatRopa  = ObjectId("675000000000000000000e01"), idCatCamisas = ObjectId("675000000000000000000e02"),
      idCatPantalones = ObjectId("675000000000000000000e03");
const idProd1 = ObjectId("675000000000000000000f01"), idProd2 = ObjectId("675000000000000000000f02");
const idPedido = ObjectId("675000000000000000000101"), idPago = ObjectId("675000000000000000000201"),
      idEnvio  = ObjectId("675000000000000000000301");
const idCupon = ObjectId("675000000000000000000401");

// ---------------------------------------------------------------------
// 1) CREACIÓN DE COLECCIONES CON VALIDACIÓN ($jsonSchema)
// ---------------------------------------------------------------------
db.createCollection("roles", { validator: { $jsonSchema: {
  bsonType: "object", required: ["nombre", "permisos"],
  properties: { nombre: { bsonType: "string" }, descripcion: { bsonType: "string" },
                permisos: { bsonType: "array", items: { bsonType: "string" } } } } } });

db.createCollection("usuarios", { validator: { $jsonSchema: {
  bsonType: "object", required: ["correo", "passwordHash", "rolId", "estado", "creadoEn"],
  properties: { correo: { bsonType: "string", pattern: "^.+@.+\\..+$" },
                passwordHash: { bsonType: "string" }, rolId: { bsonType: "objectId" },
                estado: { enum: ["ACTIVO", "INACTIVO", "BLOQUEADO"] },
                creadoEn: { bsonType: "date" } } } } });

db.createCollection("clientes", { validator: { $jsonSchema: {
  bsonType: "object", required: ["usuarioId", "nombre", "apellidos"],
  properties: { usuarioId: { bsonType: "objectId" }, nombre: { bsonType: "string" },
                apellidos: { bsonType: "string" }, telefonos: { bsonType: "array" },
                direcciones: { bsonType: "array" } } } } });

db.createCollection("comercios", { validator: { $jsonSchema: {
  bsonType: "object", required: ["razonSocial", "cedulaJuridica", "estado"],
  properties: { razonSocial: { bsonType: "string" }, cedulaJuridica: { bsonType: "string" },
                estado: { enum: ["ACTIVO", "SUSPENDIDO", "PENDIENTE"] } } } } });

db.createCollection("categorias", { validator: { $jsonSchema: {
  bsonType: "object", required: ["nombre"],
  properties: { nombre: { bsonType: "string" }, padreId: { bsonType: ["objectId", "null"] } } } } });

db.createCollection("productos", { validator: { $jsonSchema: {
  bsonType: "object", required: ["comercioId", "nombre", "precio", "activo"],
  properties: { comercioId: { bsonType: "objectId" }, categoriaId: { bsonType: "objectId" },
                nombre: { bsonType: "string" },
                precio: { bsonType: "object", required: ["monto", "moneda"],
                          properties: { monto: { bsonType: ["int", "double", "long"], minimum: 0 },
                                        moneda: { enum: ["CRC", "USD"] } } },
                variantes: { bsonType: "array" }, activo: { bsonType: "bool" } } } } });

db.createCollection("inventario", { validator: { $jsonSchema: {
  bsonType: "object", required: ["productoId", "sku", "bodega", "existencias", "minimo"],
  properties: { productoId: { bsonType: "objectId" }, sku: { bsonType: "string" },
                bodega: { bsonType: "string" },
                existencias: { bsonType: ["int", "long"], minimum: 0 },
                minimo: { bsonType: ["int", "long"], minimum: 0 } } } } });

db.createCollection("carritos", { validator: { $jsonSchema: {
  bsonType: "object", required: ["clienteId", "lineas", "estado", "expiraEn"],
  properties: { clienteId: { bsonType: "objectId" }, lineas: { bsonType: "array" },
                estado: { enum: ["ACTIVO", "ABANDONADO", "CONVERTIDO"] },
                expiraEn: { bsonType: "date" } } } } });

db.createCollection("pedidos", { validator: { $jsonSchema: {
  bsonType: "object", required: ["clienteId", "comercioId", "lineas", "total", "estado"],
  properties: { clienteId: { bsonType: "objectId" }, comercioId: { bsonType: "objectId" },
                lineas: { bsonType: "array", minItems: 1 },
                total: { bsonType: ["int", "double", "long"], minimum: 0 },
                estado: { enum: ["CREADO", "PAGADO", "ENVIADO", "ENTREGADO", "CANCELADO"] } } } } });

db.createCollection("pagos", { validator: { $jsonSchema: {
  bsonType: "object", required: ["pedidoId", "metodo", "monto", "resultado"],
  properties: { pedidoId: { bsonType: "objectId" },
                metodo: { enum: ["TARJETA", "SINPE", "TRANSFERENCIA", "EFECTIVO"] },
                monto: { bsonType: ["int", "double", "long"], minimum: 0 },
                resultado: { enum: ["APROBADO", "RECHAZADO", "PENDIENTE"] } } } } });

db.createCollection("envios", { validator: { $jsonSchema: {
  bsonType: "object", required: ["pedidoId", "transportista", "estado"],
  properties: { pedidoId: { bsonType: "objectId" }, transportista: { bsonType: "string" },
                estado: { enum: ["PREPARANDO", "EN_RUTA", "ENTREGADO", "DEVUELTO"] } } } } });

db.createCollection("resenas", { validator: { $jsonSchema: {
  bsonType: "object", required: ["clienteId", "productoId", "calificacion"],
  properties: { clienteId: { bsonType: "objectId" }, productoId: { bsonType: "objectId" },
                calificacion: { bsonType: "int", minimum: 1, maximum: 5 } } } } });

db.createCollection("cupones", { validator: { $jsonSchema: {
  bsonType: "object", required: ["codigo", "tipo", "valor", "vigenteHasta"],
  properties: { codigo: { bsonType: "string" }, tipo: { enum: ["PORCENTAJE", "MONTO_FIJO"] },
                valor: { bsonType: ["int", "double"], minimum: 0 },
                vigenteHasta: { bsonType: "date" } } } } });

db.createCollection("notificaciones", { validator: { $jsonSchema: {
  bsonType: "object", required: ["usuarioId", "canal", "estado"],
  properties: { usuarioId: { bsonType: "objectId" }, canal: { enum: ["CORREO", "SMS", "PUSH"] },
                estado: { enum: ["PENDIENTE", "ENVIADA", "FALLIDA"] } } } } });

db.createCollection("auditoria", { validator: { $jsonSchema: {
  bsonType: "object", required: ["usuarioId", "operacion", "entidad", "fecha"],
  properties: { usuarioId: { bsonType: "objectId" }, operacion: { bsonType: "string" },
                entidad: { bsonType: "string" }, fecha: { bsonType: "date" } } } } });

// ---------------------------------------------------------------------
// 2) DOCUMENTOS DE EJEMPLO
// ---------------------------------------------------------------------
db.roles.insertMany([
  { _id: idRolAdmin, nombre: "administrador", descripcion: "Gestiona la plataforma", permisos: ["*"] },
  { _id: idRolVend,  nombre: "vendedor", descripcion: "Dueño o personal de un comercio", permisos: ["productos:*", "inventario:*", "pedidos:leer", "pedidos:actualizar"] },
  { _id: idRolCli,   nombre: "cliente", descripcion: "Comprador", permisos: ["carrito:*", "pedidos:crear", "pedidos:leer_propios", "resenas:crear"] },
  { _id: idRolSop,   nombre: "soporte", descripcion: "Atención al cliente", permisos: ["pedidos:leer", "usuarios:leer"] }
]);

db.usuarios.insertMany([
  { _id: idUsrAdmin, correo: "admin@tiendapymes.cr", passwordHash: "$2b$10$adminHashEjemplo000000000000000000000000000000000000", rolId: idRolAdmin, estado: "ACTIVO", creadoEn: ISODate("2026-09-01T08:00:00Z") },
  { _id: idUsrVend,  correo: "ventas@modanova.cr",   passwordHash: "$2b$10$vendHashEjemplo0000000000000000000000000000000000000", rolId: idRolVend,  estado: "ACTIVO", creadoEn: ISODate("2026-09-05T10:30:00Z") },
  { _id: idUsrCli,   correo: "maria.rojas@correo.com", passwordHash: "$2b$10$cliHashEjemplo00000000000000000000000000000000000000", rolId: idRolCli, estado: "ACTIVO", creadoEn: ISODate("2026-09-20T14:15:00Z") }
]);

db.clientes.insertOne({
  _id: idCliente, usuarioId: idUsrCli, nombre: "María", apellidos: "Rojas Vargas",
  telefonos: [{ tipo: "móvil", numero: "+506 8888-1234" }],
  direcciones: [{ alias: "Casa", provincia: "San José", canton: "Escazú", distrito: "San Rafael", detalle: "200 m norte de la iglesia", predeterminada: true }]
});

db.comercios.insertOne({
  _id: idComercio, razonSocial: "Moda Nova S.A.", cedulaJuridica: "3-101-123456",
  contacto: { correo: "ventas@modanova.cr", telefono: "+506 2222-3344" },
  propietarioId: idUsrVend, estado: "ACTIVO", creadoEn: ISODate("2026-09-05T10:30:00Z")
});

db.categorias.insertMany([
  { _id: idCatRopa,       nombre: "Ropa",       padreId: null,       ruta: "ropa" },
  { _id: idCatCamisas,    nombre: "Camisas",    padreId: idCatRopa,  ruta: "ropa/camisas" },
  { _id: idCatPantalones, nombre: "Pantalones", padreId: idCatRopa,  ruta: "ropa/pantalones" }
]);

db.productos.insertMany([
  { _id: idProd1, comercioId: idComercio, categoriaId: idCatCamisas, nombre: "Camisa de lino manga larga",
    descripcion: "Camisa casual de lino, corte regular.",
    precio: { monto: 18500, moneda: "CRC" },
    atributos: { material: "Lino 100%", genero: "Unisex" },
    variantes: [ { sku: "CAM-LIN-M-BLA", talla: "M", color: "Blanco" },
                 { sku: "CAM-LIN-L-BLA", talla: "L", color: "Blanco" },
                 { sku: "CAM-LIN-M-AZU", talla: "M", color: "Azul" } ],
    imagenes: ["camisa_lino_blanca.jpg"], activo: true, creadoEn: ISODate("2026-10-01T09:00:00Z") },
  { _id: idProd2, comercioId: idComercio, categoriaId: idCatPantalones, nombre: "Pantalón jean slim",
    descripcion: "Jean de mezclilla elástica.",
    precio: { monto: 24900, moneda: "CRC" },
    atributos: { material: "Mezclilla elástica", genero: "Mujer" },
    variantes: [ { sku: "PAN-JEA-30-NEG", talla: "30", color: "Negro" },
                 { sku: "PAN-JEA-32-NEG", talla: "32", color: "Negro" } ],
    imagenes: ["jean_slim_negro.jpg"], activo: true, creadoEn: ISODate("2026-10-01T09:30:00Z") }
]);

db.inventario.insertMany([
  { productoId: idProd1, sku: "CAM-LIN-M-BLA", bodega: "Principal", existencias: 15, minimo: 3,
    movimientos: [ { tipo: "ENTRADA", cantidad: 20, fecha: ISODate("2026-10-01T10:00:00Z") },
                   { tipo: "SALIDA",  cantidad: 5,  fecha: ISODate("2026-10-10T16:00:00Z") } ] },
  { productoId: idProd1, sku: "CAM-LIN-L-BLA", bodega: "Principal", existencias: 2,  minimo: 3, movimientos: [] },
  { productoId: idProd1, sku: "CAM-LIN-M-AZU", bodega: "Principal", existencias: 10, minimo: 3, movimientos: [] },
  { productoId: idProd2, sku: "PAN-JEA-30-NEG", bodega: "Principal", existencias: 8, minimo: 2, movimientos: [] },
  { productoId: idProd2, sku: "PAN-JEA-32-NEG", bodega: "Principal", existencias: 6, minimo: 2, movimientos: [] }
]);

db.carritos.insertOne({
  clienteId: idCliente, estado: "ACTIVO",
  lineas: [ { productoId: idProd2, sku: "PAN-JEA-30-NEG", nombre: "Pantalón jean slim", cantidad: 1, precioUnit: 24900 } ],
  creadoEn: ISODate("2026-11-02T18:00:00Z"),
  expiraEn: ISODate("2026-12-31T00:00:00Z")   // TTL: se elimina al llegar esta fecha
});

db.cupones.insertOne({
  _id: idCupon, codigo: "BIENVENIDA10", tipo: "PORCENTAJE", valor: 10,
  comercioId: idComercio, usosMaximos: 100, usosActuales: 1, montoMinimo: 15000,
  vigenteDesde: ISODate("2026-10-01T00:00:00Z"), vigenteHasta: ISODate("2026-12-31T23:59:59Z"), activo: true
});

// Pedido: 1 camisa (18 500) x 2 = 37 000 ; IVA 13 % = 4 810 ; total 41 810
db.pedidos.insertOne({
  _id: idPedido, clienteId: idCliente, comercioId: idComercio,
  lineas: [ { productoId: idProd1, sku: "CAM-LIN-M-BLA", nombre: "Camisa de lino manga larga", talla: "M", color: "Blanco", cantidad: 2, precioUnit: 18500 } ],
  subtotal: 37000, impuestos: 4810, descuento: 0, total: 41810, cuponId: null,
  estado: "PAGADO",
  historial: [ { estado: "CREADO", fecha: ISODate("2026-10-02T11:00:00Z") },
               { estado: "PAGADO", fecha: ISODate("2026-10-02T11:05:00Z") } ],
  direccionEntrega: { provincia: "San José", canton: "Escazú", distrito: "San Rafael", detalle: "200 m norte de la iglesia" },
  creadoEn: ISODate("2026-10-02T11:00:00Z")
});

db.pagos.insertOne({
  _id: idPago, pedidoId: idPedido, metodo: "TARJETA", monto: 41810, moneda: "CRC",
  referenciaPasarela: "PSR-20261002-0001", resultado: "APROBADO", fecha: ISODate("2026-10-02T11:05:00Z")
});

db.envios.insertOne({
  _id: idEnvio, pedidoId: idPedido, transportista: "Correos de Costa Rica", guia: "CR123456789",
  estado: "EN_RUTA",
  estadosRuta: [ { estado: "PREPARANDO", fecha: ISODate("2026-10-03T09:00:00Z") },
                 { estado: "EN_RUTA",    fecha: ISODate("2026-10-04T08:00:00Z") } ],
  fechaEstimada: ISODate("2026-10-07T00:00:00Z")
});

db.resenas.insertOne({
  clienteId: idCliente, productoId: idProd1, comercioId: idComercio,
  calificacion: 5, comentario: "Muy fresca y de buena calidad.", fecha: ISODate("2026-10-12T19:00:00Z")
});

db.notificaciones.insertOne({
  usuarioId: idUsrCli, canal: "CORREO", asunto: "Tu pedido fue pagado",
  mensaje: "Recibimos tu pago. Pronto prepararemos el envío.", pedidoId: idPedido,
  estado: "ENVIADA", enviadaEn: ISODate("2026-10-02T11:06:00Z")
});

db.auditoria.insertOne({
  usuarioId: idUsrVend, operacion: "ACTUALIZAR_PRECIO", entidad: "productos", entidadId: idProd1,
  detalle: { antes: 17900, despues: 18500 }, ip: "190.113.10.25", fecha: ISODate("2026-10-05T15:20:00Z")
});

// ---------------------------------------------------------------------
// 3) ÍNDICES
// ---------------------------------------------------------------------
db.usuarios.createIndex({ correo: 1 }, { unique: true, name: "ux_usuarios_correo" });
db.roles.createIndex({ nombre: 1 }, { unique: true });
db.comercios.createIndex({ cedulaJuridica: 1 }, { unique: true });
db.cupones.createIndex({ codigo: 1 }, { unique: true });
db.productos.createIndex({ comercioId: 1, categoriaId: 1 }, { name: "ix_productos_comercio_categoria" });
db.productos.createIndex({ "variantes.sku": 1 });
db.inventario.createIndex({ sku: 1, bodega: 1 }, { unique: true });
db.pedidos.createIndex({ clienteId: 1, estado: 1 }, { name: "ix_pedidos_cliente_estado" });
db.pagos.createIndex({ pedidoId: 1 });
db.envios.createIndex({ pedidoId: 1 });
db.resenas.createIndex({ productoId: 1, fecha: -1 });
db.carritos.createIndex({ expiraEn: 1 }, { expireAfterSeconds: 0, name: "ttl_carritos_expiraEn" });
db.auditoria.createIndex({ usuarioId: 1, fecha: -1 });
db.categorias.createIndex({ padreId: 1, nombre: 1 }, { unique: true, name: "ux_categorias_padre_nombre" });
// Opcional: índice de texto para un buscador de productos (búsqueda por palabras).
// Descomentar si se implementa la búsqueda en la API.
// db.productos.createIndex({ nombre: "text", descripcion: "text" }, { name: "tx_productos_busqueda", default_language: "spanish" });

// ---------------------------------------------------------------------
// 4) VERIFICACIÓN (resultado para captura)
// ---------------------------------------------------------------------
print("Colecciones: " + db.getCollectionNames().length);
db.getCollectionNames().sort().forEach(n => print(n.padEnd(16) + db[n].countDocuments() + " doc(s)"));
