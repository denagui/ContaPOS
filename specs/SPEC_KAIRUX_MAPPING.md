# SPEC_KAIRUX_MAPPING.md

> Documento Maestro: App Contabilidad → Stack Kairux
> 
> **Source:** PDF Documentation (87 columns, 5 tables, 29 views, 14 format rules, 23 actions)
> **Target:** Cloudflare Workers + Svelte 5 + Tailwind v4 + D1/R2/KV

---

## Resumen Ejecutivo

| AppSheet Component | Kairux Equivalent | Status |
|-------------------|-------------------|--------|
| 5 Tables (Catalogo, Contactos, Transacciones, Abonos, User Settings) | 4 Drizzle Schemas + 1 KV | ✅ Mapped |
| 87 Columns | 87 TypeScript interfaces + Drizzle columns | ✅ Mapped |
| 3 Slices | SQL WHERE clauses + $derived filters | ✅ Mapped |
| 29 Views | 12 SvelteKit Routes + Components | ✅ Mapped |
| 23 Actions | 15 HF Commands | ✅ Mapped |
| 14 Format Rules | Tailwind classes + conditional rendering | ✅ Mapped |
| App Formulas | TypeScript functions (formulas.ts) | ✅ Mapped |

---

## 1. Estructura del Proyecto

```
contabilidad-app/
├── app_web/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── server/
│   │   │   │   ├── kairux/
│   │   │   │   │   ├── modules/
│   │   │   │   │   │   ├── hf01-transacciones.ts
│   │   │   │   │   │   ├── hf02-catalogo.ts
│   │   │   │   │   │   ├── hf03-contactos.ts
│   │   │   │   │   │   ├── hf04-abonos.ts
│   │   │   │   │   │   ├── hf05-reportes.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── command-registry.ts (EXTENDED)
│   │   │   │   │   │   ├── hf.service.ts (EXTENDED)
│   │   │   │   │   │   └── formulas.ts (NEW)
│   │   │   │   │   ├── utils/
│   │   │   │   │   │   ├── currency.ts
│   │   │   │   │   │   └── date.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── financial.types.ts
│   │   │   │   └── db/
│   │   │   │       ├── schema/
│   │   │   │       │   ├── catalogo.ts
│   │   │   │       │   ├── contactos.ts
│   │   │   │       │   ├── transacciones.ts
│   │   │   │       │   ├── abonos.ts
│   │   │   │       │   └── index.ts
│   │   │   │       └── migrations/
│   │   │   └── components/
│   │   │       ├── ui/
│   │   │       │   ├── TransactionCard.svelte
│   │   │       │   ├── ContactCard.svelte
│   │   │       │   ├── CatalogCard.svelte
│   │   │       │   ├── FormatBadge.svelte
│   │   │       │   └── CurrencyInput.svelte
│   │   │       └── shared/
│   │   ├── routes/
│   │   │   ├── (modules)/
│   │   │   │   ├── (app)/
│   │   │   │   │   ├── +layout.server.ts
│   │   │   │   │   ├── +layout.svelte
│   │   │   │   │   └── +page.svelte
│   │   │   │   └── financiero/
│   │   │   │       ├── +layout.server.ts
│   │   │   │       ├── +page.svelte
│   │   │   │       ├── libro/
│   │   │   │       │   ├── +page.server.ts
│   │   │   │       │   └── +page.svelte
│   │   │   │       ├── transaccion/
│   │   │   │       │   ├── [id]/
│   │   │   │       │   │   ├── +page.server.ts
│   │   │   │       │   │   └── +page.svelte
│   │   │   │       │   └── nuevo/
│   │   │   │       │       ├── +page.server.ts
│   │   │   │       │       └── +page.svelte
│   │   │   │       ├── cuentas-por-cobrar/
│   │   │   │       ├── cuentas-por-pagar/
│   │   │   │       ├── catalogo/
│   │   │   │       ├── contactos/
│   │   │   │       ├── abonos/
│   │   │   │       └── reportes/
│   │   │   └── api/
│   │   │       └── v1/
│   │   │           └── kairux/
│   │   │               └── +server.ts
│   │   ├── app.css
│   │   └── app.html
│   ├── static/
│   └── package.json
├── workers/
│   └── src/
│       └── index.ts
├── drizzle.config.ts
├── svelte.config.js
└── wrangler.toml
```

