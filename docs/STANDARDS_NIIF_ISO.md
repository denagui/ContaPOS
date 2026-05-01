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
**Versión del documento:** 2.0  
**Estado:** Activo

---

## 8. Partida Doble Automática (Double-Entry Accounting)

### 8.1 Principio Fundamental
El sistema implementa **partida doble automática** al estilo de SAP, Alegra y QuickBooks Enterprise. Cada transacción financiera genera automáticamente asientos contables balanceados donde:

```
Σ DEBES = Σ HABER
```

**Ventaja Competitiva:** El usuario NO necesita conocimiento contable. El sistema mapea automáticamente operaciones comerciales (ventas, compras, gastos) a cuentas contables según configuración NIIF.

### 8.2 Arquitectura de Asientos Automáticos

#### Tablas Core (`schema.ts`)

```typescript
// Journal Entries (Cabecera de asiento)
export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull(),
  
  // Referencia a la transacción original
  sourceType: text('source_type', { 
    enum: ['sale', 'expense', 'payment', 'payroll', 'adjustment', 'inventory'] 
  }).notNull(),
  sourceId: text('source_id').notNull(), // ID de venta, gasto, etc.
  
  // Clasificación NIIF
  entryType: text('entry_type', {
    enum: ['revenue', 'expense', 'asset', 'liability', 'equity']
  }).notNull(),
  
  // Fecha Epoch 13
  transactionDate: integer('transaction_date', { mode: 'number' }).notNull(),
  postingDate: integer('posting_date', { mode: 'number' }).notNull(),
  
  // Estado
  status: text('status', {
    enum: ['draft', 'posted', 'reversed', 'pending_review']
  }).notNull().default('draft'),
  
  // Totales
  totalDebit: real('total_debit').notNull(),
  totalCredit: real('total_credit').notNull(),
  currency: text('currency', { length: 3 }).notNull().default('CRC'),
  exchangeRate: real('exchange_rate').default(1),
  
  // Auditoría
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  createdBy: text('created_by').notNull(),
  postedAt: integer('posted_at', { mode: 'number' }),
  postedBy: text('posted_by'),
  
  // Reversión
  reversedAt: integer('reversed_at', { mode: 'number' }),
  reversalReason: text('reversal_reason'),
});

// Journal Lines (Movimientos del asiento)
export const journalLines = sqliteTable('journal_lines', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  entryId: text('entry_id').notNull().references(() => journalEntries.id),
  
  // Cuenta contable
  accountCode: text('account_code').notNull(), // Ej: 1105, 4105, 5105
  accountName: text('account_name').notNull(),
  accountType: text('account_type', {
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  }).notNull(),
  
  // Dirección del movimiento
  direction: text('direction', {
    enum: ['debit', 'credit']
  }).notNull(),
  
  // Monto
  amount: real('amount').notNull(),
  amountLC: real('amount_lc').notNull(), // Moneda local (CRC)
  
  // Centro de costos (opcional)
  costCenterId: text('cost_center_id'),
  projectId: text('project_id'),
  
  // Descripción específica de la línea
  description: text('description'),
  
  // Orden dentro del asiento
  lineOrder: integer('line_order').notNull(),
  
  // Auditoría
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
});

// Plan de Cuentas (Chart of Accounts)
export const chartOfAccounts = sqliteTable('chart_of_accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull(),
  
  // Código contable (estructura jerárquica)
  accountCode: text('account_code').notNull(), // Ej: 1.1.05.001
  accountName: text('account_name').notNull(),
  accountType: text('account_type', {
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  }).notNull(),
  
  // Nivel jerárquico (1-5)
  level: integer('level').notNull(),
  parentAccountId: text('parent_account_id'),
  
  // Naturaleza
  nature: text('nature', {
    enum: ['debit', 'credit']
  }).notNull(),
  
  // Categoría NIIF
  niifCategory: text('niif_category'), // Ej: "61", "41", "53"
  
  // Estado
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false), // No editable
  
  // Auditoría
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  modifiedAt: integer('modified_at', { mode: 'number' }),
});

// Mapeo Automático (Reglas de negocio)
export const autoAccountingRules = sqliteTable('auto_accounting_rules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull(),
  
  // Tipo de transacción
  sourceType: text('source_type', {
    enum: ['sale', 'expense', 'payment', 'inventory_adjustment', 'payroll']
  }).notNull(),
  
  // Condición (JSON flexible)
  condition: text('condition', { mode: 'json' }).notNull(),
  /* Ejemplo:
   * {
   *   "field": "category",
   *   "operator": "equals",
   *   "value": "retail_food"
   * }
   */
  
  // Cuentas a usar
  debitAccountId: text('debit_account_id').notNull(),
  creditAccountId: text('credit_account_id').notNull(),
  
  // Prioridad (para múltiples reglas)
  priority: integer('priority').notNull().default(100),
  
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});
```

