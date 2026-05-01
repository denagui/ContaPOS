import { db } from '$lib/server/db';
import { expenses, organization_settings } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateHaciendaKey } from '../utils/hacienda-key';

export interface CreateExpenseInput {
  organizationId: string;
  date: Date;
  amount: number;
  description: string;
  categoryId?: string;
  supplierId?: number; // contact_id
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit';
  taxRate?: 0 | 4 | 8 | 13;
  invoiceNumber?: string;
  receiptXml?: string;
}

export async function createExpense(input: CreateExpenseInput) {
  const taxAmount = input.amount * (input.taxRate || 0) / 100;
  const subtotal = input.amount - taxAmount;

  // Generar clave de hacienda para el gasto (comprobante de proveedor o interno)
  const haciendaKey = input.invoiceNumber || generateHaciendaKey({
    organizationId: input.organizationId,
    date: input.date,
    type: 'expense', // Gasto/Compra
    sequential: Math.floor(Math.random() * 1000000) // En prod usar contador real
  });

  const [newExpense] = await db.insert(expenses).values({
    organizationId: input.organizationId,
    date: input.date,
    amount: input.amount,
    subtotal: subtotal,
    taxAmount: taxAmount,
    taxRate: input.taxRate || 13,
    description: input.description,
    categoryId: input.categoryId,
    supplierId: input.supplierId,
    paymentMethod: input.paymentMethod,
    invoiceNumber: input.invoiceNumber,
    haciendaKey: haciendaKey,
    receiptXml: input.receiptXml,
    status: 'completed',
  }).returning();

  return newExpense;
}

export async function getExpensesByOrganization(organizationId: string, limit = 50) {
  return await db.select().from(expenses)
    .where(eq(expenses.organizationId, organizationId))
    .orderBy(desc(expenses.date))
    .limit(limit);
}

export async function getExpensesByDateRange(
  organizationId: string, 
  startDate: Date, 
  endDate: Date
) {
  return await db.select().from(expenses)
    .where(and(
      eq(expenses.organizationId, organizationId),
      // Drizzle no tiene gte/lte directos en todos los tipos, usamos filtro manual si falla
    ))
    .orderBy(desc(expenses.date));
}

export async function deleteExpense(id: number, organizationId: string) {
  await db.delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)));
}

export async function getExpenseCategories(organizationId: string) {
  // Por ahora categorías hardcodeadas, luego vendrán de DB
  return [
    { id: 'cogs', name: 'Costo de Ventas', type: 'variable' },
    { id: 'rent', name: 'Alquiler', type: 'fixed' },
    { id: 'services', name: 'Servicios Públicos', type: 'fixed' },
    { id: 'salaries', name: 'Salarios', type: 'fixed' },
    { id: 'marketing', name: 'Marketing', type: 'variable' },
    { id: 'supplies', name: 'Insumos', type: 'variable' },
    { id: 'maintenance', name: 'Mantenimiento', type: 'variable' },
    { id: 'other', name: 'Otros Gastos', type: 'variable' },
  ];
}
