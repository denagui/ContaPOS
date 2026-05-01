<script lang="ts">
	import { page } from '$app/stores';
	import { BankReconciliationService } from '$lib/server/services/bank-reconciliation.service';
	import type { BankAccount } from '$lib/server/db/schema';
	import { MoneyUtils } from '$lib/utils/money';

	let bankAccounts: BankAccount[] = [];
	let loading = $state(true);
	let error = $state<string | null>(null);

	const bankService = new BankReconciliationService();

	async function loadAccounts() {
		loading = true;
		error = null;
		try {
			bankAccounts = await bankService.getAccounts($page.data.companyId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error al cargar cuentas';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadAccounts();
	});

	function formatBalance(cents: number, currency: string) {
		return MoneyUtils.format(cents, currency as any);
	}

	function getStatusBadgeClass(status: string) {
		switch (status) {
			case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
			case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
			case 'locked': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
		}
	}
</script>

<svelte:head>
	<title>Cuentas Bancarias - ContaPOS</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Cuentas Bancarias</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tus cuentas bancarias para conciliación</p>
		</div>
		<a href="/banking/import" class="btn-primary">
			<span class="i-lucide-download mr-2"></span>
			Importar Transacciones
		</a>
	</div>

	{#if error}
		<div class="alert-error">{error}</div>
	{/if}

	{#if loading}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(3) as _}
				<div class="card p-6">
					<div class="animate-pulse space-y-4">
						<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
						<div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
						<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if bankAccounts.length === 0}
		<div class="card p-12 text-center">
			<div class="i-lucide-banknote mx-auto h-12 w-12 text-gray-400 mb-4"></div>
			<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay cuentas bancarias</h3>
			<p class="text-gray-500 dark:text-gray-400 mb-4">Configura tu primera cuenta bancaria para comenzar la conciliación</p>
			<a href="/settings/billing" class="btn-secondary">Configurar Cuenta</a>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each bankAccounts as account}
				<div class="card p-6 hover:shadow-lg transition-shadow">
					<div class="flex justify-between items-start mb-4">
						<div>
							<h3 class="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
							<p class="text-sm text-gray-500 dark:text-gray-400">{account.accountNumber}</p>
						</div>
						<span class="badge text-xs px-2 py-1 {getStatusBadgeClass(account.status)}">
							{account.status === 'active' ? 'Activa' : account.status === 'inactive' ? 'Inactiva' : 'Bloqueada'}
						</span>
					</div>

					<div class="space-y-2 mb-4">
						<div class="flex justify-between">
							<span class="text-sm text-gray-500 dark:text-gray-400">Banco:</span>
							<span class="text-sm font-medium text-gray-900 dark:text-white">{account.bankName}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500 dark:text-gray-400">Tipo:</span>
							<span class="text-sm font-medium text-gray-900 dark:text-white capitalize">{account.accountType}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500 dark:text-gray-400">Moneda:</span>
							<span class="text-sm font-medium text-gray-900 dark:text-white">{account.currency}</span>
						</div>
					</div>

					<div class="pt-4 border-t border-gray-200 dark:border-gray-700">
						<div class="flex justify-between items-center mb-3">
							<span class="text-sm text-gray-500 dark:text-gray-400">Saldo Actual:</span>
							<span class="text-lg font-bold text-gray-900 dark:text-white">
								{formatBalance(account.currentBalanceCents, account.currency)}
							</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm text-gray-500 dark:text-gray-400">Última Conciliación:</span>
							<span class="text-sm text-gray-900 dark:text-white">
								{account.lastReconciledAt 
									? new Date(account.lastReconciledAt).toLocaleDateString('es-CR')
									: 'Nunca'}
							</span>
						</div>
					</div>

					<div class="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
						<a href="/banking/reconcile?accountId={account.id}" class="btn-primary flex-1 text-sm">
							Conciliar
						</a>
						<a href="/banking/history?accountId={account.id}" class="btn-secondary flex-1 text-sm">
							Historial
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