### 8.3 Flujo de Generación Automática

#### Ejemplo 1: Venta en POS

```typescript
// Cuando se cierra una venta, el sistema genera:

// ASIENTO AUTOMÁTICO #12345
// Fuente: Sale #9876
// Fecha: 2024-01-15 14:30:00

JournalEntry {
  sourceType: 'sale',
  sourceId: '9876',
  totalDebit: 11300,
  totalCredit: 11300,
}

// Líneas del asiento:
JournalLine [
  {
    accountCode: '1105.001',  // Caja / Bancos
    accountName: 'Caja Principal',
    direction: 'debit',
    amount: 11300,
    description: 'Venta #9876 - Contado',
  },
  {
    accountCode: '4105.001',  // Ingresos por ventas
    accountName: 'Ventas de Mercancías',
    direction: 'credit',
    amount: 10000,
    description: 'Venta #9876 - Subtotal',
  },
  {
    accountCode: '2105.001',  // IVA por pagar
    accountName: 'IVA Cobrado',
    direction: 'credit',
    amount: 1300,
    description: 'Venta #9876 - IVA 13%',
  }
]

// ASIENTO AUTOMÁTICO #12346 (Costo de Ventas)
// Se genera simultáneamente para registrar salida de inventario

JournalEntry {
  sourceType: 'sale',
  sourceId: '9876',
  entryType: 'expense',
  totalDebit: 7000,
  totalCredit: 7000,
}

JournalLine [
  {
    accountCode: '5105.001',  // Costo de ventas
    accountName: 'Costo de Mercancías Vendidas',
    direction: 'debit',
    amount: 7000,
    description: 'Costo Venta #9876',
  },
  {
    accountCode: '1405.001',  // Inventarios
    accountName: 'Mercancías',
    direction: 'credit',
    amount: 7000,
    description: 'Salida Inventarios Venta #9876',
  }
]
```

#### Ejemplo 2: Registro de Gasto

```typescript
// Usuario registra gasto de compra de insumos

JournalEntry {
  sourceType: 'expense',
  sourceId: 'EXP-2024-001',
  totalDebit: 5650,
  totalCredit: 5650,
}

JournalLine [
  {
    accountCode: '5105.002',  // Gastos de insumos
    accountName: 'Insumos Operativos',
    direction: 'debit',
    amount: 5000,
    description: 'Compra insumos - Factura F-001',
  },
  {
    accountCode: '1105.001',  // Caja / Bancos
    accountName: 'Banco Nacional',
    direction: 'credit',
    amount: 5650,
    description: 'Pago compra insumos',
  },
  {
    accountCode: '1108.001',  // Crédito fiscal IVA
    accountName: 'IVA Compras',
    direction: 'debit',
    amount: 650,
    description: 'IVA Crédito Fiscal',
  }
]
```

### 8.4 Motor de Reglas Automáticas

