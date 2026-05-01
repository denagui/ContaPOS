import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

// Esquema de base de datos para POS
export interface Product {
	id: string;
	name: string;
	description?: string;
	price: number;
	cost?: number;
	stock: number;
	minStock: number;
	barcode?: string;
	categoryId?: string;
	imageUrl?: string;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Category {
	id: string;
	name: string;
	description?: string;
	active: boolean;
}

export interface Customer {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	balance: number; // Saldo pendiente (fiado)
	creditLimit: number;
	active: boolean;
	createdAt: Date;
}

export interface Sale {
	id: string;
	customerId?: string;
	total: number;
	paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
	status: 'completed' | 'cancelled' | 'pending';
	notes?: string;
	createdAt: Date;
}

export interface SaleItem {
	id: string;
	saleId: string;
	productId: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
}

// Función para crear instancia de DB local (desarrollo)
export async function createLocalDatabase(): Promise<DrizzleD1Database> {
	// En desarrollo, simulamos D1 con SQLite local o memoria
	// En producción, Cloudflare inyecta el binding DB
	throw new Error('D1 no disponible. Configurar wrangler.toml y usar `wrangler dev`');
}

// Schema definitions para Drizzle ORM
export const schema = {
	products: {} as any,
	categories: {} as any,
	customers: {} as any,
	sales: {} as any,
	saleItems: {} as any
};

// Helper para inicializar tablas D1
export const initDB = async (db: DrizzleD1Database) => {
	await db.run(`
		CREATE TABLE IF NOT EXISTS categories (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			active INTEGER DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await db.run(`
		CREATE TABLE IF NOT EXISTS products (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			price REAL NOT NULL,
			cost REAL,
			stock INTEGER DEFAULT 0,
			min_stock INTEGER DEFAULT 5,
			barcode TEXT UNIQUE,
			category_id TEXT REFERENCES categories(id),
			image_url TEXT,
			active INTEGER DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await db.run(`
		CREATE TABLE IF NOT EXISTS customers (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT,
			phone TEXT,
			address TEXT,
			balance REAL DEFAULT 0,
			credit_limit REAL DEFAULT 0,
			active INTEGER DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await db.run(`
		CREATE TABLE IF NOT EXISTS sales (
			id TEXT PRIMARY KEY,
			customer_id TEXT REFERENCES customers(id),
			total REAL NOT NULL,
			payment_method TEXT NOT NULL,
			status TEXT DEFAULT 'completed',
			notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await db.run(`
		CREATE TABLE IF NOT EXISTS sale_items (
			id TEXT PRIMARY KEY,
			sale_id TEXT REFERENCES sales(id),
			product_id TEXT REFERENCES products(id),
			quantity INTEGER NOT NULL,
			unit_price REAL NOT NULL,
			subtotal REAL NOT NULL
		)
	`);

	// Índices para mejorar rendimiento
	await db.run(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
	await db.run(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`);
	await db.run(`CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)`);
	await db.run(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at)`);
};
