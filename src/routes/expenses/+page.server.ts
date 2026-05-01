import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { expenses, organizations } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateHaciendaKey } from '$lib/server/utils/hacienda-key';

export const load: PageServerLoad = async ({ locals }) => {
	// Seguridad: verificar sesión (simulada por ahora)
	if (!locals.user) {
		// En producción: redirect('/login')
	}

	const orgId = locals.organizationId || 'demo-org';

	// Obtener últimos gastos
	const recentExpenses = await db.query.expenses.findMany({
		where: and(eq(expenses.organizationId, orgId)),
		orderBy: [desc(expenses.createdAt)],
		limit: 5
	});

	return {
		recentExpenses,
		user: locals.user
	};
};

export const actions: Actions = {
	create_expense: async ({ request, locals }) => {
		const formData = await request.formData();
		
		const amount = parseFloat(formData.get('amount') as string);
		const category = formData.get('category') as string;
		const description = formData.get('description') as string;
		const date = formData.get('date') as string;
		const paymentMethod = formData.get('paymentMethod') as string;
		const receiptNumber = formData.get('receiptNumber') as string;

		// Validaciones básicas
		if (!amount || isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'El monto debe ser mayor a 0' });
		}
		if (!description || description.trim().length === 0) {
			return fail(400, { error: 'La descripción es requerida' });
		}

		const orgId = locals.organizationId || 'demo-org';

		// Calcular IVA (asumiendo 13% para gastos operativos, ajustable según categoría)
		const taxRate = 0.13;
		const taxAmount = amount * taxRate;
		const subtotal = amount - taxAmount;

		// Generar Clave de Hacienda (si hay número de comprobante)
		let haciendaKey = null;
		if (receiptNumber) {
			// Obtener info de la organización para la cédula emisor
			const org = await db.query.organizations.findFirst({
				where: eq(organizations.id, orgId)
			});
			
			if (org && org.taxId) {
				haciendaKey = generateHaciendaKey({
					timestamp: new Date(date),
					sucursal: '001',
					terminal: '00001',
					tipoComprobante: '02', // 02 = Nota de Débito para gastos
					consecutivo: Math.floor(Math.random() * 99999999),
					cedulaEmisor: org.taxId
				});
			}
		}

		try {
			await db.insert(expenses).values({
				organizationId: orgId,
				amount,
				subtotal,
				taxAmount,
				taxRate,
				category,
				description,
				date: new Date(date),
				paymentMethod,
				receiptNumber: receiptNumber || null,
				haciendaKey,
				status: 'completed',
				createdAt: new Date()
			});

			return {
				success: true,
				message: 'Gasto registrado exitosamente'
			};
		} catch (error) {
			console.error('Error al registrar gasto:', error);
			return fail(500, { error: 'Error interno del servidor' });
		}
	}
};
