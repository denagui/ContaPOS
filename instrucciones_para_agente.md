# Instrucciones para Agente - Ajustes al ERP

## Contexto
El sistema base que implementaste es excelente (18 tablas, POS completo). Ahora necesitamos agregar funcionalidades de **Contabilidad Financiera** para cumplir con requisitos de Costa Rica.

---

## 🎯 Agregar estas 5 Funcionalidades

### 1. Tabla `expenses` (Gastos)
Similar a `sales` pero para registrar gastos operativos:
```typescript
expenses: {
  id: text().primaryKey(),
  expenseNumber: text().unique().notNull(),  // AUTO_INCREMENT
  supplierId: text().references(() => suppliers.id),
  categoryId: text().references(() => categories.id), // Nueva categoría "Gastos"
  description: text(),
  subtotal: real().notNull(),
  taxAmount: real().default(0),
  totalAmount: real().notNull(),
  paymentMethod: enum(['cash', 'card', 'transfer', 'credit']),
  paymentStatus: enum(['paid', 'pending', 'overdue']),
  invoiceNumber: text(),  // Número factura proveedor
  dueDate: text(),        // Fecha vencimiento si es crédito
  createdAt: text(),
}
```

### 2. Tabla `contacts` unificada (CRM + Proveedores)
Reemplaza/extiende `customers` para soportar ambos:
```typescript
contacts: {
  id: text().primaryKey(),
  type: enum(['customer', 'supplier', 'both']).notNull(),
  documentType: enum(['cedula', 'ruc', 'pasaporte', 'dimex', 'nite']).notNull(),
  documentNumber: text().unique().notNull(), // Cédula física/jurídica CR
  name: text().notNull(),
  tradeName: text(),        // Nombre comercial (hacienda)
  phone: text(),
  email: text(),
  address: text(),
  isActive: integer().default(1),
  creditLimit: real().default(0),     // Solo si type=customer|both
  creditDays: integer().default(0),   // Plazo en días
  currentBalance: real().default(0),
  createdAt: text(),
}
```

### 3. Campo CABYS en products
```typescript
products: {
  // ... campos existentes ...
  cabysCode: text(),        // Código Hacienda CR (13 dígitos)
  taxRate: integer().default(13), // 0, 4, 8, 13 (ahora es variable)
  // ...
}
```

### 4. Campo Clave Hacienda en sales
```typescript
sales: {
  // ... campos existentes ...
  haciendaKey: text(),      // Clave de comprobante electrónico (50 chars)
  haciendaStatus: enum(['pending', 'sent', 'accepted', 'rejected']).default('pending'),
  // ...
}
```

### 5. IVA Flexible (4%, 8%, 13%, exento)
Actualizar lógica de cálculo:
```typescript
// En lugar de taxRate = 0.13 fijo
const taxRates = {
  'exento': 0,
  '4': 0.04,
  '8': 0.08,
  '13': 0.13
};
```

---

## 📋 Tareas Específicas

### Schema (`drizzle/schema.ts`)
- [ ] Agregar tabla `expenses` (arriba está la estructura)
- [ ] Agregar tabla `contacts` (o extender `customers` agregando `type`)
- [ ] Agregar `cabysCode` y `taxRate` a `products`
- [ ] Agregar `haciendaKey` y `haciendaStatus` a `sales`

### Servicios (`src/lib/server/services/`)
- [ ] Crear `expense.service.ts` (similar a `sale.service.ts`)
- [ ] Renombrar/extender `customer.service.ts` → `contact.service.ts`
- [ ] Agregar método `createExpense()`

### UI
- [ ] Crear ruta `/expenses` para registrar gastos
- [ ] Modificar `/pos` para soportar IVA 4%, 8%, 13%, exento
- [ ] Agregar campo CABYS en formulario de producto

---

## 🔗 Referencias
Lee estos documentos del repo para entender el negocio:
- `specs/01_SCHEMA_SPECIFICATION.md` - Ver tablas Transacciones, Contactos
- `specs/04_FORMULAS_CALCULATIONS_SPEC.md` - Ver cálculos de IVA
- `extracted/tablas.md` - Ver estructura original del PDF
- `docs/resumen.md.txt` - Contexto de negocio

---

## ⚠️ Notas Importantes

1. **Mantén el código existente** - Solo agregar, no borrar
2. **Seguir patrón del código** - Usar mismo estilo (camelCase en TS, snake_case en DB)
3. **Fechas**: Usar formato ISO string en DB, humano en UI
4. **Moneda**: Real para montos (no usar float para cálculos críticos)
5. **Multi-tenant**: Agregar `branchId` en nuevas tablas

---

## 🎯 Definición de "Listo"

El trabajo está listo cuando:
- [ ] Puedo registrar un gasto (egreso) con IVA 13%
- [ ] Puedo crear un contacto de tipo "Proveedor"
- [ ] Al crear producto, puedo agregar código CABYS (ej: 1234567890123)
- [ ] Al facturar, puedo elegir IVA: 0%, 4%, 8%, 13%
- [ ] La venta tiene campo opcional para Clave Hacienda

---

¿Dudas? Preguntar antes de implementar.
