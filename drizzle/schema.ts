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
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'manager', 'cashier'] }).default('cashier'),
  active: integer('active').default(1),
  // Epoch 13 - NIIF compliant
  createdAt: integer('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (table) => [
  index('idx_users_username').on(table.username),
  index('idx_users_email').on(table.email),
]);

export const branches = sqliteTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  currency: text('currency').default('USD'),
  taxRate: real('tax_rate').default(0.13),
  active: integer('active').default(1),
  createdAt: text('created_at').defaultCurrentTimestamp(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id').references(() => categories.id),
  active: integer('active').default(1),
  createdAt: text('created_at').defaultCurrentTimestamp(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
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
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_products_barcode').on(table.barcode),
  index('idx_products_sku').on(table.sku),
  index('idx_products_category').on(table.categoryId),
  index('idx_products_active').on(table.active),
  index('idx_products_cabys').on(table.cabysCode),
]);

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  // TIPOS DE DOCUMENTO COSTA RICA
  documentType: text('document_type', { 
    enum: ['cedula_fisica', 'cedula_juridica', 'dimex', 'nite', 'pasaporte'] 
  }).default('cedula_fisica'),
  documentNumber: text('document_number').unique().notNull(),
  name: text('name').notNull(),
  tradeName: text('trade_name'), // Nombre comercial (Hacienda)
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  birthDate: text('birth_date'),
  notes: text('notes'),
  creditLimit: real('credit_limit').default(0),
  currentBalance: real('current_balance').default(0),
  creditDays: integer('credit_days').default(0), // Plazo de crédito en días
  loyaltyPoints: integer('loyalty_points').default(0),
  // TIPO DE CONTACTO: customer, supplier, both
  contactType: text('contact_type', { enum: ['customer', 'supplier', 'both'] }).default('customer'),
  active: integer('active').default(1),
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_customers_document').on(table.documentNumber),
  index('idx_customers_type').on(table.contactType),
]);

export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  documentNumber: text('document_number').unique().notNull(),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  paymentTerms: text('payment_terms'),
  active: integer('active').default(1),
  createdAt: text('created_at').defaultCurrentTimestamp(),
});

// ============================================
// TABLAS DE TRANSACCIONES
// ============================================

export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  saleNumber: text('sale_number').unique().notNull(),
  branchId: text('branch_id').references(() => branches.id),
  customerId: text('customer_id').references(() => customers.id),
  userId: text('user_id').references(() => users.id),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').default(0),
  taxAmount: real('tax_amount').notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method', { enum: ['cash', 'card', 'transfer', 'mixed', 'credit'] }),
  paymentStatus: text('payment_status', { enum: ['paid', 'pending', 'partial'] }).default('paid'),
  amountPaid: real('amount_paid').default(0),
  changeAmount: real('change_amount').default(0),
  notes: text('notes'),
  cancelled: integer('cancelled').default(0),
  // CLAVE HACIENDA PARA FACTURACIÓN ELECTRÓNICA (50 dígitos)
  haciendaKey: text('hacienda_key'),
  haciendaStatus: text('hacienda_status', { 
    enum: ['pending', 'sent', 'accepted', 'rejected'] 
  }).default('pending'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_sales_customer').on(table.customerId),
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
  unitPrice: real('unit_price').notNull(),
  discount: real('discount').default(0),
  taxAmount: real('tax_amount').notNull(),
  totalAmount: real('total_amount').notNull(),
  createdAt: text('created_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_sale_items_sale').on(table.saleId),
  index('idx_sale_items_product').on(table.productId),
]);

export const inventoryMovements = sqliteTable('inventory_movements', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id),
  movementType: text('movement_type', { enum: ['entry', 'exit', 'adjustment', 'return', 'transfer'] }),
  quantity: real('quantity').notNull(),
  previousStock: integer('previous_stock'),
  newStock: integer('new_stock'),
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),
  userId: text('user_id').references(() => users.id),
  notes: text('notes'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_inventory_product').on(table.productId),
  index('idx_inventory_created').on(table.createdAt),
]);

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  purchaseNumber: text('purchase_number').unique().notNull(),
  supplierId: text('supplier_id').references(() => suppliers.id),
  branchId: text('branch_id').references(() => branches.id),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').default(0),
  taxAmount: real('tax_amount').notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentStatus: text('payment_status', { enum: ['paid', 'pending', 'partial'] }).default('pending'),
  received: integer('received').default(0),
  notes: text('notes'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
});

