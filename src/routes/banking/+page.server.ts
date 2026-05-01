import { fail } from '@sveltejs/kit';
import { BankReconciliationService } from '$lib/server/services/bank-reconciliation.service';
import type { Actions, PageServerLoad } from './$types';

const bankService = new BankReconciliationService();

export const load: PageServerLoad = async ({ url, locals }) => {
	const companyId = locals.companyId;
	if (!companyId) {
		throw new Error('Company ID required');
	}

	const accounts = await bankService.getAccounts(companyId);
	
	return {
		bankAccounts: accounts,
		defaultAccountId: url.searchParams.get('accountId') || accounts[0]?.id
	};
};

export const actions: Actions = {
	import: async ({ request, locals }) => {
		const companyId = locals.companyId;
		if (!companyId) {
			return fail(400, { error: 'Company ID required' });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const accountId = formData.get('accountId') as string;
		const statementDate = formData.get('statementDate') as string;

		if (!file || !accountId) {
			return fail(400, { error: 'Archivo y cuenta requeridos' });
		}

		try {
			const arrayBuffer = await file.arrayBuffer();
			const csvContent = Buffer.from(arrayBuffer).toString('utf-8');

			const result = await bankService.importCSV(
				companyId,
				accountId,
				csvContent,
				statementDate ? new Date(statementDate).getTime() : undefined
			);

			return {
				success: true,
				message: `${result.importedCount} transacciones importadas exitosamente`,
				importedCount: result.importedCount,
				duplicatesSkipped: result.duplicatesSkipped,
				parseErrors: result.parseErrors
			};
		} catch (error) {
			console.error('Import error:', error);
			return fail(500, { 
				error: error instanceof Error ? error.message : 'Error al importar archivo' 
			});
		}
	},

	createAccount: async ({ request, locals }) => {
		const companyId = locals.companyId;
		if (!companyId) {
			return fail(400, { error: 'Company ID required' });
		}

		const formData = await request.formData();
		
		try {
			const account = await bankService.createAccount(companyId, {
				name: formData.get('name') as string,
				bankName: formData.get('bankName') as string,
				accountNumber: formData.get('accountNumber') as string,
				accountType: formData.get('accountType') as 'checking' | 'savings' | 'credit_card' | 'loan',
				currency: formData.get('currency') as 'CRC' | 'USD',
				initialBalanceCents: parseInt(formData.get('initialBalanceCents') as string) || 0,
				status: 'active'
			});

			return {
				success: true,
				message: 'Cuenta creada exitosamente',
				account
			};
		} catch (error) {
			return fail(500, { 
				error: error instanceof Error ? error.message : 'Error al crear cuenta' 
			});
		}
	}
};
