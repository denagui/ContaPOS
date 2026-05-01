<script lang="ts">
import { page } from '$app/stores';
import type { BankAccount, ReconciliationBatch } from '$lib/server/db/schema';
import { MoneyUtils } from '$lib/utils/money';

let bankAccounts = $prop<BankAccount[]>();
let selectedAccountId = $prop<string>('');
let batches = $prop<ReconciliationBatch[]>([]);
let loading = $state(false);

function formatCurrency(cents: number, currency: string) {
return MoneyUtils.format(cents, currency as any);
}

function formatDate(epoch: number) {
return new Date(epoch).toLocaleDateString('es-CR', {
year: 'numeric',
month: 'short',
day: 'numeric',
hour: '2-digit',
minute: '2-digit'
});
}

function getStatusBadgeClass(status: string) {
switch (status) {
case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}
}
</script>

<svelte:head>
<title>Historial de Conciliaciones - ContaPOS</title>
</svelte:head>

<div class="space-y-6">
<!-- Header -->
<div class="flex justify-between items-center">
<div class="flex items-center gap-4">
<a href="/banking" class="btn-secondary text-sm">
<span class="i-lucide-arrow-left mr-2"></span>
Volver
</a>
<div>
<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Historial de Conciliaciones</h1>
<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Revisa los lotes de conciliación completados</p>
</div>
</div>
<select 
bind:value={selectedAccountId}
class="input w-64"
>
<option value="">Todas las cuentas</option>
{#each bankAccounts as account}
<option value={account.id}>{account.name}</option>
{/each}
</select>
</div>

{#if batches.length === 0}
<div class="card p-12 text-center">
<div class="i-lucide-history mx-auto h-12 w-12 text-gray-400 mb-4"></div>
<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay historial</h3>
<p class="text-gray-500 dark:text-gray-400">
{selectedAccountId 
? 'No hay conciliaciones para esta cuenta' 
: 'Comienza importando y conciliando transacciones'}
</p>
</div>
{:else}
<div class="card overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full">
<thead class="bg-gray-50 dark:bg-gray-800">
<tr>
<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transacciones</th>
<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto Total</th>
<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Discrepancia</th>
<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
</tr>
</thead>
<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
{#each batches as batch}
<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
<td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
{formatDate(batch.createdAt)}
</td>
<td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
{batch.accountName}
</td>
<td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
{batch.transactionCount}
</td>
<td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
{formatCurrency(Math.abs(batch.totalAmountCents), batch.currency)}
</td>
<td class="px-4 py-3 text-center">
{#if batch.discrepancyCents !== 0}
<span class="text-sm font-medium {batch.discrepancyCents < 0 ? 'text-red-600' : 'text-green-600'}">
{formatCurrency(Math.abs(batch.discrepancyCents), batch.currency)}
</span>
{:else}
<span class="badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
Cuadrado
</span>
{/if}
</td>
<td class="px-4 py-3 text-center">
<span class="badge text-xs px-2 py-1 {getStatusBadgeClass(batch.status)}">
{batch.status === 'completed' ? 'Completado' : 
 batch.status === 'pending' ? 'Pendiente' : 'Cancelado'}
</span>
</td>
<td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
{batch.createdByUserName}
</td>
</tr>
{/each}
</tbody>
</table>
</div>
</div>
{/if}
</div>
