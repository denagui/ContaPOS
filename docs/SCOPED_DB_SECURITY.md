# ContaPOS - Arquitectura Multi-Tenant y Seguridad de Datos

## 1. ScopedDB: Aislamiento de Datos por Organización

### 1.1 Principio Fundamental
**Regla de Oro:** NINGUNA consulta puede acceder a datos de otra organización sin un filtro explícito de `organizationId`.

### 1.2 Implementación en Schema
Todas las tablas transaccionales incluyen:
```typescript
organizationId: text('organization_id').references(() => organizations.id)
```

**Tablas con Scope:**
- ✅ `sales` - Ventas y facturación
- ✅ `expenses` - Gastos operativos
- ✅ `revenues` - Ingresos diversos
- ✅ `contacts` - Clientes y proveedores
- ✅ `products` - Catálogo de productos
- ✅ `journalEntries` - Asientos contables
- ✅ `journalLines` - Movimientos contables
- ✅ `aiSuggestions` - Sugerencias de IA
- ✅ `auditLogsEnhanced` - Auditoría
- ✅ `aiDecisionsLog` - Decisiones de IA
- ✅ `accountingPeriods` - Períodos contables

**Tablas Globales (sin scope):**
- `users` - Usuarios del sistema (multi-org)
- `branches` - Sucursales (pueden compartirse)
- `categories` - Categorías de productos
- `settings` - Configuraciones globales

### 1.3 Patrón de Consulta Segura

```typescript
// ❌ INCORRECTO - Vulnerable a fuga de datos
const sales = await db.select().from(sales);

// ✅ CORRECTO - Scoped por organización
const sales = await db
  .select()
  .from(sales)
  .where(eq(sales.organizationId, user.organizationId));
```

### 1.4 Middleware de Seguridad
Implementar middleware que inyecte automáticamente el `organizationId`:

```typescript
// src/lib/server/middleware/scoped-db.ts
export async function scopedQuery<T>(
  query: Promise<T[]>,
  organizationId: string
): Promise<T[]> {
  const results = await query;
  
  // Validación post-query (defensa en profundidad)
  if (results.some(r => r.organizationId !== organizationId)) {
    throw new Error('Violación de scope: acceso a datos de otra organización');
  }
  
  return results;
}
```

---

## 2. Gestión de Contactos: Cliente + Proveedor Unificados

### 2.1 Enfoque Profesional (SAP/Alegra/Oracle)
**Problema tradicional:** Tablas separadas `customers` y `suppliers` crean duplicación cuando una empresa es ambos.

**Solución ContaPOS:** Tabla unificada `contacts` con campo `contactType`.

### 2.2 Schema Optimizado
```typescript
export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id'), // SCOPED
  
  // TIPO DE CONTACTO
  contactType: text('contact_type', { 
    enum: ['customer', 'supplier', 'both'] 
  }).notNull(),
  
  // INFORMACIÓN ÚNICA (no duplicada)
  name: text('name').notNull(),
  documentNumber: text('document_number'), // Cédula/RUC
  email: text('email'),
  phone: text('phone'),
  
  // CRÉDITO (como cliente)
  creditLimit: real('credit_limit').default(0),
  currentBalance: real('current_balance').default(0),
  
  // COMPRAS (como proveedor)
  vendorCode: text('vendor_code'), // Código interno de proveedor
  
  active: integer('active').default(1),
});
```

### 2.3 Casos de Uso

#### Caso A: Solo Cliente
```typescript
await db.insert(contacts).values({
  organizationId: 'org_123',
  contactType: 'customer',
  name: 'Juan Pérez',
  creditLimit: 500000,
});
```

#### Caso B: Solo Proveedor
```typescript
await db.insert(contacts).values({
  organizationId: 'org_123',
  contactType: 'supplier',
  name: 'Distribuidora XYZ',
  vendorCode: 'PROV-001',
});
```

#### Caso C: Ambos (Cliente y Proveedor)
```typescript
await db.insert(contacts).values({
  organizationId: 'org_123',
  contactType: 'both',
  name: 'Empresa ABC S.A.',
  creditLimit: 1000000,  // Como cliente
  vendorCode: 'PROV-050', // Como proveedor
});
```

### 2.4 Consultas Filtradas

```typescript
// Solo clientes
const customers = await db
  .select()
  .from(contacts)
  .where(
    and(
      eq(contacts.organizationId, orgId),
      inArray(contacts.contactType, ['customer', 'both'])
    )
  );

// Solo proveedores
const suppliers = await db
  .select()
  .from(contacts)
  .where(
    and(
      eq(contacts.organizationId, orgId),
      inArray(contacts.contactType, ['supplier', 'both'])
    )
  );

// Contacto específico (puede ser ambos)
const contact = await db
  .select()
  .from(contacts)
  .where(
    and(
      eq(contacts.id, contactId),
      eq(contacts.organizationId, orgId)
    )
  );

// Verificar si es cliente
const isCustomer = ['customer', 'both'].includes(contact.contactType);

// Verificar si es proveedor
const isSupplier = ['supplier', 'both'].includes(contact.contactType);
```