```typescript
// src/lib/server/services/accounting/auto-accounting-engine.ts

interface AutoAccountingRule {
  sourceType: 'sale' | 'expense' | 'payment' | 'inventory';
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'in';
    value: any;
  };
  debitAccountId: string;
  creditAccountId: string;
  priority: number;
}

class AutoAccountingEngine {
  /**
   * Genera asiento contable automático basado en la transacción
   */
  async generateJournalEntry(transaction: any): Promise<JournalEntry> {
    // 1. Obtener reglas aplicables
    const rules = await this.getApplicableRules(transaction);
    
    // 2. Construir líneas del asiento
    const lines: JournalLine[] = [];
    
    for (const rule of rules) {
      const linePair = await this.createLinePair(transaction, rule);
      lines.push(...linePair);
    }
    
    // 3. Validar que cuadre (debe == haber)
    const totalDebit = sum(lines.filter(l => l.direction === 'debit').map(l => l.amount));
    const totalCredit = sum(lines.filter(l => l.direction === 'credit').map(l => l.amount));
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Asiento no cuadra: Debe=${totalDebit}, Haber=${totalCredit}`);
    }
    
    // 4. Crear asiento
    return {
      sourceType: transaction.type,
      sourceId: transaction.id,
      transactionDate: transaction.date,
      postingDate: transaction.postingDate || transaction.date,
      status: 'posted', // Auto-posted
      totalDebit,
      totalCredit,
      lines,
    };
  }
  
  /**
   * Obtiene reglas aplicables según tipo y condiciones
   */
  private async getApplicableRules(transaction: any): Promise<AutoAccountingRule[]> {
    // Query a auto_accounting_rules con filtros:
    // - sourceType match
    // - condition match
    // - order by priority ASC
    // Retornar reglas activas
  }
}
```

### 8.5 Ventajas Competitivas

| Característica | ContaPOS | Sistemas Tradicionales |
|---------------|----------|----------------------|
| **Configuración** | Automática por defecto | Requiere contador experto |
| **Errores** | Validación en tiempo real | Errores manuales frecuentes |
| **Velocidad** | Instantáneo (ms) | Horas/días de digitación |
| **Trazabilidad** | Link directo transacción → asiento | Búsqueda manual |
| **NIIF** | Nativo desde el diseño | Módulos adicionales costosos |
| **Costo** | Incluido en suscripción | Licencias separadas ($$$) |

---

## 9. Motor de Sugerencias Inteligentes (AI-Powered Insights)

### 9.1 Visión General
Sistema de recomendaciones basado en análisis de datos históricos de ventas, inventario, costos y comportamiento del cliente. Similar a las funcionalidades de Square Insights, Shopify Analytics y Toast IQ.

### 9.2 Arquitectura del Motor

```typescript
// src/lib/server/services/analytics/insights-engine.ts

interface Insight {
  id: string;
  type: 'promotion' | 'restock' | 'pricing' | 'waste_reduction' | 'upsell';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dataPoints: DataPoint[];
  suggestedAction: string;
  estimatedImpact: {
    revenue?: number;
    costSavings?: number;
    marginImprovement?: number;
  };
  expiresAt?: number; // Epoch 13 - para sugerencias time-sensitive
}

