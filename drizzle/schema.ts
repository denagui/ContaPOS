import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// ============================================
// UTILIDADES PARA FECHAS EPOCH 13
// ============================================
// Todas las fechas se almacenan como INTEGER (Epoch 13 - milisegundos)
// Conforme a estándares ISO 8601 y NIIF/IFRS
// ============================================

// ============================================
// TABLAS PRINCIPALES
// ============================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id), // SCOPED DB
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  active: integer('active').default(1),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  lastLoginAt: integer('last_login_at', { mode: 'number' }),
}, (table) => [
  index('idx_users_company').on(table.companyId),
  index('idx_users_username').on(table.username),
  index('idx_users_email').on(table.email),
]);

// ============================================
// SISTEMA RBAC (ROLE-BASED ACCESS CONTROL)
// ============================================
// Roles y permisos granulares para control de acceso
// ============================================

export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id), // SCOPED DB
  name: text('name').notNull(), // Ej: 'admin', 'manager', 'cashier', 'accountant'
  description: text('description'),
  isSystem: integer('is_system').default(0), // Roles del sistema no se pueden borrar
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_roles_company').on(table.companyId),
  index('idx_roles_name').on(table.name),
]);

export const permissions = sqliteTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(), // Ej: 'sales.create', 'sales.delete', 'reports.view'
  description: text('description'),
  category: text('category').notNull(), // Ej: 'sales', 'inventory', 'accounting', 'settings'
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_permissions_category').on(table.category),
]);

export const rolePermissions = sqliteTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  grantedBy: text('granted_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_role_permissions_role').on(table.roleId),
  index('idx_role_permissions_permission').on(table.permissionId),
  // Unique constraint para evitar duplicados
]);

export const userRoles = sqliteTable('user_roles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  expiresAt: integer('expires_at', { mode: 'number' }), // Para roles temporales
}, (table) => [
  index('idx_user_roles_user').on(table.userId),
  index('idx_user_roles_role').on(table.roleId),
  // Unique constraint para evitar duplicados
]);

export const branches = sqliteTable('branches', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id), // SCOPED DB
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  currency: text('currency').default('USD'), // ISO 4217
  taxRate: real('tax_rate').default(0.13),
  active: integer('active').default(1),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_branches_company').on(table.companyId),
]);

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id), // SCOPED DB
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id').references(() => categories.id),
  active: integer('active').default(1),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_categories_company').on(table.companyId),
]);

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id), // SCOPED DB
  sku: text('sku').unique().notNull(),
  barcode: text('barcode').unique(),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: text('category_id').references(() => categories.id),
  // TIPO DE PRODUCTO: product, service, fixed_expense
  productType: text('product_type', { enum: ['product', 'service', 'fixed_expense'] }).default('product'),
  costPrice: real('cost_price').default(0),
  salePrice: real('sale_price').notNull(),
  stockQuantity: integer('stock_quantity').default(0),
  minStock: integer('min_stock').default(5),
  maxStock: integer('max_stock'),
  unit: text('unit').default('unit'),
  imageUrl: text('image_url'),
  // IVA FLEXIBLE: 0=exento, 4=4%, 8=8%, 13=13%
  taxType: text('tax_type', { enum: ['0', '4', '8', '13'] }).default('13'),
  taxable: integer('taxable').default(1),
  // CÓDIGO CABYS PARA HACIENDA CR (13 dígitos)
  cabysCode: text('cabys_code'),
  active: integer('active').default(1),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_products_company').on(table.companyId),
  index('idx_products_barcode').on(table.barcode),
  index('idx_products_sku').on(table.sku),
  index('idx_products_category').on(table.categoryId),
  index('idx_products_active').on(table.active),
  index('idx_products_cabys').on(table.cabysCode),
]);

// ============================================
// TABLAS DE TRANSACCIONES
// ============================================
// NOTA: Las tablas customers y suppliers han sido reemplazadas por contacts
// para unificar la gestión de clientes y proveedores en una sola tabla.
// ============================================

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id), // SCOPED DB
  saleNumber: text('sale_number').unique().notNull(),
  branchId: text('branch_id').references(() => branches.id),
  contactId: text('contact_id').references(() => contacts.id),
  userId: text('user_id').references(() => users.id),
  // PRECISIÓN MONETARIA: Usamos céntimos (INTEGER) para evitar errores de punto flotante
  subtotalCents: integer('subtotal_cents').notNull(),
  discountCents: integer('discount_cents').default(0),
  taxAmountCents: integer('tax_amount_cents').notNull(),
  totalAmountCents: integer('total_amount_cents').notNull(),
  paymentMethod: text('payment_method', { enum: ['cash', 'card', 'transfer', 'mixed', 'credit'] }),
  paymentStatus: text('payment_status', { enum: ['paid', 'pending', 'partial'] }).default('paid'),
  amountPaidCents: integer('amount_paid_cents').default(0),
  changeAmountCents: integer('change_amount_cents').default(0),
  notes: text('notes'),
  cancelled: integer('cancelled').default(0),
  // CLAVE HACIENDA PARA FACTURACIÓN ELECTRÓNICA (50 dígitos)
  haciendaKey: text('hacienda_key'),
  haciendaStatus: text('hacienda_status', { 
    enum: ['pending', 'sent', 'accepted', 'rejected'] 
  }).default('pending'),
  // DATOS HACIENDA 4.4 - TIPO DE COMPROBANTE
  documentType: text('document_type', {
    enum: [
      '01', // Factura electrónica
      '02', // Nota de débito
      '03', // Nota de crédito
      '04', // Tiquete electrónico
      '05', // Confirmación de aceptación
      '06', // Confirmación de rechazo
      '07', // Nota de remisión
      '08', // Factura electrónica de compra
      '09'  // Factura electrónica de exportación
    ]
  }).default('01'),
  // CONDICIÓN DE VENTA
  saleCondition: text('sale_condition', {
    enum: ['01', '02', '03'] // 01=Contado, 02=Crédito, 03=Consignación
  }).default('01'),
  creditTermDays: integer('credit_term_days').default(0), // Plazo crédito en días
  // MEDIO DE PAGO (código Hacienda)
  paymentMethodCode: text('payment_method_code', {
    enum: [
      '01', // Efectivo
      '02', // Tarjeta
      '03', // Cheque
      '04', // Transferencia
      '05', // Recaudado por terceros
      '06', // SINPE móvil (NUEVO 4.4)
      '07', // Plataformas digitales/PayPal (NUEVO 4.4)
      '08'  // Depósito
    ]
  }).default('01'),
  // REFERENCIA A DOCUMENTO ORIGINAL (para ND/NC)
  referenceDocKey: text('reference_doc_key'), // Clave Hacienda doc referenciado
  referenceDocDate: text('reference_doc_date'),
  referenceDocType: text('reference_doc_type'),
  // NUMERACIÓN Y CAE
  consecutiveNumber: text('consecutive_number'), // Número consecutivo interno
  cae: text('cae'), // Código de Autorización Especial
  caeExpiration: text('cae_expiration'), // Fecha expiración CAE
  // ISO 42001: Explicación de decisiones automatizadas
  aiExplanation: text('ai_explanation'),
  confidenceScore: real('confidence_score'),
  // EPOCH 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_sales_company').on(table.companyId), // SCOPED DB
  index('idx_sales_contact').on(table.contactId),
  index('idx_sales_user').on(table.userId),
  index('idx_sales_branch').on(table.branchId),
  index('idx_sales_created_at').on(table.createdAt),
  index('idx_sales_hacienda').on(table.haciendaKey),
  index('idx_sales_document_type').on(table.documentType),
]);