### 2.5 Ventajas Competitivas

| Feature | Sistema Tradicional | ContaPOS |
|---------|-------------------|----------|
| Duplicación de datos | Alta (misma empresa en 2 tablas) | Nula (registro único) |
| Historial unificado | No (ventas y compras separadas) | Sí (todo en uno) |
| Límite de crédito vs saldo proveedor | Difícil de conciliar | Automático |
| Reporte 360° | Complejo | Nativo |
| Migración de datos | Riesgosa | Simplificada |

---

## 3. Cierres Contables y Bloqueo de Períodos

### 3.1 Normativa NIIF/IFRS
**Requisito:** Una vez cerrado un período contable, NO se pueden modificar transacciones sin auditoría.

### 3.2 Estados de Período

```typescript
enum AccountingPeriodStatus {
  OPEN = 'open',           // Período activo, escritura completa
  SOFT_CLOSE = 'soft_close', // Solo lectura, cambios requieren aprobación
  CLOSED = 'closed',       // Cierre contable, solo asientos de ajuste
  LOCKED = 'locked'        // Bloqueo total por auditoría/normativa
}
```

### 3.3 Matriz de Permisos

| Estado | Crear | Modificar | Eliminar | Requiere Aprobación |
|--------|-------|-----------|----------|---------------------|
| `open` | ✅ Sí | ✅ Sí | ⚠️ Con rol admin | ❌ No |
| `soft_close` | ❌ No | ⚠️ Solo con aprobación | ❌ No | ✅ Sí |
| `closed` | ⚠️ Solo ajustes | ❌ No | ❌ No | ✅ Sí (contador) |
| `locked` | ❌ No | ❌ No | ❌ No | 🔒 Bloqueo total |

### 3.4 Implementación de Validación

```typescript
// src/lib/server/services/accounting/period-validator.ts

export async function validateTransactionDate(
  organizationId: string,
  transactionDate: number, // Epoch 13
  operation: 'create' | 'update' | 'delete'
): Promise<{ valid: boolean; reason?: string }> {
  
  // Encontrar el período contable aplicable
  const period = await db
    .select()
    .from(accountingPeriods)
    .where(
      and(
        eq(accountingPeriods.organizationId, organizationId),
        lte(accountingPeriods.startDate, transactionDate),
        gte(accountingPeriods.endDate, transactionDate)
      )
    )
    .get();
  
  if (!period) {
    return { 
      valid: false, 
      reason: 'No existe un período contable definido para esta fecha' 
    };
  }
  
  // Validar según estado del período
  switch (period.status) {
    case 'open':
      return { valid: true };
      
    case 'soft_close':
      if (operation === 'create') {
        return { valid: false, reason: 'Período en cierre parcial. No se permiten nuevas transacciones.' };
      }
      if (!period.requiresApproval) {
        return { valid: true };
      }
      return { 
        valid: false, 
        reason: 'Se requiere aprobación de contador para modificar este período',
        requiresApproval: true 
      };
      
    case 'closed':
      if (operation === 'delete') {
        return { valid: false, reason: 'No se pueden eliminar transacciones de períodos cerrados' };
      }
      return { 
        valid: false, 
        reason: 'Período cerrado. Solo se permiten asientos de ajuste mediante proceso especial' 
      };
      
    case 'locked':
      return { 
        valid: false, 
        reason: 'Período bloqueado por auditoría. Ninguna operación permitida' 
      };
      
    default:
      return { valid: false, reason: 'Estado de período desconocido' };
  }
}
```

### 3.5 Flujo de Cierre Contable

```typescript
// 1. Validar que no haya transacciones pendientes
async function validatePeriodClose(periodId: string): Promise<void> {
  const pendingTransactions = await db
    .select({ count: sql<number>`count(*)` })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.periodId, periodId),
        eq(journalEntries.isPosted, 0) // Borradores
      )
    );
  
  if (pendingTransactions[0].count > 0) {
    throw new Error(`Hay ${pendingTransactions[0].count} transacciones pendientes de contabilizar`);
  }
}

// 2. Ejecutar cierre
async function closeAccountingPeriod(
  periodId: string,
  userId: string,
  reason: string
): Promise<void> {
  await validatePeriodClose(periodId);
  
  await db
    .update(accountingPeriods)
    .set({
      status: 'closed',
      closedBy: userId,
      closedAt: Date.now(),
      closedReason: reason,
      canCreate: 0,
      canModify: 0,
      canDelete: 0,
    })
    .where(eq(accountingPeriods.id, periodId));
  
  // Registrar en auditoría
  await auditLogger.log({
    action: 'PERIOD_CLOSED',
    resourceType: 'accounting_period',
    resourceId: periodId,
    userId,
    newValue: { status: 'closed', closedAt: Date.now() },
    securityLevel: 'critical',
  });
}
```