class InsightsEngine {
  /**
   * Analiza datos y genera sugerencias para el administrador
   */
  async generateInsights(organizationId: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // 1. Análisis de productos estancados
    insights.push(...await this.detectStagnantProducts(organizationId));
    
    // 2. Optimización de precios por margen
    insights.push(...await this.optimizePricing(organizationId));
    
    // 3. Sugerencias de combos basadas en asociación
    insights.push(...await this.suggestBundles(organizationId));
    
    // 4. Alertas de reposición predictiva
    insights.push(...await this.predictRestockNeeds(organizationId));
    
    // 5. Happy Hours dinámicos
    insights.push(...await this.suggestHappyHours(organizationId));
    
    // 6. Reducción de desperdicios (perecederos)
    insights.push(...await this.reduceWaste(organizationId));
    
    // 7. Upselling opportunities
    insights.push(...await this.identifyUpsellOpportunities(organizationId));
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}
```

### 9.3 Tipos de Sugerencias por Industria

#### 🏪 Retail / Tiendas

```typescript
// 1. Productos Estancados (Slow-Moving Inventory)
{
  type: 'promotion',
  priority: 'high',
  title: '5 productos sin ventas en 30 días',
  description: 'Estos productos tienen inventario pero cero ventas:',
  dataPoints: [
    { product: 'Camisa Talla M', stock: 45, daysNoSale: 32, investedCapital: 450000 },
    { product: 'Zapatos Modelo X', stock: 23, daysNoSale: 45, investedCapital: 1150000 },
  ],
  suggestedAction: 'Crear promoción "Lleva 2 paga 1" o descuento del 40%',
  estimatedImpact: {
    revenue: 800000, // Recuperación de capital
    marginImprovement: -15, // Margen reducido pero capital liberado
  },
  expiresAt: now() + (7 * 24 * 60 * 60 * 1000), // 7 días
}

// 2. Combos Sugeridos (Market Basket Analysis)
{
  type: 'promotion',
  priority: 'medium',
  title: 'Combo frecuente: Café + Panqueques',
  description: 'El 73% de clientes que compran café también compran panqueques entre 7-9 AM',
  dataPoints: [
    { productA: 'Café Americano', productB: 'Panqueques', coOccurrence: 0.73, avgTicket: 4500 },
  ],
  suggestedAction: 'Crear combo "Desayuno Power" con 10% descuento',
  estimatedImpact: {
    revenue: 150000, // Incremento ticket promedio
    marginImprovement: 5,
  },
}

// 3. Alerta de Reposición Inteligente
{
  type: 'restock',
  priority: 'high',
  title: 'Reponer Coca-Cola en 3 días',
  description: 'Basado en tendencia de ventas (12 unidades/día), el stock se agotará el 18 Ene',
  dataPoints: [
    { product: 'Coca-Cola 355ml', currentStock: 36, dailyVelocity: 12, daysUntilStockout: 3 },
  ],
  suggestedAction: 'Ordenar 100 unidades hoy para mantener nivel óptimo',
  estimatedImpact: {
    revenue: 600000, // Ventas evitadas por stockout
  },
}
```

#### 🍞 Panaderías

```typescript
// 1. Reducción de Desperdicios (Perecederos)
{
  type: 'waste_reduction',
  priority: 'high',
  title: 'Pan fresco: 25 unidades cerca de expirar',
  description: 'El pan horneado ayer tiene 24h y debe venderse hoy',
  dataPoints: [
    { product: 'Pan Francés', quantity: 25, bakedAt: now() - (24 * 60 * 60 * 1000), expiresAt: now() + (12 * 60 * 60 * 1000) },
  ],
  suggestedAction: 'Aplicar descuento 50% de 4 PM a cierre',
  estimatedImpact: {
    revenue: 62500, // Recuperar 50% vs perder 100%
    costSavings: 62500,
  },
  expiresAt: now() + (6 * 60 * 60 * 1000), // Válido por 6 horas
}

// 2. Happy Hour Dinámico
{
  type: 'promotion',
  priority: 'medium',
  title: 'Hora pico detectada: 3-5 PM (baja venta)',
  description: 'Las ventas caen 40% entre 3-5 PM los martes',
  dataPoints: [
    { timeSlot: '15:00-17:00', avgSales: 45000, peakSales: 120000, dropPercentage: 62 },
  ],
  suggestedAction: 'Promoción "Merienda Dulce": Café + Postre ₡2500',
  estimatedImpact: {
    revenue: 80000, // Incremento en hora baja
    marginImprovement: 8,
  },
}

// 3. Precios Óptimos por Producto
{
  type: 'pricing',
  priority: 'medium',
  title: 'Ajuste de precio: Tortas Personalizadas',
  description: 'Producto con alta demanda (45/mes) y margen 65%. Competidores venden a ₡25000+',
  dataPoints: [
    { product: 'Torta Chocolate', currentPrice: 18000, avgCost: 6300, margin: 65, monthlySales: 45, competitorAvg: 25000 },
  ],
  suggestedAction: 'Subir precio a ₡22000 (margen 71%, aún competitivo)',
  estimatedImpact: {
    revenue: 180000, // +₡4000 × 45 unidades
    marginImprovement: 6, // +6 puntos porcentuales
  },
}
```

#### 🍽️ Restaurantes

```typescript
// 1. Upselling Automático
{
  type: 'upsell',
  priority: 'high',
  title: 'Sugerir bebidas premium en mesas 5-10',
  description: 'Mesas con ticket >₡50000 solo piden bebidas básicas el 80% de las veces',
  dataPoints: [
    { segment: 'Ticket >₡50k', upsellRate: 0.20, avgBeveragePrice: 3000, premiumPrice: 8000 },
  ],
  suggestedAction: 'Capacitar meseros para sugerir vino/cerveza artesanal',
  estimatedImpact: {
    revenue: 450000, // 50% de conversión × 30 mesas × ₡5000 adicional
    marginImprovement: 12,
  },
}

// 2. Optimización de Menú (Platos Rentables vs Populares)
{
  type: 'pricing',
  priority: 'medium',
  title: 'Revisar menú: 3 platos populares pero poco rentables',
  description: 'Estos platos se venden mucho pero tienen margen <20%',
  dataPoints: [
    { dish: 'Pizza Margarita', monthlySales: 180, price: 12000, cost: 9800, margin: 18 },
    { dish: 'Hamburguesa Clásica', monthlySales: 220, price: 8500, cost: 7200, margin: 15 },
  ],
  suggestedAction: 'Renegociar proveedores o ajustar precios +8%',
  estimatedImpact: {
    revenue: 320000, // Incremento por ajuste de precio
    marginImprovement: 10,
  },
}

// 3. Staffing Óptimo por Hora
{
  type: 'optimization',
  priority: 'low',
  title: 'Sobrestaffing detectado: Lunes 2-5 PM',
  description: 'Tienes 4 empleados pero promedio de 8 mesas/hora',
  dataPoints: [
    { day: 'Lunes', timeSlot: '14:00-17:00', avgTables: 8, currentStaff: 4, optimalStaff: 2 },
  ],
  suggestedAction: 'Reducir a 2 empleados en ese turno (ahorro ₡180000/mes)',
  estimatedImpact: {
    costSavings: 180000, // Reducción horas laborales
  },
}
```

### 9.4 Algoritmos Clave

#### Matrix de Asociación (Market Basket Analysis)

```typescript
/**
 * Calcula probabilidad de que producto B se compre con producto A
 * Usa el algoritmo Apriori simplificado
 */
function calculateAssociationRules(sales: Sale[]): AssociationRule[] {
  const itemsets = new Map<string, number>();
  const pairs = new Map<string, number>();
  
  // Contar frecuencias
  for (const sale of sales) {
    const items = sale.items.map(i => i.productId).sort();
    
    for (const item of items) {
      itemsets.set(item, (itemsets.get(item) || 0) + 1);
    }
    
    // Pares
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const pairKey = `${items[i]}|${items[j]}`;
        pairs.set(pairKey, (pairs.get(pairKey) || 0) + 1);
      }
    }
  }
  
  // Calcular confianza: P(B|A) = P(A∩B) / P(A)
  const rules: AssociationRule[] = [];
  for (const [pairKey, count] of pairs.entries()) {
    const [itemA, itemB] = pairKey.split('|');
    const confidence = count / (itemsets.get(itemA) || 1);
    const lift = confidence / ((itemsets.get(itemB) || 1) / sales.length);
    
    if (confidence > 0.5 && lift > 1.2) { // Umbrales mínimos
      rules.push({
        antecedent: itemA,
        consequent: itemB,
        confidence,
        lift,
        support: count / sales.length,
      });
    }
  }
  
  return rules.sort((a, b) => b.lift - a.lift);
}
```

#### Predicción de Stockout (Regresión Lineal Simple)

```typescript
/**
 * Predice cuándo se agotará un producto basado en velocidad de venta
 */