export const purchaseItems = sqliteTable('purchase_items', {
  id: text('id').primaryKey(),
  purchaseId: text('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id),
  quantity: real('quantity').notNull(),
  unitCost: real('unit_cost').notNull(),
  totalAmount: real('total_amount').notNull(),
  createdAt: text('created_at').defaultCurrentTimestamp(),
});

// ============================================
// TABLAS DE CRM Y FIDELIZACIÓN
// ============================================

export const customerInteractions = sqliteTable('customer_interactions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  interactionType: text('interaction_type', { enum: ['call', 'email', 'visit', 'note', 'complaint', 'suggestion'] }),
  description: text('description').notNull(),
  followUpDate: text('follow_up_date'),
  resolved: integer('resolved').default(0),
  userId: text('user_id').references(() => users.id),
  createdAt: text('created_at').defaultCurrentTimestamp(),
});

export const loyaltyTransactions = sqliteTable('loyalty_transactions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  transactionType: text('transaction_type', { enum: ['earn', 'redeem', 'adjustment', 'expire'] }),
  points: integer('points').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),
  description: text('description'),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
});

export const credits = sqliteTable('credits', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => customers.id),
  saleId: text('sale_id').references(() => sales.id),
  amount: real('amount').notNull(),
  paidAmount: real('paid_amount').default(0),
  remainingAmount: real('remaining_amount').notNull(),
  dueDate: text('due_date'),
  status: text('status', { enum: ['active', 'paid', 'overdue', 'cancelled'] }).default('active'),
  notes: text('notes'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_credits_customer').on(table.customerId),
  index('idx_credits_status').on(table.status),
]);

export const creditPayments = sqliteTable('credit_payments', {
  id: text('id').primaryKey(),
  creditId: text('credit_id').references(() => credits.id),
  amount: real('amount').notNull(),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  userId: text('user_id').references(() => users.id),
  createdAt: text('created_at').defaultCurrentTimestamp(),
});

// ============================================
// TABLAS DE CONFIGURACIÓN Y AUDITORÍA
// ============================================

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  type: text('type').default('string'),
  description: text('description'),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
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
  openedAt: text('opened_at').defaultCurrentTimestamp(),
  closedAt: text('closed_at'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
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
  createdAt: text('created_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_audit_user').on(table.userId),
  index('idx_audit_created').on(table.createdAt),
]);

// ============================================
// TABLAS DE CONTABILIDAD Y ORGANIZACIÓN
// ============================================

export const organizations = sqliteTable('organizations', {
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
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  expenseNumber: text('expense_number').unique(),
  amount: real('amount').notNull(),
  subtotal: real('subtotal').notNull(),
  taxAmount: real('tax_amount').default(0),
  taxRate: real('tax_rate').default(0.13),
  category: text('category').notNull(),
  description: text('description').notNull(),
  date: text('date').notNull(),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'card', 'transfer', 'sinpe', 'credit']
  }).notNull(),
  receiptNumber: text('receipt_number'),
  haciendaKey: text('hacienda_key'),
  status: text('status', { enum: ['pending', 'completed', 'cancelled'] }).default('completed'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_expenses_org').on(table.organizationId),
  index('idx_expenses_date').on(table.date),
  index('idx_expenses_category').on(table.category),
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
  // Fechas
  paymentDate: text('payment_date').notNull(),
  dueDate: text('due_date'), // Fecha de vencimiento del abono
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
  createdAt: text('created_at').defaultCurrentTimestamp(),
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
  organizationId: text('organization_id').references(() => organizations.id),
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
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_contacts_org').on(table.organizationId),
  index('idx_contacts_type').on(table.contactType),
  index('idx_contacts_document').on(table.documentNumber),
  index('idx_contacts_active').on(table.active),
]);

// ============================================
// CONFIGURACIÓN DE ORGANIZACIÓN
// ============================================

export const organizationSettings = sqliteTable('organization_settings', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  settingKey: text('setting_key').notNull(),
  settingValue: text('setting_value').notNull(), // JSON string para valores complejos
  type: text('type', { enum: ['string', 'number', 'boolean', 'json'] }).default('string'),
  description: text('description'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_org_settings_org').on(table.organizationId),
  index('idx_org_settings_key').on(table.settingKey),
]);