### 3.6 Asientos de Ajuste en Períodos Cerrados

Para realizar ajustes en períodos cerrados:

1. **Crear asiento de ajuste** en el período actual
2. **Referenciar** el período cerrado
3. **Requerir aprobación** de contador/auditor
4. **Registrar** en `aiDecisionsLog` si es automatizado

```typescript
// Ejemplo: Asiento de ajuste post-cierre
await db.insert(journalEntries).values({
  organizationId: 'org_123',
  entryNumber: 'AJUSTE-2024-001',
  documentType: 'adjustment',
  description: 'Ajuste por error en cierre Q1-2024',
  isPosted: 0, // Requiere aprobación
  requiresApproval: 1,
  referencePeriodId: 'period_q1_2024', // Período cerrado que se ajusta
});
```

---

## 4. Capa de Auditoría Reforzada

### 4.1 Tabla `auditLogsEnhanced`

```typescript
export const auditLogsEnhanced = sqliteTable('audit_logs_enhanced', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id'), // SCOPED
  userId: text('user_id'),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, LOGIN, EXPORT
  resourceType: text('resource_type').notNull(), // 'sale', 'product', etc.
  resourceId: text('resource_id'),
  oldValue: text('old_value'), // JSON
  newValue: text('new_value'), // JSON
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  sessionId: text('session_id'),
  securityLevel: text('security_level', {
    enum: ['info', 'warning', 'critical', 'audit']
  }),
  isAutomated: integer('is_automated'), // Acción de IA/sistema
  aiDecisionId: text('ai_decision_id'),
  hash: text('hash'), // SHA-256 para integridad
  previousHash: text('previous_hash'), // Blockchain-like chaining
  createdAt: integer('created_at'),
});
```

### 4.2 Hash Chain para Integridad

Cada log incluye hash del anterior para detectar manipulaciones:

```typescript
async function createAuditLog(log: AuditLogInput): Promise<void> {
  // Obtener último hash
  const lastLog = await db
    .select({ hash: auditLogsEnhanced.hash })
    .from(auditLogsEnhanced)
    .where(eq(auditLogsEnhanced.organizationId, log.organizationId))
    .orderBy(desc(auditLogsEnhanced.createdAt))
    .limit(1)
    .get();
  
  // Calcular hash actual
  const content = JSON.stringify({
    ...log,
    previousHash: lastLog?.hash || null,
    timestamp: Date.now(),
  });
  
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(content)
  );
  
  const hashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Insertar log
  await db.insert(auditLogsEnhanced).values({
    ...log,
    hash: hashHex,
    previousHash: lastLog?.hash || null,
  });
}
```

### 4.3 Eventos Críticos a Auditar

| Evento | Security Level | Requiere Revisión |
|--------|---------------|-------------------|
| Login fallido (3+ intentos) | `warning` | ❌ No |
| Cambio de contraseña | `audit` | ❌ No |
| Eliminación de venta | `critical` | ✅ Sí |
| Modificación de período cerrado | `critical` | ✅ Sí |
| Exportación masiva de datos | `warning` | ⚠️ Opcional |
| Cambio de configuración fiscal | `audit` | ✅ Sí |
| Decisión de IA con impacto financiero | `audit` | ✅ Sí |

---

## 5. Checklist de Implementación

### 5.1 Backend
- [ ] Agregar `organizationId` a todas las tablas transaccionales
- [ ] Crear middleware que inyecte automáticamente `organizationId` en consultas
- [ ] Implementar validador de períodos contables
- [ ] Crear servicio de auditoría con hash chain
- [ ] Actualizar todos los servicios CRUD para incluir filtros de scope

### 5.2 Frontend
- [ ] Mostrar indicador de período contable activo en UI
- [ ] Bloquear botones de editar/eliminar en períodos cerrados
- [ ] Agregar vista de "Auditoría" con logs filtrados por usuario/recurso
- [ ] Implementar búsqueda de contactos que filtre por tipo (customer/supplier/both)

### 5.3 Migración de Datos
- [ ] Script para agregar `organizationId` a datos existentes
- [ ] Migrar tablas `customers` y `suppliers` a `contacts` unificadas
- [ ] Crear índices en `organizationId` para performance
- [ ] Validar que no haya fugas de datos entre organizaciones

---

## 6. Referencias

- **NIIF/IFRS:** Norma Internacional de Información Financiera para PYMES
- **ISO 27001:** Seguridad de la Información
- **ISO 27701:** Privacidad de Datos (PIMS)
- **ISO 42001:** Gestión de Sistemas de IA
- **SAP Business One:** Manejo de socios de negocio (BP) unificados
- **Alegra:** Contabilidad automática con períodos fiscales