export const saleItems = sqliteTable('sale_items', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id),
  quantity: real('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  discountCents: integer('discount_cents').default(0),
  taxAmountCents: integer('tax_amount_cents').notNull(),
  totalAmountCents: integer('total_amount_cents').notNull(),
  // DATOS HACIENDA 4.4 - LÍNEAS DE COMPROBANTE
  cabysCode: text('cabys_code'), // Código CABYS del producto (copia al momento de venta)
  taxType: text('tax_type', { 
    enum: ['01', '02', '03', '04', '05', '06', '07', '08'] 
  }), // 01=General 13%, 02=Reducido 4%, 03=Reducido 8%, 04=Exento, etc.
  taxRate: real('tax_rate'), // Tarifa específica aplicada
  unitPriceWithoutTaxCents: integer('unit_price_without_tax_cents'), // Precio unitario sin IVA
  discountAmountCents: integer('discount_amount_cents').default(0), // Monto descuento en céntimos
  discountReason: text('discount_reason'), // Motivo del descuento
  unitCode: text('unit_code', {
    enum: ['Unid', 'kg', 'g', 'L', 'ml', 'm', 'cm', 'm2', 'm3', 'Otros']
  }).default('Unid'), // Unidad de medida (código Hacienda)
  // ISO 42001: Trazabilidad de sugerencias de IA en items
  aiSuggestionId: text('ai_suggestion_id'),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_sale_items_sale').on(table.saleId),
  index('idx_sale_items_product').on(table.productId),
  index('idx_sale_items_cabys').on(table.cabysCode),
]);

export const inventoryMovements = sqliteTable('inventory_movements', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id), // SCOPED DB
  productId: text('product_id').references(() => products.id),
  movementType: text('movement_type', { enum: ['entry', 'exit', 'adjustment', 'return', 'transfer'] }),
  quantity: real('quantity').notNull(),
  previousStock: integer('previous_stock'),
  newStock: integer('new_stock'),
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),
  userId: text('user_id').references(() => users.id),
  notes: text('notes'),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_inventory_company').on(table.companyId),
  index('idx_inventory_product').on(table.productId),
  index('idx_inventory_created').on(table.createdAt),
]);

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id), // SCOPED DB
  purchaseNumber: text('purchase_number').unique().notNull(),
  contactId: text('contact_id').references(() => contacts.id),
  branchId: text('branch_id').references(() => branches.id),
  subtotalCents: integer('subtotal_cents').notNull(),
  discountCents: integer('discount_cents').default(0),
  taxAmountCents: integer('tax_amount_cents').notNull(),
  totalAmountCents: integer('total_amount_cents').notNull(),
  paymentStatus: text('payment_status', { enum: ['paid', 'pending', 'partial'] }).default('pending'),
  received: integer('received').default(0),
  notes: text('notes'),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_purchases_company').on(table.companyId),
]);

