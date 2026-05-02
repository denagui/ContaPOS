-- ==========================================
-- ESQUEMA COMPLETO PARA POS DE PULPERÍAS/SODAS
-- Cloudflare D1 (SQLite)
-- ==========================================

-- 1. GESTIÓN DE USUARIOS Y SEGURIDAD
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'cashier' CHECK(role IN ('admin', 'manager', 'cashier')),
    active INTEGER DEFAULT 1 NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login TEXT
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
);

-- 2. CONFIGURACIÓN DEL NEGOCIO (ADMIN)
CREATE TABLE IF NOT EXISTS business_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    business_name TEXT NOT NULL,
    tax_id TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'USD' NOT NULL,
    tax_rate REAL DEFAULT 0.13 NOT NULL,
    ticket_footer TEXT,
    whatsapp_enabled INTEGER DEFAULT 0,
    whatsapp_message_template TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. CATEGORÍAS Y PROVEEDORES
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES categories(id),
    color TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT,
    credit_limit REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    notes TEXT,
    active INTEGER DEFAULT 1 NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. PRODUCTOS E INVENTARIO
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    alt_barcodes TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category_id TEXT REFERENCES categories(id),
    supplier_id TEXT REFERENCES suppliers(id),
    cost_price REAL DEFAULT 0 NOT NULL,
    sell_price REAL NOT NULL,
    min_stock INTEGER DEFAULT 5,
    current_stock INTEGER DEFAULT 0 NOT NULL,
    unit TEXT DEFAULT 'unit',
    image_url TEXT,
    is_service INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS products_barcode_idx ON products(barcode);
CREATE INDEX IF NOT EXISTS products_sku_idx ON products(sku);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id),
    type TEXT NOT NULL CHECK(type IN ('sale', 'purchase', 'adjustment', 'return', 'transfer')),
    quantity INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT,
    reference_id TEXT,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. CLIENTES Y CRM
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    tax_id TEXT,
    address TEXT,
    loyalty_points INTEGER DEFAULT 0,
    credit_limit REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone);

-- 6. VENTAS (POS)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE,
    pos_id TEXT DEFAULT 'main',
    customer_id TEXT REFERENCES customers(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    subtotal REAL NOT NULL,
    tax_amount REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'transfer', 'mixed', 'credit')),
    payment_status TEXT DEFAULT 'paid' CHECK(payment_status IN ('paid', 'pending', 'partial')),
    amount_paid REAL DEFAULT 0,
    change_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(created_at);
CREATE INDEX IF NOT EXISTS sales_customer_idx ON sales(customer_id);

CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    barcode TEXT,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    total REAL NOT NULL
);

-- 7. SISTEMA DE FIADO / CRÉDITOS
CREATE TABLE IF NOT EXISTS customer_credits (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    sale_id TEXT NOT NULL REFERENCES sales(id),
    amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paid', 'overdue', 'cancelled')),
    due_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS credit_payments (
    id TEXT PRIMARY KEY,
    credit_id TEXT NOT NULL REFERENCES customer_credits(id),
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. FACTURACIÓN ELECTRÓNICA
CREATE TABLE IF NOT EXISTS electronic_invoices (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id),
    consecutive_number TEXT UNIQUE NOT NULL,
    xml_content TEXT,
    json_content TEXT,
    hash_code TEXT,
    qr_code_data TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'signed', 'sent', 'accepted', 'rejected')),
    api_response TEXT,
    emission_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_logs (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id),
    method TEXT NOT NULL CHECK(method IN ('print', 'whatsapp', 'email', 'download')),
    recipient TEXT,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. COMPRAS A PROVEEDORES
CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL REFERENCES suppliers(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'ordered', 'received', 'cancelled')),
    total_cost REAL DEFAULT 0,
    notes TEXT,
    order_date TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    received_date TEXT
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    cost_price REAL NOT NULL,
    total REAL NOT NULL
);

-- DATOS INICIALES
INSERT OR IGNORE INTO business_settings (id, business_name, currency, tax_rate) 
VALUES ('main', 'Mi Pulpería', 'USD', 0.13);

INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role) 
VALUES ('admin-001', 'admin@local.com', 'hash_pendiente', 'Administrador', 'admin');
