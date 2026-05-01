import { fail } from '@sveltejs/kit';
import { BankReconciliationService } from '$lib/server/services/bank-reconciliation.service';
import type { Actions, PageServerLoad } from './$types';

const bankService = new BankReconciliationService();

export const load: PageServerLoad = async ({ url, locals }) => {
const companyId = locals.companyId;
if (!companyId) {
throw new Error('Company ID required');
}

const accountId = url.searchParams.get('accountId');
const unmatched = url.searchParams.get('unmatched') === 'true';

const accounts = await bankService.getAccounts(companyId);

let transactions = [];
if (accountId) {
transactions = await bankService.getTransactionsForReconciliation(companyId, accountId, unmatched);
}

return {
bankAccounts: accounts,
transactions,
defaultAccountId: accountId || accounts[0]?.id
};
};

export const actions: Actions = {
match: async ({ request, locals }) => {
const companyId = locals.companyId;
if (!companyId) {
return fail(400, { error: 'Company ID required' });
}

const data = await request.json();
const transactionIds = data.transactionIds as string[];

if (!transactionIds || transactionIds.length === 0) {
return fail(400, { error: 'No hay transacciones seleccionadas' });
}

try {
const result = await bankService.manualMatch(companyId, transactionIds);

return {
success: true,
message: `${result.matchedCount} transacciones conciliadas exitosamente`,
matchedCount: result.matchedCount
};
} catch (error) {
return fail(500, { 
error: error instanceof Error ? error.message : 'Error al conciliar transacciones' 
});
}
}
};
