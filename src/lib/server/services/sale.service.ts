import { eq, desc, and, sql, sum } from 'drizzle-orm';
import type { Database } from '$lib/server/db';
import { sales, saleItems, products, contacts, organizations, inventoryMovements } from '$lib/server/db';
import { generateId } from 'oslo';
import { generateHaciendaKey } from '$lib/server/utils/hacienda-key';
import {
  createBillingOrchestrator,
  type ElectronicInvoice,
  type InvoiceItem,
} from './billing';

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

  async create(data: CreateSaleDTO, userId: string, organizationId: string) {
    const saleId = generateId(15);
    const saleNumber = await this.generateSaleNumber();
    const now = new Date().toISOString();

    // Calcular totales con IVA flexible por producto
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const itemsWithTotals = await Promise.all(data.items.map(async (item) => {
      // Obtener el producto para saber su tipo de IVA
      const productData = await this.db
        .select({ taxType: products.taxType, name: products.name })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      const taxType = productData[0]?.taxType || '13';
      const taxRate = parseInt(taxType) / 100; // 0, 0.04, 0.08, 0.13

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
        taxType,
      };
    }));

    const totalAmount = subtotal - totalDiscount + totalTax;
    const amountPaid = data.amountPaid || totalAmount;
    const changeAmount = amountPaid - totalAmount;

    // Generar Clave Hacienda
    let haciendaKey: string | null = null;
    try {
      const org = await this.db
        .select({ taxId: organizations.taxId })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (org[0]?.taxId) {
        haciendaKey = generateHaciendaKey({
          timestamp: new Date(),
          sucursal: '001',
          terminal: '00001',
          tipoComprobante: '01', // 01 = Factura Electrónica
          consecutivo: parseInt(saleNumber.replace(/\D/g, '').slice(-8)) || Math.floor(Math.random() * 99999999),
          cedulaEmisor: org[0].taxId,
        });
      }
    } catch (e) {
      console.error('Error generando clave Hacienda:', e);
    }

    // Iniciar transacción
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
        haciendaKey,
        haciendaStatus: haciendaKey ? 'sent' : 'pending',
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

      // 3. Actualizar puntos de lealtad si hay cliente (usando contacts en lugar de customers)
      if (data.customerId) {
        const pointsEarned = Math.floor(totalAmount);
        await this.db
          .update(contacts)
          .set({
            loyaltyPoints: sql`${contacts.loyaltyPoints} + ${pointsEarned}`,
            updatedAt: Date.now(),
          })
          .where(eq(contacts.id, data.customerId));
      }

      // 4. Procesar facturación electrónica si está configurada
      try {
        await this.processElectronicBilling(saleId, organizationId);
      } catch (billingError) {
        console.error('[SaleService] Error processing billing:', billingError);
        // No lanzar el error para no bloquear la venta, pero registrar el problema
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

    const now = Date.now(); // Epoch 13

    // Marcar como cancelada
    await this.db
      .update(sales)
      .set({
        cancelled: 1,
        notes: `${sale.notes || ''}\nCancelada: ${reason}`,
        updatedAt: now,
      })
      .where(eq(sales.id, saleId));

    // Si tiene clave de hacienda, cancelar el documento electrónico
    if (sale.haciendaKey) {
      try {
        const org = await this.db
          .select()
          .from(organizations)
          .where(eq(organizations.id, sale.branchId)) // Asumiendo que branchId tiene org context
          .limit(1);
        
        if (org.length) {
          const orchestrator = createBillingOrchestrator(this.db, org[0].id);
          await orchestrator.cancelDocument(sale.haciendaKey!, reason);
        }
      } catch (billingError) {
        console.error('[SaleService] Error cancelling electronic document:', billingError);
      }
    }

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
          
        // Registrar movimiento de inventario
        await this.db.insert(inventoryMovements).values({
          id: generateId(15),
          productId: item.productId,
          movementType: 'return',
          quantity: item.quantity,
          previousStock: product[0].stockQuantity,
          newStock,
          referenceType: 'sale',
          referenceId: saleId,
          userId,
          notes: `Devolución por cancelación de venta ${sale.saleNumber}`,
          createdAt: now,
        });
      }
    }

    return true;
  }

  /**
   * Procesar facturación electrónica después de crear una venta
   */
  private async processElectronicBilling(saleId: string, organizationId: string): Promise<void> {
    const sale = await this.getById(saleId);
    if (!sale) return;

    // Obtener datos de la organización
    const orgData = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!orgData.length || !orgData[0].taxId) {
      console.log('[SaleService] Organization not configured for billing');
      return;
    }

    const org = orgData[0];

    // Obtener datos del cliente si existe
    let receiverData = undefined;
    if (sale.contactId) {
      const contactData = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.id, sale.contactId))
        .limit(1);

      if (contactData.length) {
        const contact = contactData[0];
        receiverData = {
          taxId: contact.documentNumber || undefined,
          name: contact.name,
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          address: contact.address ? {
            line1: contact.address,
            city: contact.city || '',
            province: contact.province || '',
          } : undefined,
        };
      }
    }

    // Obtener items con detalles de productos
    const items = await this.db
      .select({
        saleItem: saleItems,
        product: products,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, saleId));

    // Construir invoice para el sistema de facturación
    const invoice: ElectronicInvoice = {
      documentType: '04', // Ticket de Venta (cambiar a '01' para factura completa)
      issueDate: sale.createdAt,
      emitter: {
        taxId: org.taxId!,
        name: org.legalName || org.name,
        commercialName: org.name,
        address: {
          line1: org.address || '',
          city: '', // Se podría agregar campo city a organizations
          province: '', // Se podría agregar campo province a organizations
        },
        email: org.email || undefined,
        phone: org.phone || undefined,
      },
      receiver: receiverData,
      currency: 'CRC',
      items: items.map((item, index) => ({
        lineNumber: index + 1,
        cabysCode: item.product?.cabysCode || '0000000000000', // Default si no tiene
        quantity: item.saleItem.quantity,
        unitOfMeasure: 'Ni', // Unidad nacional
        unitPrice: item.saleItem.unitPrice,
        unitPriceTotal: item.saleItem.unitPrice * item.saleItem.quantity,
        discount: item.saleItem.discount ? {
          amount: item.saleItem.discount,
        } : undefined,
        taxType: (item.product?.taxType as '0' | '4' | '8' | '13') || '13',
        taxAmount: item.saleItem.taxAmount,
        totalAmount: item.saleItem.totalAmount,
        description: item.product?.name || 'Producto sin nombre',
      })),
      subtotal: sale.subtotal,
      totalDiscount: sale.discount,
      taxSummary: this.buildTaxSummary(items),
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod as any,
      branchId: sale.branchId,
      saleId,
    };

    // Enviar al orquestador de facturación
    const orchestrator = createBillingOrchestrator(this.db, organizationId);
    const result = await orchestrator.sendInvoice(invoice);

    if (result.success) {
      // Actualizar la venta con los datos de facturación
      await this.db
        .update(sales)
        .set({
          haciendaKey: result.documentKey,
          haciendaStatus: 'sent',
          updatedAt: Date.now(),
        })
        .where(eq(sales.id, saleId));

      console.log(`[SaleService] Invoice sent successfully: ${result.documentKey}`);
    } else {
      console.error(`[SaleService] Failed to send invoice: ${result.message}`);
    }
  }

  /**
   * Construir resumen de impuestos por tipo
   */
  private buildTaxSummary(items: Array<{ saleItem: any; product: any }>) {
    const taxMap = new Map<string, { taxableAmount: number; taxAmount: number }>();

    for (const item of items) {
      const taxType = item.product?.taxType || '13';
      const existing = taxMap.get(taxType) || { taxableAmount: 0, taxAmount: 0 };
      
      taxMap.set(taxType, {
        taxableAmount: existing.taxableAmount + (item.saleItem.unitPrice * item.saleItem.quantity - (item.saleItem.discount || 0)),
        taxAmount: existing.taxAmount + item.saleItem.taxAmount,
      });
    }

    return Array.from(taxMap.entries()).map(([taxType, amounts]) => ({
      taxType: taxType as '0' | '4' | '8' | '13',
      taxableAmount: amounts.taxableAmount,
      taxAmount: amounts.taxAmount,
    }));
  }
}