export const purchaseItems = sqliteTable('purchase_items', {
  id: text('id').primaryKey(),
  purchaseId: text('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id),
  quantity: real('quantity').notNull(),
  unitCostCents: integer('unit_cost_cents').notNull(),
  totalAmountCents: integer('total_amount_cents').notNull(),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_purchase_items_purchase').on(table.purchaseId),
]);

// ============================================
// TABLAS DE CRM Y FIDELIZACIÓN
// ============================================

export const customerInteractions = sqliteTable('customer_interactions', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').references(() => contacts.id),
  interactionType: text('interaction_type', { enum: ['call', 'email', 'visit', 'note', 'complaint', 'suggestion'] }),
  description: text('description').notNull(),
  followUpDate: integer('follow_up_date', { mode: 'number' }),
  resolved: integer('resolved').default(0),
  userId: text('user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const loyaltyTransactions = sqliteTable('loyalty_transactions', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').references(() => contacts.id),
  transactionType: text('transaction_type', { enum: ['earn', 'redeem', 'adjustment', 'expire'] }),
  points: integer('points').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),
  description: text('description'),
  expiresAt: integer('expires_at', { mode: 'number' }),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const credits = sqliteTable('credits', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').references(() => contacts.id),
  saleId: text('sale_id').references(() => sales.id),
  amount: real('amount').notNull(),
  paidAmount: real('paid_amount').default(0),
  remainingAmount: real('remaining_amount').notNull(),
  dueDate: integer('due_date', { mode: 'number' }),
  status: text('status', { enum: ['active', 'paid', 'overdue', 'cancelled'] }).default('active'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_credits_contact').on(table.contactId),
  index('idx_credits_status').on(table.status),
]);

export const creditPayments = sqliteTable('credit_payments', {
  id: text('id').primaryKey(),
  creditId: text('credit_id').references(() => credits.id),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  userId: text('user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

// ============================================
// TABLAS DE CONFIGURACIÓN Y AUDITORÍA
// ============================================

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  type: text('type').default('string'),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const cashClosings = sqliteTable('cash_closings', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').references(() => branches.id),
  userId: text('user_id').references(() => users.id),
  openingAmount: real('opening_amount').default(0),
  closingAmount: real('closing_amount'),
  expectedAmount: real('expected_amount'),
  difference: real('difference'),
  observations: text('observations'),
  status: text('status', { enum: ['open', 'closed', 'adjusted'] }).default('open'),
  openedAt: integer('opened_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  closedAt: integer('closed_at', { mode: 'number' }),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  tableName: text('table_name'),
  recordId: text('record_id'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_audit_user').on(table.userId),
  index('idx_audit_created').on(table.createdAt),
]);

// ============================================
// TABLAS DE CONTABILIDAD Y ORGANIZACIÓN
// ============================================

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  taxId: text('tax_id'), // Cedula Juridica o Fisica
  legalName: text('legal_name'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  industryType: text('industry_type', { 
    enum: ['retail', 'restaurant', 'services', 'utilities', 'accounting'] 
  }).default('retail'),
  currency: text('currency').default('CRC'),
  taxRate: real('tax_rate').default(0.13),
  logoUrl: text('logo_url'),
  isActive: integer('is_active').default(1),
  // DATOS HACIENDA 4.4
  nit: text('nit'), // Número de Identificación Tributaria (formato: 3-XXX-XXXXXX)
  branchCode: text('branch_code').default('001'), // Sucursal/Taller/PV (3 dígitos)
  terminalCode: text('terminal_code').default('00001'), // Terminal/Punto facturación (5 dígitos)
  mainActivityCode: text('main_activity_code'), // Actividad económica principal
  secondaryActivityCodes: text('secondary_activity_codes'), // JSON array: ["523202", "471101"]
  taxpayerType: text('taxpayer_type', { 
    enum: ['ordinary', 'large', 'special', 'franchise'] 
  }).default('ordinary'),
  ivaRegime: text('iva_regime', { 
    enum: ['general', 'simplified', 'exempt', 'special'] 
  }).default('general'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  expenseNumber: text('expense_number').unique(),
  // PRECISIÓN MONETARIA: Céntimos enteros
  amountCents: integer('amount_cents').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  taxAmountCents: integer('tax_amount_cents').default(0),
  taxRate: real('tax_rate').default(0.13),
  // CATEGORÍA NIIF: Clasificación según NIIF para PYMES
  niifCategory: text('niif_category', { 
    enum: [
      'cost_of_sales',           // Costo de ventas (61)
      'operating_expense',       // Gastos operativos (62)
      'employee_benefit',        // Beneficios a empleados (63)
      'depreciation',            // Depreciación y amortización (64)
      'financial_expense',       // Gastos financieros (65)
      'other_expense',           // Otros gastos (66)
      'non_operating_expense'    // Gastos no operativos (67)
    ]
  }).default('operating_expense'),
  category: text('category').notNull(),
  description: text('description').notNull(),
  date: integer('date', { mode: 'number' }).notNull().$defaultFn(() => Date.now()),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'card', 'transfer', 'sinpe', 'credit']
  }).notNull(),
  receiptNumber: text('receipt_number'),
  haciendaKey: text('hacienda_key'),
  status: text('status', { enum: ['pending', 'completed', 'cancelled'] }).default('completed'),
  createdBy: text('created_by').references(() => users.id),
  // ISO 42001: Trazabilidad de IA
  aiSuggestionId: text('ai_suggestion_id'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_expenses_company').on(table.companyId),
  index('idx_expenses_date').on(table.date),
  index('idx_expenses_category').on(table.category),
  index('idx_expenses_niif').on(table.niifCategory),
]);

// ============================================
// INGRESOS OPERATIVOS Y NO OPERATIVOS
// ============================================

export const revenues = sqliteTable('revenues', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  revenueNumber: text('revenue_number').unique(),
  saleId: text('sale_id').references(() => sales.id),
  contactId: text('contact_id').references(() => contacts.id),
  // PRECISIÓN MONETARIA: Céntimos enteros
  amountCents: integer('amount_cents').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  taxAmountCents: integer('tax_amount_cents').default(0),
  taxRate: real('tax_rate').default(0.13),
  // CATEGORÍA NIIF: Clasificación según NIIF para PYMES
  niifCategory: text('niif_category', {
    enum: [
      'operating_revenue',       // Ingresos operativos (41)
      'non_operating_revenue',   // Ingresos no operativos (42)
      'financial_income',        // Ingresos financieros (43)
      'other_income'             // Otros ingresos (44)
    ]
  }).default('operating_revenue'),
  category: text('category').notNull(),
  description: text('description').notNull(),
  date: integer('date', { mode: 'number' }).notNull().$defaultFn(() => Date.now()),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'card', 'transfer', 'sinpe', 'credit']
  }).notNull(),
  receiptNumber: text('receipt_number'),
  haciendaKey: text('hacienda_key'),
  status: text('status', { enum: ['pending', 'completed', 'cancelled'] }).default('completed'),
  createdBy: text('created_by').references(() => users.id),
  // ISO 42001: Trazabilidad de IA
  aiSuggestionId: text('ai_suggestion_id'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_revenues_company').on(table.companyId),
  index('idx_revenues_date').on(table.date),
  index('idx_revenues_category').on(table.category),
  index('idx_revenues_niif').on(table.niifCategory),
  index('idx_revenues_sale').on(table.saleId),
]);

