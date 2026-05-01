import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';

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
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
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
  costPrice: real('cost_price').default(0),
  salePrice: real('sale_price').notNull(),
  stockQuantity: integer('stock_quantity').default(0),
  minStock: integer('min_stock').default(5),
  maxStock: integer('max_stock'),
  unit: text('unit').default('unit'),
  imageUrl: text('image_url'),
  taxable: integer('taxable').default(1),
  active: integer('active').default(1),
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_products_barcode').on(table.barcode),
  index('idx_products_sku').on(table.sku),
  index('idx_products_category').on(table.categoryId),
  index('idx_products_active').on(table.active),
]);

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  documentType: text('document_type', { enum: ['DNI', 'CPF', 'CE', 'RUC'] }).default('DNI'),
  documentNumber: text('document_number').unique().notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  birthDate: text('birth_date'),
  notes: text('notes'),
  creditLimit: real('credit_limit').default(0),
  currentBalance: real('current_balance').default(0),
  loyaltyPoints: integer('loyalty_points').default(0),
  active: integer('active').default(1),
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_customers_document').on(table.documentNumber),
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
  createdAt: text('created_at').defaultCurrentTimestamp(),
  updatedAt: text('updated_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_sales_customer').on(table.customerId),
  index('idx_sales_user').on(table.userId),
  index('idx_sales_branch').on(table.branchId),
  index('idx_sales_created_at').on(table.createdAt),
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