---

## 2. Schema Mapping Completo

### 2.1 Tabla: Catalogo

| AppSheet Column | Drizzle Column | Type | Notes |
|-----------------|----------------|------|-------|
| ID_Item | idItem | text | UNIQUEID() |
| Categoria | categoria | enum | 'Productos', 'Servicios', 'Gastos fijos' |
| Nombre_Item | nombreItem | text | required |
| Naturaleza | naturaleza | enum | 'Compra', 'Venta', 'Ambos' |
| Tarifa_IVA | tarifaIva | enum | '4%', '8%', '13%' |
| Codigo_CABYS | codigoCabys | text | optional |
| Precio_Unitario | precioUnitario | integer | cents |
| Foto | foto | text | R2 path |
| Notas | notas | text | optional |

**TypeScript Interface:**
```typescript
interface Catalogo {
  id: string;                    // system
  tenantId: string;              // system
  companyId: string | null;      // system
  idItem: string;                // UNIQUEID()
  categoria: 'Productos' | 'Servicios' | 'Gastos fijos';
  nombreItem: string;
  naturaleza: 'Compra' | 'Venta' | 'Ambos';
  tarifaIva: '4%' | '8%' | '13%';
  codigoCabys?: string;
  precioUnitario?: number;       // cents
  foto?: string;
  notas?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 2.2 Tabla: Contactos

| AppSheet Column | Drizzle Column | Type | Notes |
|-----------------|----------------|------|-------|
| ID_Contacto | idContacto | text | UNIQUEID() |
| Nombre_Razon_Social | nombreRazonSocial | text | required |
| Cedula_RUC | cedulaRuc | text | optional |
| Tipo | tipo | enum | 'Cliente', 'Proveedor', 'Ambos' |
| Telefono | telefono | text | optional |
| Email | email | text | optional, validated |
| Direccion | direccion | text | optional |
| Logo | logo | text | R2 path |

### 2.3 Tabla: Transacciones

| AppSheet Column | Drizzle Column | Type | Formula/Notes |
|-----------------|----------------|------|---------------|
| ID_Transaccion | idTransaccion | text | UNIQUEID() |
| Fecha | fecha | integer | timestamp ms |
| Tipo_Movimiento | tipoMovimiento | enum | 'Ingreso', 'Gasto' |
| Contacto_Ref | contactoRef | text | FK → contactos.idContacto |
| Item_Ref | itemRef | text | FK → catalogo.idItem |
| Detalle_Adicional | detalleAdicional | text | optional |
| Numero_Factura | numeroFactura | text | optional |
| Clave_Hacienda | claveHacienda | text | 50 chars CR format |
| Metodo_Pago | metodoPago | enum | 'Sinpe', 'Tarjeta', 'Transferencia', 'Efectivo' |
| Estado_Pago | estadoPago | enum | 'Pagado', 'Pendiente', 'Vencido' |
| Cantidad | cantidad | integer | default 1 |
| Precio_Unitario | precioUnitario | integer | cents, required |
| Descuento | tieneDescuento | boolean | Show_If trigger |
| Porcentaje_Descuento | porcentajeDescuento | integer | 0-100 |
| Monto_Descuento | montoDescuento | integer | **calculated** |
| Porcentaje_IVA | porcentajeIva | integer | 0, 4, 8, 13 |
| Monto_IVA | montoIva | integer | **calculated** |
| Moneda | moneda | enum | 'CRC', 'USD' |
| Tipo_Cambio | tipoCambio | integer | default 1 |
| Condicion_Venta | condicionVenta | enum | 'Contado', 'Crédito' |
| Plazo_Dias | plazoDias | integer | conditional |
| Fecha_Vencimiento | fechaVencimiento | integer | **calculated** |
| Total_Facturado | totalFacturado | integer | **calculated** |
| Saldo_Actual | saldoActual | integer | **calculated** |
| Foto_Comprobante | fotoComprobante | text | R2 path |

**Fórmulas Implementadas:**
```typescript
// lib/server/kairux/services/formulas.ts

