# Especificación de Schema Drizzle (D1)

> Mapeo completo de las 87 columnas AppSheet → SQLite/Drizzle ORM

---

## 1. Schema: Catalogo

```typescript
// db/schema/catalogo.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const catalogo = sqliteTable('catalogo', {
  // System fields (multi-tenant)
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  companyId: text('company_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
  
  // Business fields
  idItem: text('id_item').notNull().unique(), // UNIQUEID()
  categoria: text('categoria', { enum: ['Productos', 'Servicios', 'Gastos fijos'] }).notNull(),
  nombreItem: text('nombre_item').notNull(),
  naturaleza: text('naturaleza', { enum: ['Compra', 'Venta', 'Ambos'] }).notNull(),
  tarifaIva: text('tarifa_iva', { enum: ['4%', '8%', '13%'] }).notNull(),
  codigoCabys: text('codigo_cabys'),
  precioUnitario: integer('precio_unitario'), // cents (no float)
  foto: text('foto'), // R2 path reference
  notas: text('notas'),
});

export const catalogoRelations = relations(catalogo, ({ many }) => ({
  transacciones: many(transacciones)
}));
```

**Índices recomendados:**
```typescript
// Crear índices para búsquedas frecuentes
// CREATE INDEX idx_catalogo_categoria ON catalogo(categoria);
// CREATE INDEX idx_catalogo_tenant ON catalogo(tenant_id, company_id);
```

---

## 2. Schema: Contactos

```typescript
// db/schema/contactos.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const contactos = sqliteTable('contactos', {
  // System fields
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  companyId: text('company_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
  
  // Business fields
  idContacto: text('id_contacto').notNull().unique(), // UNIQUEID()
  nombreRazonSocial: text('nombre_razon_social').notNull(),
  cedulaRuc: text('cedula_ruc'),
  tipo: text('tipo', { enum: ['Cliente', 'Proveedor', 'Ambos'] }).notNull(),
  telefono: text('telefono'),
  email: text('email'),
  direccion: text('direccion'),
  latitud: integer('latitud'), // stored as integer (multiply by 1e6)
  longitud: integer('longitud'), // stored as integer (multiply by 1e6)
  logo: text('logo'), // R2 path
});

export const contactosRelations = relations(contactos, ({ many }) => ({
  transacciones: many(transacciones)
}));
```

**Índices:**
```typescript
// CREATE INDEX idx_contactos_tipo ON contactos(tipo);
// CREATE INDEX idx_contactos_cedula ON contactos(cedula_ruc);
// CREATE INDEX idx_contactos_tenant ON contactos(tenant_id, company_id);
```

---

## 3. Schema: Transacciones

```typescript
// db/schema/transacciones.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const transacciones = sqliteTable('transacciones', {
  // System fields
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  companyId: text('company_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
  
  // Business fields
  idTransaccion: text('id_transaccion').notNull().unique(), // UNIQUEID()
  fecha: integer('fecha', { mode: 'timestamp_ms' }).notNull(),
  tipoMovimiento: text('tipo_movimiento', { enum: ['Ingreso', 'Gasto'] }).notNull(),
  
  // References (Foreign Keys)
  contactoRef: text('contacto_ref').references(() => contactos.idContacto),
  itemRef: text('item_ref').references(() => catalogo.idItem),
  
  // Transaction details
  detalleAdicional: text('detalle_adicional'),
  numeroFactura: text('numero_factura'),
  claveHacienda: text('clave_hacienda'), // Consecutivo/Clave 50 dígitos
  metodoPago: text('metodo_pago', { enum: ['Sinpe', 'Tarjeta', 'Transferencia', 'Efectivo'] }).notNull(),
  estadoPago: text('estado_pago', { enum: ['Pagado', 'Pendiente', 'Vencido'] }).notNull(),
  
  // Financial (stored in cents, no floats)
  cantidad: integer('cantidad').default(1),
  precioUnitario: integer('precio_unitario').notNull(), // cents
  tieneDescuento: integer('tiene_descuento', { mode: 'boolean' }).default(false),
  porcentajeDescuento: integer('porcentaje_descuento'), // 0-100
  montoDescuento: integer('monto_descuento'), // cents - calculated
  porcentajeIva: integer('porcentaje_iva'), // 4, 8, 13
  montoIva: integer('monto_iva'), // cents - calculated
  
  // Currency
  moneda: text('moneda', { enum: ['CRC', 'USD'] }).notNull(),
  tipoCambio: integer('tipo_cambio').default(1), // 1 CRC = X USD
  
  // Totals (calculated)
  totalFacturado: integer('total_facturado').notNull(), // cents
  saldoActual: integer('saldo_actual').notNull(), // cents
  
  // Credit terms
  condicionVenta: text('condicion_venta', { enum: ['Contado', 'Crédito'] }).notNull(),
  plazoDias: integer('plazo_dias').default(0),
  fechaVencimiento: integer('fecha_vencimiento', { mode: 'timestamp_ms' }),
  
  // Media
  fotoComprobante: text('foto_comprobante'), // R2 path
});

export const transaccionesRelations = relations(transacciones, ({ one, many }) => ({
  contacto: one(contactos, {
    fields: [transacciones.contactoRef],
    references: [contactos.idContacto]
  }),
  item: one(catalogo, {
    fields: [transacciones.itemRef],
    references: [catalogo.idItem]
  }),
  abonos: many(abonos)
}));
```

