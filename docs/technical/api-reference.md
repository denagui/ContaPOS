# 📚 Referencia de API Interna (Server-Side)

## Visión General
Este documento describe los servicios y utilidades disponibles en el backend para ser consumidos por las rutas `+page.server.ts` y acciones del servidor.

## 1. Servicios Principales (`src/lib/server/services/`)

### `product.service.ts`
Gestión completa del catálogo de productos e inventario.

- **`getAllProducts(organizationId, filters)`**: Obtiene lista paginada con filtros por categoría, stock bajo, etc.
- **`getProductById(id)`**: Obtiene detalle completo incluyendo recetas y códigos CABYS.
- **`createProduct(data)`**: Crea producto validando unicidad de código de barras y formato CABYS.
- **`updateProduct(id, data)`**: Actualiza datos y recalcula promedios de costo si aplica.
- **`deleteProduct(id)`**: Elimina lógico (soft delete) si tiene historial, físico si no.
- **`adjustStock(productId, quantity, reason)`**: Registra movimiento de inventario y actualiza stock actual.

### `sale.service.ts`
Motor de punto de venta y facturación.

- **`createSale(data)`**:
    - Valida stock suficiente.
    - Calcula impuestos (IVA 0/4/8/13%).
    - Genera Clave de Hacienda (50 dígitos).
    - Descuenta ingredientes si es receta.
    - Registra cuenta por cobrar si es crédito.
- **`getSalesByOrganization(orgId, dateRange)`**: Historial de ventas con totales.
- **`voidSale(saleId, reason)`**: Anula venta y reintegra stock (requiere rol admin).
- **`generateTicketPDF(saleId)`**: Retorna buffer PDF para impresión térmica.

### `expense.service.ts`
Registro de egresos operativos.

- **`createExpense(data)`**: Registra gasto con comprobante fiscal.
- **`getExpensesByCategory(orgId, category)`**: Filtra gastos por tipo.
- **`approveExpense(id)`**: Flujo de aprobación para gastos mayores a cierto monto.

### `contact.service.ts`
CRM unificado de clientes y proveedores.

- **`getAllContacts(orgId, type)`**: Lista contactos filtrando por rol (customer, supplier, both).
- **`createContact(data)`**: Valida RUC/DNI único por organización.
- **`getContactLedger(contactId)`**: Obtiene estado de cuenta (debe/haber) y historial.

## 2. Utilidades (`src/lib/server/utils/`)

### `hacienda-key.ts`
Generadores y validadores fiscales para Costa Rica.

- **`generateHaciendaKey(activityCode, emissionDate, sequential)`**: Crea clave única de 50 dígitos.
- **`validateCABYS(code)`**: Verifica estructura de 13 dígitos.
- **`calculateTax(amount, taxRate)`**: Calcula impuesto desglosado correctamente.

### `pdf-generator.ts`
Generación de documentos imprimibles.

- **`generateTicket(saleData)`**: PDF formato 58mm/80mm para impresoras térmicas.
- **`generateInvoiceXML(saleData)`**: Estructura XML base para facturación electrónica.

### `whatsapp-link.ts`
Integración con WhatsApp Business.

- **`generateTicketLink(phone, saleSummary)`**: Crea URL `wa.me` con mensaje prellenado del ticket.

## 3. Middleware de Seguridad (`src/lib/server/middleware/`)

### `protect-routes.ts`
Funciones para proteger acceso a datos.

- **`requireRole(allowedRoles)`**: Middleware que lanza 403 si el usuario no tiene el rol.
- **`isOwnerOfResource(userId, resourceId)`**: Verifica propiedad antes de editar/borrar.

## 4. Estructura de Datos Común

### Objeto `SaleDTO`
```typescript
{
  id: string;
  organizationId: string;
  customerId?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number; taxRate: number }>;
  totalAmount: number;
  taxAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
  haciendaKey: string;
  status: 'completed' | 'void' | 'pending';
}
```

### Objeto `ProductDTO`
```typescript
{
  id: string;
  name: string;
  cabysCode: string; // 13 digits
  barcode?: string;
  unitPrice: number;
  costPrice: number;
  stock: number;
  recipe?: Array<{ ingredientId: string; quantity: number }>;
  taxRate: 0 | 4 | 8 | 13;
}
```