function predictStockout(product: Product, salesHistory: Sale[]): StockoutPrediction {
  // Últimos 30 días
  const last30Days = salesHistory.filter(
    s => s.date > Date.now() - (30 * 24 * 60 * 60 * 1000)
  );
  
  const totalSold = last30Days.reduce((sum, sale) => {
    const item = sale.items.find(i => i.productId === product.id);
    return sum + (item?.quantity || 0);
  }, 0);
  
  const dailyVelocity = totalSold / 30;
  const daysUntilStockout = Math.floor(product.stock / dailyVelocity);
  
  return {
    productId: product.id,
    currentStock: product.stock,
    dailyVelocity,
    daysUntilStockout,
    recommendedOrderQuantity: Math.ceil(dailyVelocity * 15), // 15 días de buffer
    urgency: daysUntilStockout < 3 ? 'high' : daysUntilStockout < 7 ? 'medium' : 'low',
  };
}
```

### 9.5 UI de Sugerencias (Dashboard)

```svelte
<!-- src/routes/dashboard/+page.svelte -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Badge, Button } from '$lib/components';
  
  let insights = $state<Insight[]>([]);
  let loading = $state(true);
  
  onMount(async () => {
    const res = await fetch('/api/analytics/insights');
    insights = await res.json();
    loading = false;
  });
  
  function dismissInsight(id: string) {
    insights = insights.filter(i => i.id !== id);
    // Llamar API para registrar dismiss
  }
  
  function acceptInsight(insight: Insight) {
    // Redirigir a crear promoción/orden/etc.
    console.log('Accepting:', insight);
  }
</script>

