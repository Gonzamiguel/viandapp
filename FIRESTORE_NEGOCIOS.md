# Colección `negocios` - Multi-Tenant

## Super Admin

Ruta: `/gonza-master` — Solo accesible con el email configurado en `VITE_SUPER_ADMIN_EMAIL` (.env).

Desde ahí podés: crear nuevos clientes (negocios), ejecutar la migración one-time y ver el total de pedidos globales.

---

Para que ViandaPro funcione en modo multi-tenant, debés crear al menos un documento en la colección **negocios** de Firestore.

## Estructura del documento

**ID del documento**: El `slug` del negocio (ej: `donata`, `mi-catering`).

**Campos**:

```json
{
  "nombre": "Donata Catering",
  "slug": "donata",
  "logoUrl": "https://ejemplo.com/logo.png",
  "config": {
    "margenReservaHoras": 72,
    "factorQ": 0,
    "factorQSpice": 0,
    "precioVentaUnico": 0,
    "costoPonderadoObjetivo": null,
    "packagingPorUnidad": 0,
    "gastosFijos": { "sueldos": 0, "alquiler": 0, "otros": 0 }
  },
  "adminId": "email-del-admin@ejemplo.com"
}
```

**Colección `inventario_mensual`** (Verdad Financiera):
- Doc ID: `{businessId}_{anno}_{mes}` (ej: `donata_2025_3`)
- Campos: `businessId`, `anno`, `mes`, `invInicial`, `compras`, `invFinal`, `updatedAt`

## Cómo crear el primer negocio

1. En Firebase Console → Firestore → Crear colección `negocios`
2. Agregar documento con ID = slug (ej: `donata`)
3. Campos: `nombre` (string), `logoUrl` (string, opcional), `config` (map con `margenReservaHoras`), `adminId` (string, opcional)

## URLs de acceso

- **Cliente**: `https://tudominio.com/donata/pedido`
- **Login Staff**: `https://tudominio.com/staff/donata/login`
- **Admin**: `https://tudominio.com/staff/donata/admin`
- **Chef**: `https://tudominio.com/staff/donata/chef`

## Migración de datos existentes

Si tenés datos previos sin `businessId`, necesitás:

1. Crear el documento en `negocios`
2. Agregar el campo `businessId: "tu-slug"` a todos los documentos en `platos`, `pedidos`, `usuarios` y `menu_diario`
3. Para `menu_diario`: los doc IDs deben ser `{businessId}_{fecha}` (ej: `donata_2025-03-09`)
4. Para `usuarios` (clientes): los doc IDs deben ser `{businessId}_{dni}` (ej: `donata_12345678`)