export function calcularMontoDescuento(
  cantidad: number,
  precioUnitario: number,
  tieneDescuento: boolean,
  porcentajeDescuento: number
): number {
  if (!tieneDescuento || !porcentajeDescuento) return 0;
  const subtotal = cantidad * precioUnitario;
  return Math.round(subtotal * porcentajeDescuento / 100);
}

export function calcularMontoIva(
  cantidad: number,
  precioUnitario: number,
  montoDescuento: number,
  porcentajeIva: number
): number {
  if (!porcentajeIva) return 0;
  const base = (cantidad * precioUnitario) - montoDescuento;
  return Math.round(base * porcentajeIva / 100);
}

export function calcularTotal(
  cantidad: number,
  precioUnitario: number,
  montoDescuento: number,
  montoIva: number
): number {
  return (cantidad * precioUnitario) - montoDescuento + montoIva;
}

export function calcularFechaVencimiento(
  fecha: number,
  condicionVenta: string,
  plazoDias?: number
): number {
  if (condicionVenta === 'Contado') return fecha;
  return fecha + ((plazoDias || 0) * 24 * 60 * 60 * 1000);
}
```

### 2.4 Tabla: Abonos

| AppSheet Column | Drizzle Column | Type | Notes |
|-----------------|----------------|------|-------|
| ID_Pago | idPago | text | UNIQUEID() |
| Transaccion_Ref | transaccionRef | text | FK → transacciones.idTransaccion |
| Fecha_Pago | fechaPago | integer | timestamp |
| Monto_Pagado | montoPagado | integer | cents |
| Metodo_Pago | metodoPago | enum | same as transacciones |
| Comprobante_Pago | comprobantePago | text | R2 path |

**Trigger:** On create/update abono, recalculate transacciones.saldoActual

---

## 3. Command Registry (Comandos HF)

### 3.1 HF01: Transacciones

| AppSheet Action | HF Command | Idempotent | safeDb |
|-----------------|------------|------------|--------|
| List (Libro view) | HF01.list | ✅ | ✅ |
| Detail view | HF01.get | ✅ | ✅ |
| Add | HF01.create | ❌ | ✅ |
| Edit | HF01.update | ❌ | ✅ |
| Delete | HF01.delete | ❌ | ✅ |
| Slice: Cuentas por Cobrar | HF01.listCuentasPorCobrar | ✅ | ✅ |
| Slice: Cuentas por Pagar | HF01.listCuentasPorPagar | ✅ | ✅ |
| Chart: Balance | HF01.calcularTotales | ✅ | ✅ |

**HF01.create Payload:**
```typescript
{
  fecha: number;
  tipoMovimiento: 'Ingreso' | 'Gasto';
  contactoRef: string;
  itemRef: string;
  detalleAdicional?: string;
  numeroFactura?: string;
  claveHacienda?: string;
  metodoPago: 'Sinpe' | 'Tarjeta' | 'Transferencia' | 'Efectivo';
  estadoPago: 'Pagado' | 'Pendiente';
  cantidad: number;
  precioUnitario: number;       // cents input
  tieneDescuento?: boolean;
  porcentajeDescuento?: number;
  porcentajeIva?: number;
  moneda: 'CRC' | 'USD';
  tipoCambio?: number;
  condicionVenta: 'Contado' | 'Crédito';
  plazoDias?: number;
  fotoComprobante?: File;       // Upload to R2
}
```

### 3.2 HF02: Catalogo

| AppSheet Action | HF Command | Idempotent | safeDb |
|-----------------|------------|------------|--------|
| List (Catalogo view) | HF02.list | ✅ | ✅ |
| Add | HF02.create | ❌ | ✅ |
| Edit | HF02.update | ❌ | ✅ |
| Delete | HF02.delete | ❌ | ✅ |

### 3.3 HF03: Contactos

| AppSheet Action | HF Command | Idempotent | safeDb |
|-----------------|------------|------------|--------|
| List (Directorio view) | HF03.list | ✅ | ✅ |
| Add | HF03.create | ❌ | ✅ |
| Edit | HF03.update | ❌ | ✅ |
| Delete | HF03.delete | ❌ | ✅ |
| Compose Email | HF03.composeEmail | ✅ | ❌ |
| Call Phone | HF03.callPhone | ✅ | ❌ |
| Send SMS | HF03.sendSMS | ✅ | ❌ |
| View Map | HF03.viewMap | ✅ | ✅ |

### 3.4 HF04: Abonos

| AppSheet Action | HF Command | Idempotent | safeDb |
|-----------------|------------|------------|--------|
| List (inline) | HF04.list | ✅ | ✅ |
| Add | HF04.create | ❌ | ✅ |
| Edit | HF04.update | ❌ | ✅ |
| Delete | HF04.delete | ❌ | ✅ |

**HF04.create Side Effects:**
1. Insert abono record
2. Calculate new saldo: transaccion.totalFacturado - SUM(all abonos)
3. Update transaccion.saldoActual
4. Update transaccion.estadoPago ('Pagado' if saldo <= 0)

### 3.5 HF05: Reportes

| AppSheet View | HF Command | Idempotent | safeDb |
|---------------|------------|------------|--------|
| Gráfico_Balance | HF05.getBalanceData | ✅ | ✅ |
| Gráfico_CXC | HF05.getCuentasPorCobrarData | ✅ | ✅ |
| Gráfico_CXP | HF05.getCuentasPorPagarData | ✅ | ✅ |
| Ventas_por_Cliente | HF05.getVentasPorCliente | ✅ | ✅ |

---

## 4. Vistas → Rutas

### 4.1 Mapeo de Vistas

| AppSheet View Name | Kairux Route | Component | Priority |
|--------------------|--------------|-----------|----------|
| Libro | /financiero/libro | TransactionList (deck) | P0 |
| Directorio | /financiero/contactos | ContactCardList (card) | P0 |
| Catalogo | /financiero/catalogo | CatalogCardList (card) | P0 |
| Cuentas | /financiero/reportes | Dashboard | P1 |
| Dashboard | /financiero/reportes | Dashboard | P1 |
| Mapa | /financiero/contactos/mapa | MapView | P2 |
| Transacciones_Detail | /financiero/transaccion/[id] | TransactionDetail | P0 |
| Transacciones_Form | /financiero/transaccion/nuevo | TransactionForm | P0 |
| Catalogo_Detail | /financiero/catalogo/[id] | CatalogDetail | P1 |
| Catalogo_Form | /financiero/catalogo/nuevo | CatalogForm | P1 |
| Contactos_Detail | /financiero/contactos/[id] | ContactDetail | P1 |
| Contactos_Form | /financiero/contactos/nuevo | ContactForm | P1 |
| Cuentas por Cobrar | /financiero/cuentas-por-cobrar | FilteredList | P0 |
| Cuentas por Pagar | /financiero/cuentas-por-pagar | FilteredList | P0 |
| Gráfico_Balance | /financiero/reportes/balance | BarChart | P1 |
| Gráfico_CXC | /financiero/reportes/cxc | PieChart | P1 |
| Gráfico_CXP | /financiero/reportes/cxp | PieChart | P1 |
| Ventas_por_Cliente | /financiero/reportes/ventas | BarChart | P2 |

### 4.2 Estructura de Layout

```
routes/(modules)/
├── (app)/                    # Root layout con auth
│   ├── +layout.server.ts     # Guard: autenticación + safeDb
│   ├── +layout.svelte        # Shell: sidebar + header
│   └── +page.svelte          # Dashboard resumen
│
└── financiero/               # Módulo financiero
    ├── +layout.server.ts     # Guard: permisos módulo
    ├── +page.svelte          # Redirect a /libro
    │
    ├── libro/                # HF01.list
    │   ├── +page.server.ts
    │   └── +page.svelte
    │
    ├── transaccion/
    │   ├── [id]/
    │   │   ├── +page.server.ts  # HF01.get
    │   │   └── +page.svelte     # Detail + abonos inline
    │   │
    │   ├── [id]/editar/
    │   │   ├── +page.server.ts  # HF01.update
    │   │   └── +page.svelte
    │   │
    │   └── nuevo/
    │       ├── +page.server.ts  # HF01.create
    │       └── +page.svelte     # Form
    │
    ├── cuentas-por-cobrar/   # HF01.listCuentasPorCobrar
    ├── cuentas-por-pagar/    # HF01.listCuentasPorPagar
    ├── catalogo/             # HF02.*
    ├── contactos/            # HF03.*
    └── reportes/             # HF05.*
        ├── +page.svelte      # Dashboard overview
        ├── balance/
        ├── cxc/
        └── cxp/
