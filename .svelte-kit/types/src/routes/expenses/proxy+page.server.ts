// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createExpense, getExpensesByOrganization, getExpenseCategories, deleteExpense, getNiifSummary } from '$lib/server/services/expense.service';
import { getCurrentOrg } from '$lib/server/auth';

export const load = async ({ locals, url }: Parameters<PageServerLoad>[0]) => {
  const session = await locals.getSession();
  if (!session) throw redirect(303, '/login');

  const organizationId = await getCurrentOrg(locals);
  if (!organizationId) throw redirect(303, '/select-org');

  const expenses = await getExpensesByOrganization(organizationId, 100);
  const categories = await getExpenseCategories(organizationId);
  
  // Calcular resumen por categoría NIIF
  const startDate = new Date(new Date().setDate(1)); // Primer día del mes
  const endDate = new Date();
  const niifSummary = await getNiifSummary(organizationId, startDate, endDate);

  // Calcular totales generales
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTax = expenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0);

  return {
    expenses,
    categories,
    niifSummary,
    summary: {
      totalAmount,
      totalTax,
      count: expenses.length
    }
  };
};

export const actions = {
  create_expense: async ({ request, locals }: import('./$types').RequestEvent) => {
    const organizationId = await getCurrentOrg(locals);
    if (!organizationId) return fail(400, { error: 'Organización no encontrada' });

    const formData = await request.formData();
    const date = new Date(formData.get('date') as string);
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const niifCategory = formData.get('niifCategory') as any;
    const paymentMethod = formData.get('paymentMethod') as any;
    const taxRate = parseInt(formData.get('taxRate') as string) as 0 | 4 | 8 | 13;
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!amount || !description || !category) {
      return fail(400, { error: 'Campos requeridos faltantes' });
    }

    try {
      await createExpense({
        organizationId,
        date,
        amount,
        description,
        categoryId: category,
        niifCategory,
        paymentMethod,
        taxRate,
        invoiceNumber
      });
    } catch (error) {
      console.error('Error creando gasto:', error);
      return fail(500, { error: 'Error al crear el gasto' });
    }

    return { success: true };
  },

  delete_expense: async ({ request, locals }: import('./$types').RequestEvent) => {
    const organizationId = await getCurrentOrg(locals);
    if (!organizationId) return fail(400, { error: 'Organización no encontrada' });

    const formData = await request.formData();
    const expenseId = formData.get('expenseId') as string;

    try {
      await deleteExpense(expenseId, organizationId);
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      return fail(500, { error: 'Error al eliminar el gasto' });
    }

    return { success: true };
  }
};
;null as any as Actions;