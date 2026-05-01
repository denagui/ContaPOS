# Estándares Financieros y Técnicos - ContaPOS

## 1. Normativa Contable (NIIF/IFRS)

### 1.1 Principios Fundamentales
El sistema está diseñado para cumplir con las **Normas Internacionales de Información Financiera (NIIF/IFRS)** aplicables a PYMES:

- **NIC 1**: Presentación de Estados Financieros
- **NIC 2**: Inventarios (valoración al costo o valor neto de realización)
- **NIC 16**: Propiedades, Planta y Equipo
- **NIC 37**: Provisiones, Activos Contingentes y Pasivos Contingentes
- **NIIF 9**: Instrumentos Financieros
- **NIIF 15**: Ingresos de Actividades Ordinarias Procedentes de Contratos con Clientes
- **NIIF 16**: Arrendamientos

### 1.2 Campos Contables Requeridos
Todas las transacciones financieras deben incluir:

```typescript
interface IFRSCompliant {
  // Identificación
  transactionId: string;
  organizationId: string;
  
  // Fechas (epoch 13)
  transactionDate: number;      // Fecha de transacción
  postingDate: number;          // Fecha de contabilización
  dueDate?: number;             // Fecha de vencimiento
  
  // Clasificación contable
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subAccountType?: string;
  
  // Valores
  amount: number;               // Monto base
  taxAmount: number;            // Impuesto
  totalAmount: number;          // Total
  currency: string;             // ISO 4217 (CRC, USD, EUR)
  exchangeRate?: number;        // Tasa de cambio
  
  // Trazabilidad
  createdBy: string;
  createdAt: number;            // Epoch 13
  modifiedBy?: string;
  modifiedAt?: number;          // Epoch 13
  
  // Estado
  status: 'draft' | 'posted' | 'cancelled' | 'reversed';
  reversalReason?: string;
  reversalReference?: string;
}
```

### 1.3 Asientos Contables Automáticos
El sistema debe generar asientos automáticos para:
- Ventas y cobros
- Compras y pagos
- Gastos operativos
- Depreciaciones
- Ajustes por inflación (si aplica)
- Conciliaciones bancarias

---

## 2. Estándares ISO Aplicables

### 2.1 ISO 8601 - Fechas y Horas
- **Almacenamiento**: Unix timestamp en milisegundos (Epoch 13)
- **Intercambio**: ISO 8601 con zona horaria (ej: `2024-01-15T14:30:00-06:00`)
- **Visualización**: Formato local según configuración del usuario

### 2.2 ISO 4217 - Códigos de Moneda
- Costa Rica: `CRC` (Colón)
- Estados Unidos: `USD` (Dólar)
- Unión Europea: `EUR` (Euro)
- Todas las transacciones deben especificar moneda ISO 4217

### 2.3 ISO 20022 - Mensajería Financiera
Preparado para integración con sistemas bancarios mediante formatos XML JSON basados en ISO 20022 para:
- Transferencias electrónicas
- Conciliaciones automáticas
- Reportes regulatorios

### 2.4 ISO/IEC 27001 - Seguridad de la Información
- Encriptación AES-256 para datos sensibles
- Hash bcrypt para contraseñas
- Logs de auditoría inmutables
- Control de acceso basado en roles (RBAC)

---

## 3. Manejo de Fechas y Tiempos

### 3.1 Arquitectura de Fechas

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE BASE DE DATOS                                      │
│  - Tipo: INTEGER (NOT NULL)                                 │
│  - Formato: Unix Timestamp en Milisegundos (Epoch 13)       │
│  - Ejemplo: 1705339800000                                   │
│  - Zona horaria: UTC                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE SERVICIOS (Backend)                                │
│  - Procesa en Epoch 13                                      │
│  - Validaciones con Date object                             │
│  - Conversión transparente                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (UI)                                  │
│  - Convierte Epoch 13 → Formato Humano                      │
│  - Formato: DD/MM/YYYY HH:mm:ss                             │
│  - Zona horaria: Configuración del usuario (CR: UTC-6)      │
│  - Localización: es-CR, es-MX, es-AR, etc.                  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Utilidades de Fecha