```

---

## 5. Format Rules → Tailwind

### 5.1 Reglas de Categoría (Catalogo)

| Rule Name | Condition | Tailwind Classes | Icon |
|-----------|-----------|------------------|------|
| Servicios | `categoria = 'Servicios'` | `font-bold uppercase text-blue-600` | `briefcase` |
| Gastos Fijos | `categoria = 'Gastos fijos'` | `font-bold uppercase text-gray-600` | `store` |
| Productos | `categoria = 'Productos'` | `font-bold uppercase text-purple-600` | `box` |

### 5.2 Reglas de Tipo (Transacciones)

| Rule Name | Condition | Tailwind Classes | Icon |
|-----------|-----------|------------------|------|
| Ingresos | `tipoMovimiento = 'Ingreso'` | `text-green-600 font-bold` | `arrow-up` |
| Gastos | `tipoMovimiento = 'Gasto'` | `text-red-600 font-bold` | `arrow-down` |

### 5.3 Reglas de Estado (Transacciones)

| Rule Name | Condition | Tailwind Classes | Icon |
|-----------|-----------|------------------|------|
| Estado_Pagado | `estadoPago = 'Pagado'` | `bg-green-100 text-green-800` | `check-circle` |
| Estado_Pendiente | `estadoPago = 'Pendiente'` | `bg-orange-100 text-orange-800` | `clock` |
| Estado_Vencido | `estadoPago = 'Vencido'` | `bg-red-100 text-red-800` | `exclamation-triangle` |

### 5.4 Reglas de Método de Pago

| Rule Name | Condition | Icon |
|-----------|-----------|------|
| Icono_SINPE | `metodoPago = 'Sinpe'` | `mobile-alt` |
| Icono_Tarjeta | `metodoPago = 'Tarjeta'` | `credit-card` |
| Icono_Transferencia | `metodoPago = 'Transferencia'` | `university` |
| Icono_Efectivo | `metodoPago = 'Efectivo'` | `money-bill-wave` |

### 5.5 Componente FormatBadge.svelte

```svelte
<script lang="ts">
  interface Props {
    type?: 'categoria' | 'tipo' | 'estado' | 'metodo';
    value: string;
    showIcon?: boolean;
  }
  
  let { type = 'estado', value, showIcon = true }: Props = $props();
  
  let config = $derived(getFormatConfig(type, value));
  
  function getFormatConfig(t: string, v: string) {
    const configs: Record<string, Record<string, { classes: string; icon: string }>> = {
      categoria: {
        'Servicios': { classes: 'font-bold uppercase text-blue-600', icon: 'briefcase' },
        'Gastos fijos': { classes: 'font-bold uppercase text-gray-600', icon: 'store' },
        'Productos': { classes: 'font-bold uppercase text-purple-600', icon: 'box' }
      },
      tipo: {
        'Ingreso': { classes: 'text-green-600 font-bold', icon: 'arrow-up' },
        'Gasto': { classes: 'text-red-600 font-bold', icon: 'arrow-down' }
      },
      estado: {
        'Pagado': { classes: 'bg-green-100 text-green-800 font-bold', icon: 'check-circle' },
        'Pendiente': { classes: 'bg-orange-100 text-orange-800', icon: 'clock' },
        'Vencido': { classes: 'bg-red-100 text-red-800 font-bold', icon: 'exclamation-triangle' }
      },
      metodo: {
        'Sinpe': { classes: '', icon: 'mobile-alt' },
        'Tarjeta': { classes: '', icon: 'credit-card' },
        'Transferencia': { classes: '', icon: 'university' },
        'Efectivo': { classes: '', icon: 'money-bill-wave' }
      }
    };
    return configs[t]?.[v] || { classes: '', icon: '' };
  }