**Índices críticos:**
```typescript
// CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);
// CREATE INDEX idx_transacciones_tipo ON transacciones(tipo_movimiento);
// CREATE INDEX idx_transacciones_estado ON transacciones(estado_pago);
// CREATE INDEX idx_transacciones_contacto ON transacciones(contacto_ref);
// CREATE INDEX idx_transacciones_vencimiento ON transacciones(fecha_vencimiento);
// CREATE INDEX idx_transacciones_tenant ON transacciones(tenant_id, company_id);
```

---

## 4. Schema: Abonos (Payments)

```typescript
// db/schema/abonos.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const abonos = sqliteTable('abonos', {
  // System fields
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  companyId: text('company_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
  
  // Business fields
  idPago: text('id_pago').notNull().unique(), // UNIQUEID()
  
  // Reference to transaction
  transaccionRef: text('transaccion_ref').references(() => transacciones.idTransaccion).notNull(),
  
  // Payment details
  fechaPago: integer('fecha_pago', { mode: 'timestamp_ms' }).notNull(),
  montoPagado: integer('monto_pagado').notNull(), // cents
  metodoPago: text('metodo_pago', { enum: ['Sinpe', 'Tarjeta', 'Transferencia', 'Efectivo'] }).notNull(),
  comprobantePago: text('comprobante_pago'), // R2 path
  notas: text('notas'),
});

export const abonosRelations = relations(abonos, ({ one }) => ({
  transaccion: one(transacciones, {
    fields: [abonos.transaccionRef],
    references: [transacciones.idTransaccion]
  })
}));
```

**Índices:**
```typescript
// CREATE INDEX idx_abonos_transaccion ON abonos(transaccion_ref);
// CREATE INDEX idx_abonos_fecha ON abonos(fecha_pago);
// CREATE INDEX idx_abonos_tenant ON abonos(tenant_id, company_id);
```

---

## 5. Schema: Per User Settings (System Table)

```typescript
// db/schema/user_settings.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  userEmail: text('user_email').notNull().unique(),
  userName: text('user_name'),
  location: text('location'), // JSON: {lat, lng}
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
});
```

---

## 6. Type Mappings (AppSheet → SQLite)

| AppSheet Type | SQLite Type | Drizzle ORM | Notes |
|---------------|-------------|-------------|-------|
| Text | TEXT | `text()` | VARCHAR stored as TEXT |
| Number | INTEGER | `integer()` | For integers |
| Price | INTEGER | `integer()` | Store as **cents** (multiply by 100) |
| Percent | INTEGER | `integer()` | Store as **0-100** (not 0.0-1.0) |
| Date | INTEGER | `integer({ mode: 'timestamp_ms' })` | Unix ms timestamp |
| DateTime | INTEGER | `integer({ mode: 'timestamp_ms' })` | Unix ms timestamp |
| Enum | TEXT | `text({ enum: [...] })` | With constraint |
| Ref | TEXT | `text().references()` | Foreign key |
| Image | TEXT | `text()` | R2 path reference |
| File | TEXT | `text()` | R2 path reference |
| LatLong | TEXT | `text()` | JSON: {"lat": X, "lng": Y} |
| Yes/No | INTEGER | `integer({ mode: 'boolean' })` | 0 or 1 |

---

## 7. Financial Rules (R4 - No Floats)

```typescript
// utils/currency.ts

export function toCents(amount: number | string): number {
  // Convert to integer cents
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(parsed * 100);
}

export function fromCents(cents: number): string {
  // Display with 2 decimals
  return (cents / 100).toFixed(2);
}

export function formatCurrency(cents: number, currency: 'CRC' | 'USD'): string {
  const amount = cents / 100;
  if (currency === 'CRC') {
    return `₡${amount.toLocaleString('es-CR', { minimumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
```

---

## 8. Migration Order

```bash
# Order to run migrations:
1. user_settings (no deps)
2. catalogo (no deps)
3. contactos (no deps)
4. transacciones (depends on catalogo, contactos)
5. abonos (depends on transacciones)
```

---

## 9. Drizzle Config

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/server/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: process.env.D1_CONNECTION_STRING || ''
  }
});
```
