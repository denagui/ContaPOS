import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createExpense, getExpensesByOrganization, getExpenseCategories, deleteExpense } from '$lib/server/services/expense.service';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.organizationId || 'demo-org';
	
	// Obtener gastos y categorías
	const [expenses, categories] = await Promise.all([
		getExpensesByOrganization(orgId, 100),
		getExpenseCategories(orgId)
	]);
	
	// Calcular totales
	const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
	const totalTax = expenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
	
	return {
		expenses,
		categories,
		summary: {
			totalAmount,
			totalTax,
			count: expenses.length
		},
		user: locals.user
	};
};

export const actions: Actions = {
	create_expense: async ({ request, locals }) => {
		const formData = await request.formData();
		
		const amount = parseFloat(formData.get('amount') as string);
		const category = formData.get('category') as string;
		const description = formData.get('description') as string;
		const dateStr = formData.get('date') as string;
		const paymentMethod = formData.get('paymentMethod') as 'cash' | 'card' | 'transfer' | 'sinpe' | 'credit';
		const invoiceNumber = formData.get('invoiceNumber') as string;
		const taxRate = parseInt(formData.get('taxRate') as string) as 0 | 4 | 8 | 13;
		
		// Validaciones básicas
		if (!amount || isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'El monto debe ser mayor a 0' });
		}
		if (!description || description.trim().length === 0) {
			return fail(400, { error: 'La descripción es requerida' });
		}
		if (!dateStr) {
			return fail(400, { error: 'La fecha es requerida' });
		}
		
		const orgId = locals.organizationId || 'demo-org';
		
		try {
			await createExpense({
				organizationId: orgId,
				amount,
				description,
				categoryId: category,
				date: new Date(dateStr),
				paymentMethod,
				invoiceNumber: invoiceNumber || undefined,
				taxRate
			});
			
			return {
				success: true,
				message: 'Gasto registrado exitosamente'
			};
		} catch (error) {
			console.error('Error al registrar gasto:', error);
			return fail(500, { error: 'Error interno del servidor' });
		}
	},
	
	delete_expense: async ({ request, locals }) => {
		const formData = await request.formData();
		const expenseId = formData.get('expenseId') as string;
		
		if (!expenseId) {
			return fail(400, { error: 'ID de gasto inválido' });
		}
		
		const orgId = locals.organizationId || 'demo-org';
		
		try {
			await deleteExpense(expenseId, orgId);
			
			return {
				success: true,
				message: 'Gasto eliminado exitosamente'
			};
		} catch (error) {
			console.error('Error al eliminar gasto:', error);
			return fail(500, { error: 'Error interno del servidor' });
		}
	}
};