// ============================================
// TABLA DE ABONOS/PAGOS PARA CRÉDITOS (CxC/CxP)
// ============================================

export const paymentInstallments = sqliteTable('payment_installments', {
  id: text('id').primaryKey(),
  // Referencia a la transacción (venta o compra)
  referenceType: text('reference_type', { enum: ['sale', 'purchase', 'credit'] }).notNull(),
  referenceId: text('reference_id').notNull(),
  // Número de abono
  installmentNumber: integer('installment_number').default(1),
  // Montos
  amount: real('amount').notNull(),
  previousBalance: real('previous_balance').notNull(),
  newBalance: real('new_balance').notNull(),
  // Fechas - Epoch 13
  paymentDate: integer('payment_date', { mode: 'number' }).notNull().$defaultFn(() => Date.now()),
  dueDate: integer('due_date', { mode: 'number' }), // Fecha de vencimiento del abono
  // Método de pago
  paymentMethod: text('payment_method', { 
    enum: ['cash', 'card', 'transfer', 'sinpe', 'check', 'deposit'] 
  }).notNull(),
  // Referencia del pago
  referenceNumber: text('reference_number'), // Número de cheque, transferencia, etc.
  // Comprobante
  receiptNumber: text('receipt_number'),
  // Notas
  notes: text('notes'),
  // Usuario que registró
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_installments_ref').on(table.referenceId, table.referenceType),
  index('idx_installments_date').on(table.paymentDate),
  index('idx_installments_created').on(table.createdAt),
]);

// ============================================
// TABLA DE CONTACTOS UNIFICADA (Clientes/Proveedores)
// ============================================

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  // TIPO DE CONTACTO: customer, supplier, both
  contactType: text('contact_type', { enum: ['customer', 'supplier', 'both'] }).notNull(),
  // INFORMACIÓN BÁSICA
  name: text('name').notNull(),
  tradeName: text('trade_name'), // Nombre comercial (Hacienda)
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),
  // DOCUMENTOS TRIBUTARIOS COSTA RICA (Anexo 4.4)
  documentType: text('document_type', { 
    enum: [
      'cedula_fisica',           // Física nacional
      'cedula_juridica',         // Jurídica nacional
      'dimex',                   // DIMEX (extranjero residente)
      'nite',                    // NITE (extranjero no residente)
      'pasaporte',               // Pasaporte
      'extranjero_no_domiciliado', // NUEVO 4.4
      'no_contribuyente'         // NUEVO 4.4
    ] 
  }).default('cedula_fisica'),
  documentNumber: text('document_number'),
  // DIRECCIÓN COMPLETA CON CÓDIGOS HACIENDA
  provinceCode: text('province_code', { enum: ['1', '2', '3', '4', '5', '6', '7'] }), // 1-7 provincias CR
  cantonCode: text('canton_code'), // 3 dígitos
  districtCode: text('district_code'), // 3 dígitos
  province: text('province'),
  canton: text('canton'),
  district: text('district'),
  neighborhood: text('neighborhood'), // Barrio/otras señas
  address: text('address'),
  postalCode: text('postal_code'),
  // ACTIVIDAD ECONÓMICA HACIENDA
  activityCode: text('activity_code'), // Código 6 dígitos (ej: "011101")
  // MÚLTIPLES CORREOS (JSON array, hasta 4 correos Hacienda 4.4)
  emails: text('emails'), // JSON: ["email1@empresa.com", "email2@empresa.com"]
  // CRÉDITO
  creditLimit: real('credit_limit').default(0),
  currentBalance: real('current_balance').default(0),
  creditDays: integer('credit_days').default(0),
  // CÓDIGO CABYS PARA CLIENTES
  cabysCode: text('cabys_code'),
  // PUNTOS DE LEALTAD
  loyaltyPoints: integer('loyalty_points').default(0),
  // ESTADO
  active: integer('active').default(1),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_contacts_company').on(table.companyId),
  index('idx_contacts_type').on(table.contactType),
  index('idx_contacts_document').on(table.documentNumber),
  index('idx_contacts_active').on(table.active),
  index('idx_contacts_activity').on(table.activityCode),
  index('idx_contacts_document_type').on(table.documentType),
]);

// ============================================
// CONFIGURACIÓN DE ORGANIZACIÓN
// ============================================

export const companySettings = sqliteTable('company_settings', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  settingKey: text('setting_key').notNull(),
  settingValue: text('setting_value').notNull(), // JSON string para valores complejos
  type: text('type', { enum: ['string', 'number', 'boolean', 'json'] }).default('string'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_settings_company').on(table.companyId),
  index('idx_org_settings_key').on(table.settingKey),
]);

// ============================================
// PARTIDA DOBLE AUTOMÁTICA (NIIF/IFRS)
// ============================================
// Tablas para asientos contables automáticos estilo SAP/Alegra
// ============================================

