import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';

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
  // ISO 42001: Trazabilidad de sugerencias de IA en items
  aiSuggestionId: text('ai_suggestion_id'),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_sale_items_sale').on(table.saleId),
  index('idx_sale_items_product').on(table.productId),
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
  // DOCUMENTOS TRIBUTARIOS COSTA RICA
  documentType: text('document_type', { 
    enum: ['cedula_fisica', 'cedula_juridica', 'dimex', 'nite', 'pasaporte'] 
  }).default('cedula_fisica'),
  documentNumber: text('document_number'),
  // DIRECCIÓN COMPLETA
  province: text('province'),
  canton: text('canton'),
  district: text('district'),
  address: text('address'),
  postalCode: text('postal_code'),
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
