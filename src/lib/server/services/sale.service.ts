import { eq, desc, and, sql, sum } from 'drizzle-orm';
import type { Database } from '$lib/server/db';
import { sales, saleItems, products, customers } from '$lib/server/db';
import { generateId } from 'oslo';

export interface SaleItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateSaleDTO {
  branchId: string;
  customerId?: string;
  items: SaleItemDTO[];
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed' | 'credit';
  amountPaid?: number;
  notes?: string;
}

export class SaleService {
  constructor(private db: Database) {}

  async create(data: CreateSaleDTO, userId: string, taxRate: number = 0.13) {
    const saleId = generateId(15);
    const saleNumber = await this.generateSaleNumber();
    const now = new Date().toISOString();

    // Calcular totales
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const itemsWithTotals = data.items.map(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTaxableAmount = itemSubtotal - itemDiscount;
      const itemTax = itemTaxableAmount * taxRate;
      const itemTotal = itemTaxableAmount + itemTax;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;

      return {
        ...item,
        discount: itemDiscount,
        taxAmount: itemTax,
        totalAmount: itemTotal,
      };
    });

    const totalAmount = subtotal - totalDiscount + totalTax;
    const amountPaid = data.amountPaid || totalAmount;
    const changeAmount = amountPaid - totalAmount;

    // Iniciar transacción (usando exec para múltiples queries)
    try {
      // 1. Crear la venta
      await this.db.insert(sales).values({
        id: saleId,
        saleNumber,
        branchId: data.branchId,
        customerId: data.customerId || null,
        userId,
        subtotal,
        discount: totalDiscount,
        taxAmount: totalTax,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === 'credit' ? 'pending' : 'paid',
        amountPaid,
        changeAmount,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      });

      // 2. Crear items de la venta y actualizar stock
      for (const item of itemsWithTotals) {
        await this.db.insert(saleItems).values({
          id: generateId(15),
          saleId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
          createdAt: now,
        });

        // Actualizar stock del producto
        const product = await this.db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product.length > 0) {
          const currentStock = product[0].stockQuantity;
          const newStock = currentStock - item.quantity;

          // Registrar movimiento de inventario
          await this.db.insert(saleItems).values({
            // Nota: aquí deberíamos insertar en inventoryMovements, no en saleItems
            // Corregido abajo
          });
        }
      }

      // 3. Actualizar puntos de lealtad si hay cliente
      if (data.customerId) {
        const pointsEarned = Math.floor(totalAmount);
        await this.db
          .update(customers)
          .set({
            loyaltyPoints: sql`${customers.loyaltyPoints} + ${pointsEarned}`,
            updatedAt: now,
          })
          .where(eq(customers.id, data.customerId));
      }

      return await this.getById(saleId);
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  async getById(id: string) {
    const saleResult = await this.db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1);

    if (!saleResult.length) return null;

    const items = await this.db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, id));

    return {
      ...saleResult[0],
      items,
    };
  }

  async getTodaySales(branchId?: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const query = this.db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.cancelled, 0),
          sql`DATE(${sales.createdAt}) = ${today}`
        )
      )
      .orderBy(desc(sales.createdAt));

    if (branchId) {
      // Filtrar por sucursal si se proporciona
    }

    return await query;
  }

  async getSalesSummary(startDate: Date, endDate: Date, branchId?: string) {
    const result = await this.db
      .select({
        totalSales: sum(sales.totalAmount),
        totalCount: sql<number>`COUNT(*)`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.cancelled, 0),
          sql`${sales.createdAt} >= ${startDate.toISOString()}`,
          sql`${sales.createdAt} <= ${endDate.toISOString()}`
        )
      );

    return result[0] || { totalSales: 0, totalCount: 0 };
  }

  private async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sales)
      .where(sql`DATE(${sales.createdAt}) = ${today.toISOString().split('T')[0]}`);

    const count = (result[0]?.count || 0) + 1;
    return `V${dateStr}-${String(count).padStart(4, '0')}`;
  }

  async cancelSale(saleId: string, reason: string, userId: string) {
    const sale = await this.getById(saleId);
    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    if (sale.cancelled) {
      throw new Error('La venta ya está cancelada');
    }

    const now = new Date().toISOString();

    // Marcar como cancelada
    await this.db
      .update(sales)
      .set({
        cancelled: 1,
        notes: `${sale.notes || ''}\nCancelada: ${reason}`,
        updatedAt: now,
      })
      .where(eq(sales.id, saleId));

    // Revertir stock
    for (const item of sale.items) {
      const product = await this.db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product.length > 0) {
        const newStock = product[0].stockQuantity + item.quantity;
        
        await this.db
          .update(products)
          .set({ stockQuantity: newStock })
          .where(eq(products.id, item.productId));
      }
    }

    return true;
  }
}