export const chartOfAccounts = sqliteTable('chart_of_accounts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  accountCode: text('account_code').notNull(), // Ej: 1-01-001
  accountName: text('account_name').notNull(),
  accountType: text('account_type', { 
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] 
  }).notNull(),
  parentAccountId: text('parent_account_id').references(() => chartOfAccounts.id),
  normalBalance: text('normal_balance', { enum: ['debit', 'credit'] }).notNull(),
  isActive: integer('is_active').default(1),
  niifCode: text('niif_code'), // Código NIIF (ej: 1105, 4135)
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_chart_company').on(table.companyId),
  index('idx_chart_code').on(table.accountCode),
  index('idx_chart_type').on(table.accountType),
]);

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  entryNumber: text('entry_number').unique().notNull(), // Ej: ASIENTO-2024-00001
  companyId: text('company_id').references(() => companies.id),
  branchId: text('branch_id').references(() => branches.id),
  transactionDate: integer('transaction_date', { mode: 'number' }).notNull(), // Epoch 13
  postingDate: integer('posting_date', { mode: 'number' }).notNull(), // Epoch 13
  documentType: text('document_type', { 
    enum: ['sale', 'purchase', 'expense', 'payment', 'receipt', 'adjustment', 'payroll'] 
  }).notNull(),
  documentId: text('document_id'), // ID de la transacción original (venta, gasto, etc.)
  description: text('description').notNull(),
  reference: text('reference'), // Número de factura, recibo, etc.
  totalDebitsCents: integer('total_debits_cents').notNull(),
  totalCreditsCents: integer('total_credits_cents').notNull(),
  isPosted: integer('is_posted').default(0), // 0=Borrador, 1=Contabilizado
  isReversed: integer('is_reversed').default(0),
  reversedBy: text('reversed_by').references(() => journalEntries.id),
  // ISO 42001: Trazabilidad de automatización
  autoGenerated: integer('auto_generated').default(0), // Generado automáticamente por el sistema
  aiExplanation: text('ai_explanation'), // Explicación de por qué se generó este asiento
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_journal_company').on(table.companyId),
  index('idx_journal_date').on(table.transactionDate),
  index('idx_journal_document').on(table.documentId),
  index('idx_journal_posted').on(table.isPosted),
]);

export const journalLines = sqliteTable('journal_lines', {
  id: text('id').primaryKey(),
  journalEntryId: text('journal_entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  accountId: text('account_id').notNull().references(() => chartOfAccounts.id),
  description: text('description'),
  debitCents: integer('debit_cents').default(0),
  creditCents: integer('credit_cents').default(0),
  // Dimensiones analíticas
  contactId: text('contact_id').references(() => contacts.id),
  productId: text('product_id').references(() => products.id),
  branchId: text('branch_id').references(() => branches.id),
  // ISO 42001: Trazabilidad
  aiSuggestionId: text('ai_suggestion_id'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_lines_entry').on(table.journalEntryId),
  index('idx_lines_account').on(table.accountId),
  index('idx_lines_contact').on(table.contactId),
]);

// ============================================
// MOTOR DE SUGERENCIAS INTELIGENTES (IA)
// ============================================
// Sistema de recomendaciones basado en datos históricos
// ISO 42001: IA Ética y Explicable
// ============================================

export const aiSuggestions = sqliteTable('ai_suggestions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  suggestionType: text('suggestion_type', {
    enum: [
      'promotion',          // Sugerir promoción
      'restock',            // Reponer inventario
      'price_adjustment',   // Ajustar precio
      'bundle',             // Crear combo
      'waste_reduction',    // Reducir desperdicio
      'upsell',             // Sugerir venta cruzada
      'staff_optimization'  // Optimizar personal
    ]
  }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  // DATOS DE CONTEXTO
  relatedProductId: text('product_id').references(() => products.id),
  relatedContactId: text('contact_id').references(() => contacts.id),
  relatedSaleId: text('sale_id').references(() => sales.id),
  // METADATOS DE IA
  confidenceScore: real('confidence_score').notNull(), // 0.0 a 1.0
  expectedImpact: text('expected_impact'), // Ej: "+15% ventas", "-20% desperdicio"
  algorithmUsed: text('algorithm_used'), // Ej: "apriori", "time_series", "rfm"
  explanation: text('explanation').notNull(), // Explicación humana de la sugerencia
  dataPoints: integer('data_points'), // Cantidad de datos analizados
  // ESTADO
  status: text('status', { 
    enum: ['pending', 'accepted', 'rejected', 'expired'] 
  }).default('pending'),
  acceptedAt: integer('accepted_at', { mode: 'number' }),
  rejectedAt: integer('rejected_at', { mode: 'number' }),
  expiresAt: integer('expires_at', { mode: 'number' }),
  // AUDITORÍA
  reviewedBy: text('reviewed_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_ai_company').on(table.companyId),
  index('idx_ai_type').on(table.suggestionType),
  index('idx_ai_status').on(table.status),
  index('idx_ai_product').on(table.relatedProductId),
  index('idx_ai_confidence').on(table.confidenceScore),
]);

// ============================================
// AUDITORÍA AVANZADA (ISO 27001)
// ============================================
// Logs inmutables para trazabilidad completa
// ============================================

export const auditLogsEnhanced = sqliteTable('audit_logs_enhanced', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(), // CREATE, UPDATE, DELETE, LOGIN, EXPORT, etc.
  resourceType: text('resource_type').notNull(), // 'sale', 'product', 'contact', etc.
  resourceId: text('resource_id'),
  oldValue: text('old_value'), // JSON del estado anterior
  newValue: text('new_value'), // JSON del nuevo estado
  // CONTEXTO DE SEGURIDAD
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  sessionId: text('session_id'),
  // ISO 27001: Clasificación de eventos
  securityLevel: text('security_level', {
    enum: ['info', 'warning', 'critical', 'audit']
  }).default('info'),
  isAutomated: integer('is_automated').default(0), // Acción ejecutada por el sistema
  aiDecisionId: text('ai_decision_id'), // Si fue decisión de IA
  // INTEGRIDAD
  hash: text('hash'), // Hash SHA-256 para verificar integridad
  previousHash: text('previous_hash'), // Encadenamiento tipo blockchain
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_audit_company').on(table.companyId),
  index('idx_audit_user').on(table.userId),
  index('idx_audit_action').on(table.action),
  index('idx_audit_resource').on(table.resourceType),
  index('idx_audit_date').on(table.createdAt),
  index('idx_audit_security').on(table.securityLevel),
]);

