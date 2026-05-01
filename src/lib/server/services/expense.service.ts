import { db } from '$lib/server/db';
import { expenses, organizationSettings } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateHaciendaKey } from '../utils/hacienda-key';

export interface CreateExpenseInput {
  organizationId: string;
  date: Date;
  amount: number;
  description: string;
  categoryId?: string;
  supplierId?: string; // contact_id
  paymentMethod: 'cash' | 'card' | 'transfer' | 'sinpe' | 'credit';
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
    date: input.date.toISOString(),
    amount: input.amount,
    subtotal: subtotal,
    taxAmount: taxAmount,
    taxRate: input.taxRate || 13,
    description: input.description,
    category: input.categoryId || 'other',
    paymentMethod: input.paymentMethod,
    receiptNumber: input.invoiceNumber,
    haciendaKey: haciendaKey,
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

export async function deleteExpense(id: string, organizationId: string) {
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

export async function getOrganizationSetting(organizationId: string, key: string) {
  const [setting] = await db.select().from(organizationSettings)
    .where(and(
      eq(organizationSettings.organizationId, organizationId),
      eq(organizationSettings.settingKey, key)
    ));
  
  return setting?.settingValue || null;
}

export async function setOrganizationSetting(organizationId: string, key: string, value: string, type: 'string' | 'number' | 'boolean' | 'json' = 'string') {
  const existing = await getOrganizationSetting(organizationId, key);
  
  if (existing) {
    await db.update(organizationSettings)
      .set({ settingValue: value, type, updatedAt: new Date().toISOString() })
      .where(and(
        eq(organizationSettings.organizationId, organizationId),
        eq(organizationSettings.settingKey, key)
      ));
  } else {
    await db.insert(organizationSettings).values({
      organizationId,
      settingKey: key,
      settingValue: value,
      type,
    });
  }
}