<div class="p-6 space-y-6">
  <h1 class="text-2xl font-bold">💡 Sugerencias Inteligentes</h1>
  
  {#if loading}
    <div class="animate-pulse">Cargando sugerencias...</div>
  {:else if insights.length === 0}
    <Card>
      <p class="text-gray-500">¡Todo está optimizado! No hay sugerencias pendientes.</p>
    </Card>
  {:else}
    <div class="grid gap-4 md:grid-cols-2">
      {#each insights as insight (insight.id)}
        <Card class="border-l-4 {insight.priority === 'high' ? 'border-red-500' : 'border-blue-500'}">
          <div class="flex justify-between items-start">
            <div>
              <Badge variant={insight.priority}>{insight.priority}</Badge>
              <h3 class="text-lg font-semibold mt-2">{insight.title}</h3>
              <p class="text-gray-600 text-sm mt-1">{insight.description}</p>
              
              {#if insight.dataPoints}
                <div class="mt-3 bg-gray-50 p-3 rounded text-sm">
                  {#each insight.dataPoints as dp}
                    <div class="flex justify-between">
                      <span>{dp.product || dp.timeSlot}</span>
                      <span class="font-medium">{dp.quantity || dp.value}</span>
                    </div>
                  {/each}
                </div>
              {/if}
              
              {#if insight.estimatedImpact}
                <div class="mt-3 text-xs text-green-600">
                  Impacto estimado: 
                  {#if insight.estimatedImpact.revenue}
                    +₡{(insight.estimatedImpact.revenue / 1000).toFixed(0)}k ingresos
                  {/if}
                  {#if insight.estimatedImpact.costSavings}
                    +₡{(insight.estimatedImpact.costSavings / 1000).toFixed(0)}k ahorro
                  {/if}
                </div>
              {/if}
            </div>
            
            {#if insight.expiresAt}
              <div class="text-xs text-orange-500">
                Expira en {Math.ceil((insight.expiresAt - Date.now()) / (60 * 60 * 1000))}h
              </div>
            {/if}
          </div>
          
          <div class="flex gap-2 mt-4">
            <Button onClick={() => acceptInsight(insight)} variant="primary">
              Aplicar
            </Button>
            <Button onClick={() => dismissInsight(insight.id)} variant="secondary">
              Descartar
            </Button>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
```

### 9.6 Endpoints API

```typescript
// src/routes/api/analytics/insights/+server.ts

export async function GET({ locals }) {
  const { organizationId } = locals.user;
  
  const engine = new InsightsEngine();
  const insights = await engine.generateInsights(organizationId);
  
  return json({ insights });
}

// Dismiss suggestion
export async function POST({ request, locals }) {
  const { insightId, action } = await request.json();
  
  await db.insert(insightActions).values({
    organizationId: locals.user.organizationId,
    insightId,
    action, // 'dismissed' | 'accepted' | 'ignored'
    actedAt: Date.now(),
  });
  
  return json({ success: true });
}
```

---

## 10. Roadmap de Implementación

### Fase 3A: Partida Doble (Q1 2025)
- [ ] Crear tablas `journal_entries`, `journal_lines`, `chart_of_accounts`
- [ ] Migrar plan de cuentas genérico NIIF
- [ ] Implementar `AutoAccountingEngine`
- [ ] Integrar con `sale.service.ts` y `expense.service.ts`
- [ ] UI de consulta de asientos (`/accounting/journal`)
- [ ] Reportes: Balance de Comprobación, Libro Diario

### Fase 3B: Motor de Sugerencias (Q2 2025)
- [ ] Implementar algoritmos de asociación (Apriori)
- [ ] Sistema de predicción de stockout
- [ ] Dashboard de insights (`/dashboard/insights`)
- [ ] Notificaciones push/email para alertas críticas
- [ ] A/B testing de promociones sugeridas

### Fase 3C: Advanced Analytics (Q3 2025)
- [ ] Machine Learning para forecasting de demanda
- [ ] Segmentación de clientes (RFM Analysis)
- [ ] Pricing dinámico basado en elasticidad
- [ ] Integración con WhatsApp Business para promociones

---

## 11. Referencias Competitivas

| Sistema | Feature Equivalente | Diferenciador ContaPOS |
|---------|---------------------|------------------------|
| **SAP Business One** | Partida doble automática | 100x más económico, cloud-native |
| **Alegra** | Contabilidad automatizada | Multi-moneda nativo, NIIF desde día 1 |
| **Square Insights** | Sugerencias de ventas | Específico para LATAM (Hacienda, NIIF) |
| **Shopify Analytics** | Reportes de productos | Integrado con facturación electrónica CR |
| **Toast IQ** | Optimización restaurantes | Soporte multi-negocio (retail, servicios, food) |

---

## 12. Glosario de Términos

- **Partida Doble**: Sistema contable donde cada transacción afecta al menos dos cuentas, manteniendo la ecuación patrimonial equilibrada.
- **Journal Entry**: Asiento contable que registra una transacción completa.
- **Chart of Accounts**: Plan de cuentas estructurado jerárquicamente.
- **Auto-Accounting**: Reglas que mapean automáticamente operaciones a cuentas contables.
- **Market Basket Analysis**: Técnica para descubrir asociaciones entre productos comprados juntos.
- **Stockout**: Situación donde el inventario se agota completamente.
- **Lift**: Medida de qué tan mucho más probable es que B se compre dado A, vs probabilidad base de B.
