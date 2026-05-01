# API Reference - ContaPOS Internal

Documentación de endpoints internos y servicios del sistema.

## 🔐 Autenticación

Todas las rutas requieren autenticación vía session cookie. El middleware `protect-routes.ts` valida:
- Usuario logueado
- Pertenencia a organización
- Rol adecuado para la acción

## 📦 Endpoints Principales

### Productos (`/inventory`)
```typescript
GET /inventory?page=1&search=ron&type=ingredient
POST /inventory (action: create)
PUT /inventory (action: update)
DELETE /inventory (action: delete)
```

**Schema Producto:**
```typescript
{
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  cabysCode: string; // 13 dígitos
  price: number;
  cost?: number;
  taxRate: 0 | 4 | 8 | 13;
  stock: number;
  minStock?: number;
  isIngredient: boolean;
  recipe?: RecipeItem[];
}
```

### Ventas POS (`/pos`)
```typescript
GET /pos // Carga productos y configuración
POST /pos (action: completeSale)
```

**Payload Venta:**
```typescript
{
  items: Array<{ productId: string; quantity: number; price: number }>;
  customerId?: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'sinpe';
  isCredit: boolean;
  creditDays?: number;
}
```

### Contactos (`/contacts`)
```typescript
GET /contacts?type=customer&search=juan
POST /contacts (action: create)
PUT /contacts (action: update)
DELETE /contacts (action: delete)
```

### Gastos (`/expenses`)
```typescript
GET /expenses?from=2025-01-01&to=2025-01-31
POST /expenses (action: create)
```

### Configuración (`/settings`)
```typescript
GET /settings // Carga configuración de industria
POST /settings (action: update)
```

## 🧮 Servicios Internos

### `sale.service.ts`
- `createSale(data)`: Crea venta, descuenta stock, genera clave Hacienda
- `getSalesByOrg(orgId, filters)`: Lista ventas con paginación
- `getSaleById(id)`: Detalle completo con items

### `product.service.ts`
- `createProduct(data)`: Valida CABYS, crea producto
- `updateStock(productId, delta)`: Ajusta inventario
- `getLowStockProducts(orgId)`: Productos bajo mínimo

### `contact.service.ts`
- `createContact(data)`: Valida RUC, crea contacto
- `getContactTransactions(id)`: Historial completo

### `expense.service.ts`
- `createExpense(data)`: Registra gasto con datos fiscales
- `getExpensesByCategory(orgId)`: Agrupados por categoría

### `calculator.ts`
- `calculateTax(amount, rate)`: Calcula IVA según tasa CR
- `calculateTotals(items)`: Suma subtotal, impuestos, total

### `hacienda-key.ts`
- `generateHaciendaKey()`: Genera clave 50 dígitos norma técnica
- `validateCABYS(code)`: Valida formato 13 dígitos

## 📊 Respuestas Típicas

**Éxito:**
```json
{ "success": true, "data": {...} }
```

**Error:**
```json
{ "success": false, "error": "Mensaje descriptivo" }
```

## ⚠️ Consideraciones

- Todas las fechas en formato ISO 8601
- Moneda en Colones (CRC) por defecto
- Impuestos según normativa Costa Rica
- Límite de 100 registros por página