```typescript
// src/lib/utils/date-utils.ts

/**
 * Obtiene el timestamp actual en milisegundos (Epoch 13)
 */
export function now(): number {
  return Date.now();
}

/**
 * Convierte Epoch 13 a objeto Date
 */
export function toDate(epochMs: number): Date {
  return new Date(epochMs);
}

/**
 * Convierte Epoch 13 a string ISO 8601
 */
export function toISOString(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

/**
 * Formatea Epoch 13 para visualización humana
 * @param epochMs - Timestamp en milisegundos
 * @param locale - Código de localidad (ej: 'es-CR')
 * @param options - Opciones de formato
 */
export function formatHuman(
  epochMs: number,
  locale: string = 'es-CR',
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  
  return new Intl.DateTimeFormat(locale, options || defaultOptions)
    .format(new Date(epochMs));
}

/**
 * Formatea solo la fecha (sin hora)
 */
export function formatDate(epochMs: number, locale: string = 'es-CR'): string {
  return formatHuman(epochMs, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formatea solo la hora
 */
export function formatTime(epochMs: number, locale: string = 'es-CR'): string {
  return formatHuman(epochMs, locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Convierte fecha humana a Epoch 13
 * @param dateString - Fecha en formato YYYY-MM-DD o DD/MM/YYYY
 */
export function fromDateString(dateString: string): number {
  // Soporta múltiples formatos
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${dateString}`);
  }
  return date.getTime();
}

/**
 * Obtiene el inicio del día en Epoch 13
 */
