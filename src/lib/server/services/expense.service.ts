import { db } from '$lib/server/db';
import { expenses, companySettings } from '$lib/server/db/schema';
import { eq, and, desc, sum, sql } from 'drizzle-orm';
import { generateHaciendaKey } from '../utils/hacienda-key';

export interface CreateExpenseInput {
  companyId: string;
  date: Date;
  amountCents: number;
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
  const taxAmountCents = Math.round(input.amountCents * (input.taxRate || 0) / 100);
  const subtotalCents = input.amountCents - taxAmountCents;
  
  // Generar clave de hacienda para el gasto (comprobante de proveedor o interno)
  const haciendaKey = input.invoiceNumber || generateHaciendaKey({
    companyId: input.companyId,
    date: input.date,
    type: 'expense',
    sequential: Math.floor(Math.random() * 1000000)
  });

  const [newExpense] = await db.insert(expenses).values({
    companyId: input.companyId,
    date: input.date.getTime(), // Epoch 13
    amountCents: input.amountCents,
    subtotalCents: subtotalCents,
    taxAmountCents: taxAmountCents,
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

export async function getExpensesByCompany(companyId: string, limit = 50) {
  return await db.select().from(expenses)
    .where(eq(expenses.companyId, companyId))
    .orderBy(desc(expenses.date))
    .limit(limit);
}

export async function getExpensesByDateRange(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  return await db.select().from(expenses)
    .where(and(
      eq(expenses.companyId, companyId),
      sql`${expenses.date} >= ${startDate.getTime()}`,
      sql`${expenses.date} <= ${endDate.getTime()}`
    ))
    .orderBy(desc(expenses.date));
}

export async function getNiifSummary(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const result = await db.select({
    niifCategory: expenses.niifCategory,
    totalAmountCents: sum(expenses.amountCents).mapWith(Number),
    totalSubtotalCents: sum(expenses.subtotalCents).mapWith(Number),
    totalTaxCents: sum(expenses.taxAmountCents).mapWith(Number),
    count: sql<number>`COUNT(*)`
  })
  .from(expenses)
  .where(and(
    eq(expenses.companyId, companyId),
    sql`${expenses.date} >= ${startDate.getTime()}`,
    sql`${expenses.date} <= ${endDate.getTime()}`
  ))
  .groupBy(expenses.niifCategory);

  return result;
}

export async function deleteExpense(id: string, companyId: string) {
  await db.delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.companyId, companyId)));
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

export async function getExpenseCategories(companyId: string) {
  return NIIF_CATEGORIES.expenses;
}

export async function getRevenueCategories(companyId: string) {
  return NIIF_CATEGORIES.revenues;
}

export async function getCompanySetting(companyId: string, key: string) {
  const [setting] = await db.select().from(companySettings)
    .where(and(
      eq(companySettings.companyId, companyId),
      eq(companySettings.settingKey, key)
    ));

  return setting?.settingValue || null;
}

export async function setCompanySetting(companyId: string, key: string, value: string, type: 'string' | 'number' | 'boolean' | 'json' = 'string') {
  const existing = await getCompanySetting(companyId, key);

  if (existing) {
    await db.update(companySettings)
      .set({ settingValue: value, type, updatedAt: new Date().toISOString() })
      .where(and(
        eq(companySettings.companyId, companyId),
        eq(companySettings.settingKey, key)
      ));
  } else {
    await db.insert(companySettings).values({
      companyId,
      settingKey: key,
      settingValue: value,
      type,
    });
  }
}
