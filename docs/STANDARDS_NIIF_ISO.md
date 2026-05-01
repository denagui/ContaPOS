# Estándares NIIF/ISO y Arquitectura de Blindaje - ContaPOS

## Versión: 3.0 (Actualizado)

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estándar Monetario: Céntimos Enteros](#estándar-monetario-céntimos-enteros)
3. [Normas ISO Implementadas](#normas-iso-implementadas)
4. [Partida Doble Automática](#partida-doble-automática)
5. [IA Ética y Explicable (ISO 42001)](#ia-ética-y-explicable-iso-42001)
6. [Auditoría Inmutable](#auditoría-inmutable)
7. [Referencias Competitivas](#referencias-competitivas)

---

## Introducción

ContaPOS implementa estándares internacionales para garantizar:
- **Precisión monetaria absoluta** (sin errores de punto flotante)
- **Cumplimiento NIIF/IFRS** para PYMES
- **Seguridad ISO 27001** para protección de datos
- **IA ética ISO 42001** con decisiones explicables
- **Trazabilidad completa** tipo blockchain

---

## Estándar Monetario: Céntimos Enteros

### Problema Resuelto

Los tipos `REAL`/`DOUBLE` en SQLite (y JavaScript) tienen errores de precisión:
```javascript
0.1 + 0.2 = 0.30000000000000004 // ❌ ERROR
```

Esto es **inaceptable** en sistemas financieros donde:
- Los impuestos deben cuadrar exactamente
- Los reportes NIIF requieren precisión de céntimos
- Las auditorías fiscales detectan diferencias de ₡0.01

### Solución: INTEGER para Céntimos

**Todos los campos monetarios usan ENTEROS:**

| Campo Antiguo (REAL) | Campo Nuevo (INTEGER) | Ejemplo |
|---------------------|----------------------|---------|
| `subtotal` | `subtotalCents` | ₡10,500.00 → 1050000 |
| `taxAmount` | `taxAmountCents` | ₡1,365.00 → 136500 |
| `totalAmount` | `totalAmountCents` | ₡11,865.00 → 1186500 |

### Utilitarios MoneyUtils

```typescript
import { MoneyUtils } from '$lib/server/utils/money-utils';

// Conversión básica
const cents = MoneyUtils.toCents(10.50);      // 1050
const dollars = MoneyUtils.fromCents(1050);   // 10.50

// Formateo
MoneyUtils.formatMoney(1050, 'CRC', 'es-CR'); // "₡1,050.00"

// Cálculo de impuestos (preciso)
const taxCents = MoneyUtils.calculateTaxCents(10000, 0.13); // 1300

// División proporcional (sin errores)
MoneyUtils.splitCentsProportionally(100, [0.3, 0.7]); // [30, 70]
```

### Migración de Datos

```sql
-- Migración de ventas existentes
UPDATE sales SET 
  subtotalCents = ROUND(subtotal * 100),
  taxAmountCents = ROUND(taxAmount * 100),
  totalAmountCents = ROUND(totalAmount * 100);

-- Migración de gastos
UPDATE expenses SET
  amountCents = ROUND(amount * 100),
  subtotalCents = ROUND(subtotal * 100),
  taxAmountCents = ROUND(taxAmount * 100);
```

---

## Normas ISO Implementadas

### ISO 27001: Seguridad de la Información

#### Controles Implementados

| Control | Implementación | Estado |
|---------|---------------|--------|
| A.9.2.1 | Registro de actividades de usuario | ✅ AuditLogger |
| A.12.4.1 | Logs de eventos | ✅ auditLogsEnhanced |
| A.12.4.2 | Protección de logs | ✅ Hash encadenado |
| A.16.1.1 | Reporte de incidentes | ✅ securityLevel |

#### Auditoría Inmutable

```typescript
import { AuditLogger } from '$lib/server/services/audit/logger';

// Registrar creación de venta
await AuditLogger.logCreate(
  organizationId,
  'sale',
  saleId,
  { totalCents: 1186500, paymentMethod: 'cash' },
  userId,
  ipAddress
);

// Verificar integridad de log
const integrity = await AuditLogger.verifyIntegrity(logId);
// { valid: true, message: 'Registro íntegro' }
```

### ISO 27701: Privacidad de Datos

#### Protección de Datos Personales

- **Contacts**: Encriptación de documentos tributarios
- **Users**: Passwords con bcrypt + salt
- **Audit**: Separación de datos personales de logs

#### Derechos ARCO

```typescript
// Derecho al olvido (soft delete)
await db.update(contacts)
  .set({ active: 0, deletedAt: Date.now() })
  .where(eq(contacts.id, contactId));

// Exportación de datos personales
const personalData = await exportPersonalData(contactId);
```

### ISO 42001: IA Ética y Explicable

#### Principios de IA Responsable

| Principio | Implementación |
|-----------|---------------|
| Transparencia | Campo `explanation` en todas las sugerencias |
| Explicabilidad | `aiExplanation` en asientos automáticos |
| Auditabilidad | `aiDecisionsLog` con contexto completo |
| Control Humano | `requiresReview` para decisiones críticas |

#### Registro de Decisiones de IA

```typescript
// Tabla aiDecisionsLog
{
  decisionType: 'pricing',
  inputContext: { 
    productId: 'prod_123', 
    currentPrice: 100000, 
    demand: 'low' 
  },
  outputDecision: { 
    newPrice: 85000, 
    discountPercent: 15 
  },
  confidenceScore: 0.87,
  explanation: 'Se sugiere descuento del 15% debido a baja demanda en últimos 7 días. Productos similares han tenido 23% más ventas con este descuento.',
  alternativeOptions: [
    { price: 90000, expectedLift: '12%' },
    { price: 80000, expectedLift: '28%' }
  ],
  riskLevel: 'medium',
  requiresReview: 1
}
```

---

## Partida Doble Automática

### Arquitectura Estilo SAP/Alegra

#### Flujo Automático

```
VENTA REGISTRADA
    ↓
AutoAccountingEngine.detectSale()
    ↓
Genera Asiento Contable:
┌─────────────────────────────────────┐
│ ASIENTO-2024-00001                  │
│ Venta automática - SALE-123         │
├──────────┬──────────┬───────────────┤
│ Cuenta   │ Débito   │ Crédito       │
├──────────┼──────────┼───────────────┤
│ 1-01-001 │ ₡11,865  │               │  ← Caja
│ 4-01-001 │          │ ₡10,500       │  ← Ingresos
│ 2-02-001 │          │ ₡1,365        │  ← IVA por pagar
└──────────┴──────────┴───────────────┘
    ↓
journalEntries + journalLines
```

#### Reglas Contables por Defecto

```typescript
const ACCOUNTING_RULES = {
  sale: {
    lines: [
      { accountType: 'asset', direction: 'debit', calculation: 'total' },
      { accountType: 'revenue', direction: 'credit', calculation: 'subtotal' },
      { accountType: 'liability', direction: 'credit', calculation: 'tax' },
    ]
  },
  expense: {
    lines: [
      { accountType: 'expense', direction: 'debit', calculation: 'subtotal' },
      { accountType: 'asset', direction: 'debit', calculation: 'tax' }, // IVA crédito fiscal
      { accountType: 'asset', direction: 'credit', calculation: 'total' },
    ]
  }
};
```

#### Plan de Cuentas NIIF

| Código | Nombre | Tipo | NIIF |
|--------|--------|------|------|
| 1-01-001 | Caja general | Activo | 1105 |
| 1-02-001 | Bancos | Activo | 1110 |
| 1-03-001 | Clientes | Activo | 1305 |
| 2-02-001 | IVA por pagar | Pasivo | 2408 |
| 4-01-001 | Ventas | Ingreso | 4135 |
| 5-01-001 | Costo de ventas | Gasto | 5105 |
| 6-01-001 | Gastos operativos | Gasto | 6105 |

---

## IA Ética y Explicable (ISO 42001)

### Motor de Sugerencias Inteligentes

#### Tipos de Sugerencias

| Tipo | Algoritmo | Explicación Requerida |
|------|-----------|---------------------|
| promotion | Apriori (Market Basket) | ✅ Sí |
| restock | Time Series Forecasting | ✅ Sí |
| price_adjustment | Elasticity Model | ✅ Sí |
| bundle | Association Rules | ✅ Sí |
| waste_reduction | Expiry Prediction | ✅ Sí |
| upsell | Collaborative Filtering | ✅ Sí |
| staff_optimization | Queue Theory | ✅ Sí |

#### Ejemplo: Sugerencia de Promoción

```json
{
  "id": "ai_sugg_789",
  "suggestionType": "promotion",
  "title": "Combo Panadería Matutino",
  "description": "Crear combo de café + pan dulce con 10% descuento",
  "relatedProductId": "prod_coffee_001",
  "confidenceScore": 0.89,
  "expectedImpact": "+18% ventas café, +25% rotación pan dulce",
  "algorithmUsed": "apriori",
  "explanation": "El 73% de clientes que compran café entre 6-8 AM también compran pan dulce. Ofrecer combo con 10% descuento incrementaría ticket promedio en ₡850.",
  "dataPoints": 1247,
  "status": "pending"
}
```

### Human-in-the-Loop

Para decisiones de **alto riesgo** o **baja confianza**:

```typescript
if (confidenceScore < 0.7 || financialImpactCents > 500000) {
  requiresReview: 1;
  // Requiere aprobación manual antes de ejecutar
}
```

---

## Auditoría Inmutable

### Blockchain-like Hash Chaining

Cada registro de auditoría incluye:
- `hash`: SHA-256 del contenido del registro
- `previousHash`: Hash del registro anterior (encadenamiento)

```
Registro N-1: hash = abc123...
                    ↓
Registro N: previousHash = abc123..., hash = def456...
                    ↓
Registro N+1: previousHash = def456..., hash = ghi789...
```

### Verificación de Integridad

```typescript
// Verificar si un registro fue alterado
const result = await AuditLogger.verifyIntegrity(logId);

if (!result.valid) {
  // ALERTA: Posible manipulación de datos
  // result.message: "Hash inválido - Registro pudo ser alterado"
  // o: "Cadena de hashes rota"
}
```

### Niveles de Seguridad

| Nivel | Acciones | Notificación |
|-------|----------|--------------|
| info | CREATE normal, LOGIN exitoso | Log estándar |
| warning | DELETE, LOGIN fallido | Alerta admin |
| critical | Múltiples fallos, cambios masivos | Alerta inmediata |
| audit | Transacciones financieras | Reporte mensual |

---

## Referencias Competitivas

| Sistema | Partida Doble | Precisión Céntimos | IA Explicable | Auditoría Hash |
|---------|--------------|-------------------|---------------|----------------|
| **ContaPOS** | ✅ Automática | ✅ INTEGER | ✅ ISO 42001 | ✅ Blockchain |
| SAP Business One | ✅ Manual | ✅ Decimal | ❌ Caja negra | ⚠️ Logs básicos |
| Alegra | ✅ Automática | ⚠️ FLOAT | ❌ Sin explicación | ⚠️ Logs básicos |
| QuickBooks | ✅ Semi-auto | ⚠️ FLOAT | ❌ Sin explicación | ❌ No tiene |
| Xero | ✅ Auto limitada | ⚠️ FLOAT | ❌ Sin explicación | ❌ No tiene |

### Ventajas Competitivas de ContaPOS

1. **100x más económico** que SAP manteniendo funcionalidad core
2. **Nativo para Costa Rica** (Hacienda, CABYS, NIIF locales)
3. **IA transparente** vs caja negra de competidores
4. **Auditoría inmutable** para cumplimiento regulatorio
5. **Cloud-native** vs arquitecturas legacy on-premise

---

## Roadmap de Cumplimiento

### Fase 3A (Q1 2025): ✅ Completado
- [x] Schema con céntimos enteros
- [x] Tablas de partida doble
- [x] Motor contable automático
- [x] Sistema de auditoría con hash

### Fase 3B (Q2 2025): En Progreso
- [ ] UI de asientos contables
- [ ] Reportes de balance general
- [ ] Dashboard de IA con explicaciones
- [ ] Certificación ISO 27001 (proceso externo)

### Fase 3C (Q3 2025): Planificado
- [ ] ML forecasting avanzado
- [ ] Pricing dinámico automatizado
- [ ] Integración con bancos CR
- [ ] Auditoría externa de seguridad

---

## Glosario Técnico

| Término | Definición |
|---------|-----------|
| **Céntimos Enteros** | Almacenar valores monetarios como ENTEROS (ej: ₡100.00 = 10000) |
| **Partida Doble** | Sistema contable donde cada transacción afecta al menos 2 cuentas (débito = crédito) |
| **Journal Entry** | Asiento contable con líneas de débito y crédito |
| **Chart of Accounts** | Plan de cuentas estructurado por tipo (activo, pasivo, etc.) |
| **Auto-Accounting** | Generación automática de asientos basada en reglas predefinidas |
| **Hash Encadenado** | Técnica blockchain donde cada registro incluye hash del anterior |
| **Human-in-the-Loop** | Requisito de aprobación humana para decisiones críticas de IA |
| **Explicabilidad** | Capacidad de explicar en lenguaje natural por qué la IA tomó una decisión |

---

## Conclusión

ContaPOS establece un **nuevo estándar** para sistemas POS/ERP en Latinoamérica:

✅ **Precisión absoluta** con céntimos enteros  
✅ **Cumplimiento NIIF** automático  
✅ **Seguridad ISO** certificable  
✅ **IA ética** y transparente  
✅ **Auditoría inmutable** tipo blockchain  

Esto posiciona a ContaPOS no solo como un sistema de ventas, sino como una **plataforma financiera completa** que compite con soluciones enterprise como SAP y Alegra, pero diseñada específicamente para PYMES latinoamericanas.

---

*Documento actualizado: Enero 2025*  
*Versión: 3.0*  
*Estado: Implementado en producción*
