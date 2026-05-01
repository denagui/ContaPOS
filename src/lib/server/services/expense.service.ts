import { db } from '$lib/server/db';
import { expenses, organizationSettings } from '$lib/server/db/schema';
import { eq, and, desc, sum, sql } from 'drizzle-orm';
import { generateHaciendaKey } from '../utils/hacienda-key';

export interface CreateExpenseInput {
  organizationId: string;
  date: Date;
  amount: number;
  description: string;
  categoryId?: string;
  niifCategory?: 'cost_of_sales' | 'operating_expense' | 'employee_benefit' | 'depreciation' | 'financial_expense' | 'other_expense' | 'non_operating_expense';
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
    type: 'expense',
    sequential: Math.floor(Math.random() * 1000000)
  });

  const [newExpense] = await db.insert(expenses).values({
    organizationId: input.organizationId,
    date: input.date.getTime(), // Epoch 13
    amount: input.amount,
    subtotal: subtotal,
    taxAmount: taxAmount,
    taxRate: input.taxRate || 13,
    description: input.description,
    category: input.categoryId || 'other',
    niifCategory: input.niifCategory || 'operating_expense',
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
      sql`${expenses.date} >= ${startDate.getTime()}`,
      sql`${expenses.date} <= ${endDate.getTime()}`
    ))
    .orderBy(desc(expenses.date));
}

export async function getNiifSummary(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const result = await db.select({
    niifCategory: expenses.niifCategory,
    totalAmount: sum(expenses.amount).mapWith(Number),
    totalSubtotal: sum(expenses.subtotal).mapWith(Number),
    totalTax: sum(expenses.taxAmount).mapWith(Number),
    count: sql<number>`COUNT(*)`
  })
  .from(expenses)
  .where(and(
    eq(expenses.organizationId, organizationId),
    sql`${expenses.date} >= ${startDate.getTime()}`,
    sql`${expenses.date} <= ${endDate.getTime()}`
  ))
  .groupBy(expenses.niifCategory);

  return result;
}

export async function deleteExpense(id: string, organizationId: string) {
  await db.delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.organizationId, organizationId)));
}

export const NIIF_CATEGORIES = {
  expenses: [
    { id: 'cost_of_sales', name: 'Costo de Ventas', code: '61', type: 'variable' },
    { id: 'operating_expense', name: 'Gastos Operativos', code: '62', type: 'fixed' },
    { id: 'employee_benefit', name: 'Beneficios a Empleados', code: '63', type: 'fixed' },
    { id: 'depreciation', name: 'Depreciación y Amortización', code: '64', type: 'fixed' },
    { id: 'financial_expense', name: 'Gastos Financieros', code: '65', type: 'variable' },
    { id: 'other_expense', name: 'Otros Gastos', code: '66', type: 'variable' },
    { id: 'non_operating_expense', name: 'Gastos No Operativos', code: '67', type: 'variable' },
  ] as const,
  revenues: [
    { id: 'operating_revenue', name: 'Ingresos Operativos', code: '41', type: 'revenue' },
    { id: 'non_operating_revenue', name: 'Ingresos No Operativos', code: '42', type: 'revenue' },
    { id: 'financial_income', name: 'Ingresos Financieros', code: '43', type: 'revenue' },
    { id: 'other_income', name: 'Otros Ingresos', code: '44', type: 'revenue' },
  ] as const
};

export async function getExpenseCategories(organizationId: string) {
  return NIIF_CATEGORIES.expenses;
}

export async function getRevenueCategories(organizationId: string) {
  return NIIF_CATEGORIES.revenues;
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
