# Slices (Filtros de Datos)

> Definición de los 3 Slices de AppSheet - Subconjuntos filtrados de datos

---

## 1. Slice: Contactos Direccion is not blank

**Propósito:** Muestra solo los contactos que tienen una dirección registrada (para visualización en mapa).

### Propiedades
| Propiedad | Valor |
|-----------|-------|
| **Nombre** | Contactos Direccion is not blank |
| **Tabla Fuente** | Contactos |
| **Filtro** | `ISNOTBLANK([Direccion])` |
| **Modo de Actualización** | ALL_CHANGES |
| **Visible** | ALWAYS |

### Columnas Incluidas
- _RowNumber
- ID_Contacto
- Nombre_Razon_Social
- Cedula_RUC
- Tipo
- Telefono
- Email
- Direccion
- Logo
- Transacciones relacionadas

### Acciones Disponibles
- Delete
- Edit
- Compose Email (Email)
- Add
- Call Phone (Telefono)
- Send SMS (Telefono)

---

## 2. Slice: Cuentas por Cobrar

**Propósito:** Muestra todas las transacciones de INGRESO a crédito que están pendientes de cobro (para gestión de cobranza).

### Propiedades
| Propiedad | Valor |
|-----------|-------|
| **Nombre** | Cuentas por Cobrar |
| **Tabla Fuente** | Transacciones |
| **Tipo de Movimiento** | Ingreso |
| **Condición de Venta** | Crédito |
| **Estado** | Pendiente o Vencido |
| **Modo de Actualización** | ALL_CHANGES |
| **Visible** | ALWAYS |

### Columnas Incluidas
- _RowNumber
- ID_Transaccion
- Fecha
- Tipo_Movimiento
- Contacto_Ref
- Item_Ref
- Detalle_Adicional
- Numero_Factura
- Clave_Hacienda
- Metodo_Pago
- Estado_Pago
- Cantidad
- Precio_Unitario
- Monto_Descuento
- Porcentaje_Descuento
- Porcentaje_IVA
- Moneda
- Tipo_Cambio
- Foto_Comprobante
- Condicion_Venta
- Plazo_Dias
- Fecha_Vencimiento
- Total_Facturado
- Saldo_Actual
- (Todas las columnas de Transacciones)

### Acciones Disponibles
- **auto** (acciones por defecto de la tabla)

### Implementación Kairux
```typescript
// En Drizzle/query:
const cuentasPorCobrar = await db
  .select()
  .from(transacciones)
  .where(and(
    eq(transacciones.tipoMovimiento, 'Ingreso'),
    eq(transacciones.condicionVenta, 'Crédito'),
    or(
      eq(transacciones.estadoPago, 'Pendiente'),
      eq(transacciones.estadoPago, 'Vencido')
    )
  ));
```

---

## 3. Slice: Cuentas por Pagar

**Propósito:** Muestra todas las transacciones de GASTO a crédito que están pendientes de pago (para gestión de pagos a proveedores).

### Propiedades
| Propiedad | Valor |
|-----------|-------|
| **Nombre** | Cuentas por Pagar |
| **Tabla Fuente** | Transacciones |
| **Tipo de Movimiento** | Gasto |
| **Condición de Venta** | Crédito |
| **Estado** | Pendiente o Vencido |
| **Modo de Actualización** | ALL_CHANGES |
| **Visible** | ALWAYS |

### Columnas Incluidas
- _RowNumber
- ID_Transaccion
- Fecha
- Tipo_Movimiento
- Contacto_Ref
- Item_Ref
- Detalle_Adicional
- Numero_Factura
- Clave_Hacienda
- Metodo_Pago
- Estado_Pago
- Cantidad
- Precio_Unitario
- Monto_Descuento
- Porcentaje_Descuento
- Porcentaje_IVA
- Moneda
- Tipo_Cambio
- Foto_Comprobante
- Condicion_Venta
- Plazo_Dias
- Fecha_Vencimiento
- Total_Facturado
- Saldo_Actual
- (Todas las columnas de Transacciones)

### Acciones Disponibles
- **auto** (acciones por defecto de la tabla)

### Implementación Kairux
```typescript
// En Drizzle/query:
const cuentasPorPagar = await db
  .select()
  .from(transacciones)
  .where(and(
    eq(transacciones.tipoMovimiento, 'Gasto'),
    eq(transacciones.condicionVenta, 'Crédito'),
    or(
      eq(transacciones.estadoPago, 'Pendiente'),
      eq(transacciones.estadoPago, 'Vencido')
    )
  ));
```

---

## Resumen de Slices → Vistas

| Slice | Vista que lo usa | Propósito de la Vista |
|-------|-------------------|----------------------|
| Contactos Direccion is not blank | Mapa | Mostrar contactos con ubicación en mapa |
| Cuentas por Cobrar | Cuentas por Cobrar (view), Gráfico_CXC | Gestionar cobros pendientes |
| Cuentas por Pagar | Cuentas por Pagar (view), Gráfico_CXP | Gestionar pagos pendientes |

---

## Notas de Implementación

1. **Slices en Kairux** se implementan como:
   - **SQL WHERE clauses** en las queries de Drizzle
   - **$derived filters** en Svelte 5 para filtrado client-side
   - **Parámetros en comandos HF** (HF01.listCuentasPorCobrar, HF01.listCuentasPorPagar)

2. **Cálculo de Estado:** El slice "Cuentas por Cobrar/Pagar" depende del campo virtual `Estado_Real` que calcula si una factura está:
   - **Pagado** → No aparece en el slice
   - **Pendiente** → Aparece si fecha vencimiento >= hoy
   - **Vencido** → Aparece si fecha vencimiento < hoy

3. **Rutas en SvelteKit:**
   - `/financiero/cuentas-por-cobrar` → Usa slice Cuentas por Cobrar
   - `/financiero/cuentas-por-pagar` → Usa slice Cuentas por Pagar
   - `/financiero/contactos/mapa` → Usa slice Contactos con Dirección