// ============================================
// DECISIONES DE IA (ISO 42001)
// ============================================
// Registro de todas las decisiones automatizadas
// ============================================

export const aiDecisionsLog = sqliteTable('ai_decisions_log', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  decisionType: text('decision_type', {
    enum: [
      'pricing',           // Ajuste de precios
      'inventory',         // Gestión de inventario
      'credit_approval',   // Aprobación de crédito
      'fraud_detection',   // Detección de fraude
      'recommendation',    // Recomendación de productos
      'accounting',        // Asiento contable automático
      'billing'            // Facturación automática
    ]
  }).notNull(),
  inputContext: text('input_context').notNull(), // JSON con los datos de entrada
  outputDecision: text('output_decision').notNull(), // JSON con la decisión tomada
  confidenceScore: real('confidence_score'),
  algorithmVersion: text('algorithm_version'),
  // EXPLICABILIDAD (ISO 42001)
  explanation: text('explanation').notNull(), // Explicación en lenguaje natural
  alternativeOptions: text('alternative_options'), // Otras opciones consideradas
  // IMPACTO
  financialImpactCents: integer('financial_impact_cents'),
  riskLevel: text('risk_level', {
    enum: ['low', 'medium', 'high', 'critical']
  }).default('low'),
  // HUMAN-IN-THE-LOOP
  requiresReview: integer('requires_review').default(0),
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  reviewedAt: integer('reviewed_at', { mode: 'number' }),
  // AUDITORÍA
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_ai_decisions_company').on(table.companyId),
  index('idx_ai_decisions_type').on(table.decisionType),
  index('idx_ai_decisions_risk').on(table.riskLevel),
  index('idx_ai_decisions_review').on(table.requiresReview),
  index('idx_ai_decisions_date').on(table.createdAt),
]);

// ============================================
// CIERRES CONTABLES (NIIF/IFRS)
// ============================================
// Períodos contables bloqueados para evitar modificaciones
// Cumplimiento normativo: No se pueden modificar transacciones de períodos cerrados
// ============================================

export const accountingPeriods = sqliteTable('accounting_periods', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(),
  periodName: text('period_name').notNull(), // Ej: "Enero 2024", "Q1 2024"
  startDate: integer('start_date', { mode: 'number' }).notNull(), // Epoch 13
  endDate: integer('end_date', { mode: 'number' }).notNull(), // Epoch 13
  // ESTADO DEL PERÍODO
  status: text('status', {
    enum: ['open', 'soft_close', 'closed', 'locked']
  }).default('open').notNull(),
  // open: Se pueden crear/modificar transacciones
  // soft_close: Solo lectura, requiere aprobación para cambios
  // closed: Cierre contable completo, solo asientos de ajuste
  // locked: Bloqueo total por auditoría o normativa
  
  // CONTROL DE CAMBIOS
  canCreate: integer('can_create').default(1),
  canModify: integer('can_modify').default(1),
  canDelete: integer('can_delete').default(0), // Nunca permitir borrar en período cerrado
  requiresApproval: integer('requires_approval').default(0),
  
  // METADATOS DE CIERRE
  closedBy: text('closed_by').references(() => users.id),
  closedAt: integer('closed_at', { mode: 'number' }),
  closedReason: text('closed_reason'), // Justificación del cierre
  approvedBy: text('approved_by').references(() => users.id), // Auditor o contador
  approvedAt: integer('approved_at', { mode: 'number' }),
  
  // INDICADORES DE CALIDAD
  hasDiscrepancies: integer('has_discrepancies').default(0),
  reconciliationStatus: text('reconciliation_status', {
    enum: ['pending', 'reconciled', 'discrepancy']
  }).default('pending'),
  
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_period_company').on(table.companyId),
  index('idx_period_dates').on(table.startDate, table.endDate),
  index('idx_period_status').on(table.status),
  index('idx_period_closed').on(table.closedAt),
]);

// ============================================
// CONCILIACIÓN BANCARIA (FASE 4)
// ============================================
// Importación de extractos bancarios (CSV/OFX)
// Matching automático con journal_lines
// ============================================

export const bankAccounts = sqliteTable('bank_accounts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id).notNull(), // SCOPED DB
  branchId: text('branch_id').references(() => branches.id),
  accountName: text('account_name').notNull(), // Nombre descriptivo (ej: "Banco Nacional - Corriente")
  accountNumber: text('account_number').notNull(), // Número de cuenta enmascarado
  bankName: text('bank_name').notNull(), // Nombre del banco (ej: "Banco Nacional", "BAC")
  accountType: text('account_type', { 
    enum: ['checking', 'savings', 'credit_card', 'loan'] 
  }).default('checking'),
  currency: text('currency').default('CRC'), // ISO 4217
  currentBalanceCents: integer('current_balance_cents').default(0), // Saldo según libros
  lastReconciledBalanceCents: integer('last_reconciled_balance_cents').default(0), // Último saldo conciliado
  lastReconciledAt: integer('last_reconciled_at', { mode: 'number' }), // Fecha última conciliación
  isActive: integer('is_active').default(1),
  // Configuración de importación
  importFormat: text('import_format', { enum: ['csv', 'ofx', 'qif', 'manual'] }).default('csv'),
  csvMapping: text('csv_mapping'), // JSON string con mapeo de columnas
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_bank_company').on(table.companyId),
  index('idx_bank_branch').on(table.branchId),
  index('idx_bank_active').on(table.isActive),
]);

