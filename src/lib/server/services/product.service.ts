import { eq, like, desc, and, sql } from 'drizzle-orm';
import type { Database } from '$lib/server/db';
import { products, categories, inventoryMovements } from '$lib/server/db';
import { generateId } from 'oslo';

export interface CreateProductDTO {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  costPrice?: number;
  salePrice: number;
  stockQuantity?: number;
  minStock?: number;
  unit?: string;
  imageUrl?: string;
  taxable?: boolean;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  id: string;
}

export class ProductService {
  constructor(private db: Database) {}

  async getAll(limit: number = 100, offset: number = 0) {
    return await this.db
      .select()
      .from(products)
      .where(eq(products.active, 1))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getById(id: string) {
    const result = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.active, 1)))
      .limit(1);
    
    return result[0] || null;
  }

  async getByBarcode(barcode: string) {
    const result = await this.db
      .select()
      .from(products)
      .where(and(eq(products.barcode, barcode), eq(products.active, 1)))
      .limit(1);
    
    return result[0] || null;
  }

  async search(query: string, limit: number = 20) {
    const searchTerm = `%${query}%`;
    return await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.active, 1),
          like(products.name, searchTerm)
        )
      )
      .limit(limit);
  }

  async create(data: CreateProductDTO, userId?: string) {
    const id = generateId(15);
    const now = new Date().toISOString();

    // Insertar producto
    await this.db.insert(products).values({
      id,
      ...data,
      taxable: data.taxable ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });

    // Registrar movimiento de inventario inicial si hay stock
    if (data.stockQuantity && data.stockQuantity > 0 && userId) {
      await this.db.insert(inventoryMovements).values({
        id: generateId(15),
        productId: id,
        movementType: 'entry',
        quantity: data.stockQuantity,
        previousStock: 0,
        newStock: data.stockQuantity,
        referenceType: 'initial_stock',
        referenceId: id,
        userId,
        notes: 'Stock inicial',
        createdAt: now,
      });
    }

    return await this.getById(id);
  }

  async update(data: UpdateProductDTO, userId?: string) {
    const existing = await this.getById(data.id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    const { id, ...updateData } = data;
    const now = new Date().toISOString();

    // Actualizar producto
    await this.db
      .update(products)
      .set({
        ...updateData,
        taxable: updateData.taxable ? 1 : 0,
        updatedAt: now,
      })
      .where(eq(products.id, id));

    return await this.getById(id);
  }

  async delete(id: string) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    // Soft delete
    await this.db
      .update(products)
      .set({ active: 0 })
      .where(eq(products.id, id));

    return true;
  }

  async adjustStock(productId: string, quantity: number, type: 'entry' | 'exit' | 'adjustment', userId: string, notes?: string) {
    const product = await this.getById(productId);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;

    if (newStock < 0) {
      throw new Error('No hay suficiente stock');
    }

    const now = new Date().toISOString();

    // Registrar movimiento
    await this.db.insert(inventoryMovements).values({
      id: generateId(15),
      productId,
      movementType: type,
      quantity: Math.abs(quantity),
      previousStock,
      newStock,
      referenceType: 'manual_adjustment',
      referenceId: productId,
      userId,
      notes: notes || `Ajuste de stock: ${quantity > 0 ? '+' : ''}${quantity}`,
      createdAt: now,
    });

    // Actualizar stock del producto
    await this.db
      .update(products)
      .set({ 
        stockQuantity: newStock,
        updatedAt: now,
      })
      .where(eq(products.id, productId));

    return { previousStock, newStock };
  }

  async getLowStock(minStock?: number) {
    const threshold = minStock || 5;
    return await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.active, 1),
          sql`${products.stockQuantity} <= ${threshold}`
        )
      )
      .orderBy(products.stockQuantity);
  }

  async getCategories() {
    return await this.db
      .select()
      .from(categories)
      .where(eq(categories.active, 1))
      .orderBy(categories.name);
  }
}