export function startOfDay(epochMs: number): number {
  const date = new Date(epochMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Obtiene el fin del día en Epoch 13
 */
export function endOfDay(epochMs: number): number {
  const date = new Date(epochMs);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Suma días a una fecha Epoch 13
 */
export function addDays(epochMs: number, days: number): number {
  const date = new Date(epochMs);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

/**
 * Calcula diferencia en días entre dos fechas
 */
export function diffInDays(epochMs1: number, epochMs2: number): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((epochMs2 - epochMs1) / msPerDay);
}

/**
 * Valida que un número sea un Epoch 13 válido
 */
export function isValidEpoch(epochMs: unknown): boolean {
  if (typeof epochMs !== 'number') return false;
  if (epochMs < 0) return false;
  if (!Number.isInteger(epochMs)) return false;
  
  // Rango razonable: 2000-01-01 hasta 2100-12-31
  const minEpoch = new Date('2000-01-01').getTime();
  const maxEpoch = new Date('2100-12-31').getTime();
  
  return epochMs >= minEpoch && epochMs <= maxEpoch;
}
```

### 3.3 Convenciones de Nomenclatura

| Contexto | Nombre del Campo | Tipo | Formato | Ejemplo |
|----------|-----------------|------|---------|---------|
| Database | `created_at` | INTEGER | Epoch 13 | `1705339800000` |
| Database | `transaction_date` | INTEGER | Epoch 13 | `1705339800000` |
| API Request | `createdAt` | number | Epoch 13 | `1705339800000` |
| API Response | `createdAt` | number | Epoch 13 | `1705339800000` |
| UI Display | - | string | Humano | `15/01/2024 14:30:00` |

### 3.4 Migración de Datos Existentes

Para tablas existentes con campos `timestamp` o `text`:

```sql
-- 1. Agregar nueva columna temporal
ALTER TABLE sales ADD COLUMN transaction_date_epoch INTEGER;

-- 2. Migrar datos
UPDATE sales 
SET transaction_date_epoch = CAST(strftime('%s', transaction_date) AS INTEGER) * 1000
WHERE transaction_date IS NOT NULL;

-- 3. Validar migración
SELECT COUNT(*) FROM sales WHERE transaction_date_epoch IS NULL;

-- 4. Eliminar columna antigua (después de validación)
ALTER TABLE sales DROP COLUMN transaction_date;

-- 5. Renombrar nueva columna
ALTER TABLE sales RENAME COLUMN transaction_date_epoch TO transaction_date;
```

---

## 4. Implementación en Schema Drizzle

### 4.1 Patrón Base para Tablas Financieras

```typescript
import { integer, text, real } from 'drizzle-orm/sqlite-core';

// Campos comunes NIIF-compliant
const ifrsFields = {
  // Fechas en Epoch 13
  transactionDate: integer('transaction_date', { mode: 'number' }).notNull(),
  postingDate: integer('posting_date', { mode: 'number' }).notNull(),
  dueDate: integer('due_date', { mode: 'number' }),
  
  // Auditoría
  createdAt: integer('created_at', { mode: 'number' }).notNull().$defaultFn(() => Date.now()),
  modifiedAt: integer('modified_at', { mode: 'number' }),
  
  // Estado
  status: text('status', { 
    enum: ['draft', 'posted', 'cancelled', 'reversed'] 
  }).notNull().default('draft'),
  
  // Valores monetarios
  amount: real('amount').notNull(),
  taxAmount: real('tax_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull(),
  currency: text('currency', { length: 3 }).notNull().default('CRC'), // ISO 4217
};
```

### 4.2 Ejemplo de Tabla Completa

```typescript
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  
  // Fechas Epoch 13
  issueDate: integer('issue_date', { mode: 'number' }).notNull(),
  dueDate: integer('due_date', { mode: 'number' }),
  
  // Cliente
  customerId: text('customer_id').notNull(),
  
  // Valores (NIIF)
  subtotal: real('subtotal').notNull(),
  taxAmount: real('tax_amount').notNull(),
  totalAmount: real('total_amount').notNull(),
  currency: text('currency', { length: 3 }).notNull().default('CRC'),
  exchangeRate: real('exchange_rate').default(1),
  
  // Estado contable
  status: text('status', { 
    enum: ['draft', 'issued', 'paid', 'cancelled', 'reversed'] 
  }).notNull().default('draft'),
  
  // Hacienda (Costa Rica)
  haciendaKey: text('hacienda_key'),
  haciendaStatus: text('hacienda_status'),
  cabysCode: text('cabys_code'),
  
  // Auditoría (Epoch 13)
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  modifiedAt: integer('modified_at', { mode: 'number' }),
  createdBy: text('created_by').notNull(),
  modifiedBy: text('modified_by'),
  
  // Reversión (NIIF)
  reversedAt: integer('reversed_at', { mode: 'number' }),
  reversalReason: text('reversal_reason'),
  reversalReference: text('reversal_reference'),
});
```

---

## 5. Buenas Prácticas de Implementación

### 5.1 Backend (Services)

```typescript
// ✅ CORRECTO: Usar Epoch 13 internamente
async function createInvoice(data: CreateInvoiceDTO) {
  const invoice = {
    ...data,
    issueDate: Date.now(), // Epoch 13
    createdAt: Date.now(),
    status: 'draft',
  };
  
  await db.insert(invoices).values(invoice);
  return invoice;
}

// ✅ CORRECTO: Validar fechas
function validateInvoiceDates(issueDate: number, dueDate?: number) {
  if (!isValidEpoch(issueDate)) {
    throw new Error('Fecha de emisión inválida');
  }
  
  if (dueDate && dueDate < issueDate) {
    throw new Error('Fecha de vencimiento no puede ser anterior a la emisión');
  }
}
```

### 5.2 Frontend (UI)

```svelte
<script lang="ts">
  import { formatHuman, formatDate } from '$lib/utils/date-utils';
  
  let invoice = $props();
  
  // Mostrar fecha en formato humano
  $: formattedDate = formatDate(invoice.issueDate, 'es-CR');
  $: formattedDateTime = formatHuman(invoice.createdAt, 'es-CR');
</script>

<div class="invoice-card">
  <p>Fecha de Emisión: {formattedDate}</p>
  <p>Creado: {formattedDateTime}</p>
</div>
```

### 5.3 API Responses

```typescript
// ✅ CORRECTO: Mantener Epoch 13 en la API
interface InvoiceResponse {
  id: string;
  issueDate: number;      // Epoch 13, NO convertir aquí
  totalAmount: number;
  currency: string;
}

// La conversión a formato humano se hace en el frontend
```

---

## 6. Checklist de Cumplimiento

### 6.1 NIIF/IFRS
- [ ] Todos los campos monetarios tienen `currency` ISO 4217
- [ ] Las transacciones tienen estado (`draft`, `posted`, `cancelled`, `reversed`)
- [ ] Soporte para reversión de asientos con razón y referencia
- [ ] Auditoría completa (quién, cuándo)
- [ ] Fechas de transacción y contabilización separadas
- [ ] Tasas de cambio para operaciones multicurrency

### 6.2 ISO Standards
- [ ] Fechas almacenadas como Epoch 13 (INTEGER)
- [ ] Fechas intercambiadas como ISO 8601 cuando sea necesario
- [ ] Monedas en formato ISO 4217 (CRC, USD, EUR)
- [ ] Zona horaria configurable por usuario
- [ ] Formatos de fecha localizados (es-CR, es-MX, etc.)

### 6.3 Seguridad (ISO 27001)
- [ ] Logs de auditoría inmutables
- [ ] Encriptación de datos sensibles
- [ ] Control de acceso RBAC
- [ ] Validación de entrada de datos
- [ ] Prevención de SQL injection

---

## 7. Referencias

- [NIIF para PYMES](https://www.ifrs.org/use-around-the-world/use-of-ifrs-standards-by-jurisdiction/)
- [ISO 8601 - Dates and Times](https://www.iso.org/iso-8601-date-and-time-format.html)
- [ISO 4217 - Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)
- [ISO 20022 - Financial Services](https://www.iso20022.org/)
- [Unix Timestamp Converter](https://www.epochconverter.com/)

---

**Última actualización:** Enero 2025  
**Versión del documento:** 1.0  
**Estado:** Activo