export const bankTransactions = sqliteTable('bank_transactions', {
  id: text('id').primaryKey(),
  bankAccountId: text('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  companyId: text('company_id').references(() => companies.id).notNull(), // SCOPED DB
  // DATOS DE LA TRANSACCIÓN BANCARIA
  transactionDate: integer('transaction_date', { mode: 'number' }).notNull(), // Fecha de la transacción
  postingDate: integer('posting_date', { mode: 'number' }), // Fecha de contabilización
  description: text('description').notNull(), // Descripción del extracto bancario
  reference: text('reference'), // Referencia bancaria (cheque, transferencia, etc.)
  transactionType: text('transaction_type', { 
    enum: ['debit', 'credit', 'fee', 'interest', 'transfer', 'other'] 
  }).default('other'),
  // MONTOS EN CÉNTIMOS
  amountCents: integer('amount_cents').notNull(), // Monto positivo para créditos, negativo para débitos
  balanceAfterCents: integer('balance_after_cents'), // Saldo después de la transacción
  currency: text('currency').default('CRC'),
  exchangeRate: real('exchange_rate').default(1), // Para transacciones en moneda extranjera
  // MATCHING CON JOURNAL LINES
  matchedJournalLineId: text('matched_journal_line_id').references(() => journalLines.id),
  matchStatus: text('match_status', { 
    enum: ['unmatched', 'matched', 'pending_review', 'ignored'] 
  }).default('unmatched'),
  matchConfidenceScore: real('match_confidence_score'), // 0.0 a 1.0 para matching automático
  matchNotes: text('match_notes'), // Notas sobre el matching
  // IMPORTACIÓN
  importBatchId: text('import_batch_id'), // ID del lote de importación
  importSource: text('import_source', { enum: ['csv', 'ofx', 'qif', 'api', 'manual'] }).default('manual'),
  importedAt: integer('imported_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  importedBy: text('imported_by').references(() => users.id),
  // RECONCILIACIÓN
  isReconciled: integer('is_reconciled').default(0),
  reconciledAt: integer('reconciled_at', { mode: 'number' }),
  reconciledBy: text('reconciled_by').references(() => users.id),
  // NOTAS Y AJUSTES
  notes: text('notes'),
  category: text('category'), // Categoría para transacciones no匹配adas
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_banktrans_account').on(table.bankAccountId),
  index('idx_banktrans_company').on(table.companyId),
  index('idx_banktrans_date').on(table.transactionDate),
  index('idx_banktrans_match').on(table.matchStatus),
  index('idx_banktrans_reconciled').on(table.isReconciled),
  index('idx_banktrans_import').on(table.importBatchId),
]);

export const reconciliationBatches = sqliteTable('reconciliation_batches', {
  id: text('id').primaryKey(),
  bankAccountId: text('bank_account_id').notNull().references(() => bankAccounts.id),
  companyId: text('company_id').references(() => companies.id).notNull(), // SCOPED DB
  batchNumber: text('batch_number').unique().notNull(), // Ej: REC-2024-00001
  startDate: integer('start_date', { mode: 'number' }).notNull(), // Inicio del período
  endDate: integer('end_date', { mode: 'number' }).notNull(), // Fin del período
  // SALDOS
  openingBalanceCents: integer('opening_balance_cents').notNull(), // Saldo inicial según banco
  closingBalanceCents: integer('closing_balance_cents').notNull(), // Saldo final según banco
  totalDepositsCents: integer('total_deposits_cents').default(0), // Total depósitos/conciliados
  totalWithdrawalsCents: integer('total_withdrawals_cents').default(0), // Total retiros/conciliados
  // ESTADO
  status: text('status', { 
    enum: ['in_progress', 'completed', 'cancelled'] 
  }).default('in_progress'),
  // DIFERENCIAS
  hasDiscrepancies: integer('has_discrepancies').default(0),
  discrepancyAmountCents: integer('discrepancy_amount_cents').default(0),
  discrepancyNotes: text('discrepancy_notes'),
  // PARTIDAS PENDIENTES
  outstandingDepositsCents: integer('outstanding_deposits_cents').default(0), // Depósitos en tránsito
  outstandingWithdrawalsCents: integer('outstanding_withdrawals_cents').default(0), // Cheques pendientes
  // APROBACIÓN
  reviewedBy: text('reviewed_by').references(() => users.id),
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'number' }),
  // METADATOS
  importFileName: text('import_file_name'), // Nombre del archivo importado
  importedTransactionCount: integer('imported_transaction_count').default(0),
  matchedTransactionCount: integer('matched_transaction_count').default(0),
  manualAdjustmentCount: integer('manual_adjustment_count').default(0),
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  completedAt: integer('completed_at', { mode: 'number' }),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_recon_batch_company').on(table.companyId),
  index('idx_recon_batch_account').on(table.bankAccountId),
  index('idx_recon_batch_status').on(table.status),
  index('idx_recon_batch_dates').on(table.startDate, table.endDate),
]);

export const reconciliationItems = sqliteTable('reconciliation_items', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').notNull().references(() => reconciliationBatches.id, { onDelete: 'cascade' }),
  bankTransactionId: text('bank_transaction_id').references(() => bankTransactions.id),
  journalLineId: text('journal_line_id').references(() => journalLines.id),
  // TIPO DE ITEM
  itemType: text('item_type', { 
    enum: ['matched', 'outstanding_deposit', 'outstanding_withdrawal', 'bank_error', 'book_error'] 
  }).notNull(),
  // MONTOS
  amountCents: integer('amount_cents').notNull(),
  // ESTADO
  isCleared: integer('is_cleared').default(0), // Marcado como conciliado
  clearedAt: integer('cleared_at', { mode: 'number' }),
  clearedBy: text('cleared_by').references(() => users.id),
  // NOTAS
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_recon_item_batch').on(table.batchId),
  index('idx_recon_item_bank').on(table.bankTransactionId),
  index('idx_recon_item_journal').on(table.journalLineId),
  index('idx_recon_item_type').on(table.itemType),
  index('idx_recon_item_cleared').on(table.isCleared),
]);