</script>

<span class="inline-flex items-center gap-1 {config.classes}">
  {#if showIcon && config.icon}
    <i class="fas fa-{config.icon}"></i>
  {/if}
  {value}
</span>
```

---

## 6. Storage Configuration (R2)

### 6.1 File Uploads

| Column | Bucket Path | Naming Convention |
|--------|-------------|-------------------|
| Catalogo.Foto | `KAIRUX_DOCUMENTS/catalogo/{tenantId}/{idItem}/{timestamp}.jpg` | `{tenantId}/cat_{idItem}_{Date.now()}.jpg` |
| Contactos.Logo | `KAIRUX_DOCUMENTS/contactos/{tenantId}/{idContacto}/{timestamp}.jpg` | `{tenantId}/con_{idContacto}_{Date.now()}.jpg` |
| Transacciones.Foto_Comprobante | `KAIRUX_DOCUMENTS/transacciones/{tenantId}/{idTransaccion}/{timestamp}.jpg` | `{tenantId}/tx_{idTransaccion}_{Date.now()}.jpg` |
| Abonos.Comprobante_Pago | `KAIRUX_DOCUMENTS/abonos/{tenantId}/{idPago}/{timestamp}.jpg` | `{tenantId}/ab_{idPago}_{Date.now()}.jpg` |

### 6.2 Upload Handler

```typescript
// lib/server/kairux/utils/r2-upload.ts

export async function uploadToR2(
  env: { R2_DOCUMENTS: R2Bucket },
  file: File,
  folder: string,
  tenantId: string,
  entityId: string
): Promise<string> {
  const key = `${folder}/${tenantId}/${entityId}_${Date.now()}.${file.name.split('.').pop()}`;
  
  await env.R2_DOCUMENTS.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    }
  });
  
  return key;
}
```

---

## 7. Implementation Checklist

### Phase 1: Database (Week 1)
- [ ] Create Drizzle schemas (01_SCHEMA_SPECIFICATION.md)
- [ ] Run migrations on D1
- [ ] Create seed data for testing

### Phase 2: Backend Commands (Week 2)
- [ ] Implement HF01 commands
- [ ] Implement HF02 commands
- [ ] Implement HF03 commands
- [ ] Implement HF04 commands
- [ ] Test with safeDb isolation

### Phase 3: Frontend Core (Week 3)
- [ ] Create base components (TransactionCard, ContactCard, CatalogCard)
- [ ] Implement Libro view (deck)
- [ ] Implement TransactionForm
- [ ] Implement FormatBadge component

### Phase 4: Views & Routes (Week 4)
- [ ] Catalogo list and forms
- [ ] Contactos list and forms
- [ ] Cuentas por Cobrar/Pagar filtered views
- [ ] Reportes (charts)

### Phase 5: Polish (Week 5)
- [ ] Format rules implementation
- [ ] File uploads (R2)
- [ ] Email/Phone/SMS actions
- [ ] Map view
- [ ] Testing & bug fixes

---

## 8. References

- `01_SCHEMA_SPECIFICATION.md` - Drizzle schema definitions
- `02_COMMAND_REGISTRY_SPEC.md` - HF command implementations
- `03_BUSINESS_MODULES_SPEC.md` - Route structure and layouts
- `04_FORMULAS_CALCULATIONS_SPEC.md` - Formula translations
- `05_UI_COMPONENTS_SPEC.md` - Svelte component mappings
- `columnas.md` - Source: 87 columns from PDF
- `vistas.md` - Source: 29 views from PDF
- `acciones.md` - Source: 23 actions from PDF
- `reglas.md` - Source: 14 format rules from PDF
- `SKELETON.md` - Kairux stack architecture

---

**Document Version:** 1.0  
**Created:** 2026-04-29  
**Status:** Ready for Implementation