// ============================================
// TIPOS DRIZZLE PARA LAS NUEVAS TABLAS
// ============================================

export type BankAccount = InferSelectModel<typeof bankAccounts>;
export type NewBankAccount = InferInsertModel<typeof bankAccounts>;

export type BankTransaction = InferSelectModel<typeof bankTransactions>;
export type NewBankTransaction = InferInsertModel<typeof bankTransactions>;

export type ReconciliationBatch = InferSelectModel<typeof reconciliationBatches>;
export type NewReconciliationBatch = InferInsertModel<typeof reconciliationBatches>;

export type ReconciliationItem = InferSelectModel<typeof reconciliationItems>;
export type NewReconciliationItem = InferInsertModel<typeof reconciliationItems>;

// ============================================
// HACIENDA 2026 - FACTURACIÓN ELECTRÓNICA 4.4
// ============================================
// Catálogos de referencia y tablas para normativa Hacienda CR
// ============================================

// CATÁLOGO: Códigos de Actividad Económica (Ministerio de Hacienda)
export const activityCodes = sqliteTable('activity_codes', {
  code: text('code').primaryKey(), // 6 dígitos (ej: "011101")
  description: text('description').notNull(),
  section: text('section'), // Sección del CIIU
  division: text('division'),
  group: text('group'),
  class: text('class'),
  isActive: integer('is_active').default(1),
});

// CATÁLOGO: Instituciones Exoneradoras
export const institutionCodes = sqliteTable('institution_codes', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['ministry', 'autonomous', 'municipality', 'other']
  }),
  isActive: integer('is_active').default(1),
});

// EXONERACIONES FISCALES (por comprobante)
export const taxExemptions = sqliteTable('tax_exemptions', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').references(() => sales.id),
  // Institución que otorga la exoneración
  institutionCode: text('institution_code').notNull(),
  institutionName: text('institution_name').notNull(),
  // Porcentaje de exoneración (0-100)
  exemptionPercentage: real('exemption_percentage').notNull(),
  // Artículo legal que respalda
  legalArticle: text('legal_article').notNull(),
  // Número y fecha de autorización
  authorizationNumber: text('authorization_number'),
  authorizationDate: text('authorization_date'),
  // Monto exonerado en céntimos
  exemptedAmountCents: integer('exempted_amount_cents').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_exemptions_sale').on(table.saleId),
  index('idx_exemptions_institution').on(table.institutionCode),
]);

// LOG DE COMUNICACIÓN CON API DE HACIENDA
export const haciendaApiLog = sqliteTable('hacienda_api_log', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').references(() => sales.id),
  // Tipo de operación
  operationType: text('operation_type', {
    enum: ['send', 'query', 'cancel', 'accept', 'reject']
  }),
  // Estado de la respuesta
  status: text('status', {
    enum: ['pending', 'processing', 'accepted', 'rejected', 'error']
  }),
  // Clave del comprobante
  documentKey: text('document_key'),
  // XML enviado y recibido
  requestXml: text('request_xml'),
  responseXml: text('response_xml'),
  responseCode: text('response_code'),
  responseMessage: text('response_message'),
  // Detalles de error
  errorDetails: text('error_details'),
  // Fechas
  sentAt: text('sent_at'),
  respondedAt: text('responded_at'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_api_log_sale').on(table.saleId),
  index('idx_api_log_key').on(table.documentKey),
  index('idx_api_log_status').on(table.status),
]);

// AUTORIZACIONES ESPECIALES (CAE - Código de Autorización Especial)
export const caeAuthorizations = sqliteTable('cae_authorizations', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  // Número de CAE
  caeNumber: text('cae_number').notNull().unique(),
  // Tipo de documento que autoriza
  documentType: text('document_type', {
    enum: ['01', '02', '03', '04', '08', '09']
  }),
  // Rango de numeración autorizado
  startNumber: text('start_number').notNull(),
  endNumber: text('end_number').notNull(),
  // Fechas de vigencia
  startDate: text('start_date').notNull(),
  expirationDate: text('expiration_date').notNull(),
  // Estado
  status: text('status', {
    enum: ['active', 'expired', 'cancelled', 'suspended']
  }).default('active'),
  // Último número usado
  lastUsedNumber: text('last_used_number'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_cae_company').on(table.companyId),
  index('idx_cae_number').on(table.caeNumber),
  index('idx_cae_status').on(table.status, table.expirationDate),
]);

// ============================================
// TIPOS DRIZZLE PARA HACIENDA 2026
// ============================================

export type ActivityCode = InferSelectModel<typeof activityCodes>;
export type NewActivityCode = InferInsertModel<typeof activityCodes>;

export type InstitutionCode = InferSelectModel<typeof institutionCodes>;
export type NewInstitutionCode = InferInsertModel<typeof institutionCodes>;

export type TaxExemption = InferSelectModel<typeof taxExemptions>;
export type NewTaxExemption = InferInsertModel<typeof taxExemptions>;

export type HaciendaApiLog = InferSelectModel<typeof haciendaApiLog>;
export type NewHaciendaApiLog = InferInsertModel<typeof haciendaApiLog>;

export type CaeAuthorization = InferSelectModel<typeof caeAuthorizations>;
export type NewCaeAuthorization = InferInsertModel<typeof caeAuthorizations>;
