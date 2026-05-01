<script lang="ts">
import { page } from '$app/stores';
import type { BankAccount, BankTransaction, JournalEntry } from '$lib/server/db/schema';
import { MoneyUtils } from '$lib/utils/money';

let bankAccounts = $prop<BankAccount[]>();
let selectedAccountId = $prop<string>('');
let transactions = $state<Array<BankTransaction & { matchedEntry?: JournalEntry | null, matchScore?: number }>>([]);
let loading = $state(true);
let reconciling = $state(false);
let selectedTransactions = $state<Set<string>>(new Set());
let showOnlyUnmatched = $state(true);

function formatCurrency(cents: number, currency: string) {
return MoneyUtils.format(cents, currency as any);
}

function formatDate(epoch: number) {
return new Date(epoch).toLocaleDateString('es-CR');
}

function toggleSelection(id: string) {
if (selectedTransactions.has(id)) {
selectedTransactions.delete(id);
} else {
selectedTransactions.add(id);
}
}

function selectAll() {
transactions.forEach(t => {
if (!t.matchedEntryId) {
selectedTransactions.add(t.id);
}
});
}

function clearSelection() {
selectedTransactions.clear();
}

async function loadTransactions() {
loading = true;
try {
const response = await fetch(`/banking/reconcile/data?accountId=${selectedAccountId}&unmatched=${showOnlyUnmatched}`);
if (response.ok) {
transactions = await response.json();
}
} catch (error) {
console.error('Error loading transactions:', error);
} finally {
loading = false;
}
}

$effect(() => {
if (selectedAccountId) {
loadTransactions();
}
});

async function reconcileSelected() {
if (selectedTransactions.size === 0) return;

reconciling = true;
try {
const response = await fetch('/banking/reconcile/match', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
transactionIds: Array.from(selectedTransactions)
})
});

if (response.ok) {
await loadTransactions();
clearSelection();
}
} catch (error) {
console.error('Reconciliation error:', error);
} finally {
reconciling = false;
}
}

function getMatchStatusClass(transaction: any) {
if (transaction.matchedEntryId) {
return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
}
if (selectedTransactions.has(transaction.id)) {
return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
}
return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
}
</script>

<svelte:head>
<title>Conciliar Transacciones - ContaPOS</title>
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
<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Conciliación Bancaria</h1>
<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Empareja transacciones bancarias con asientos contables</p>
</div>
</div>
<select 
bind:value={selectedAccountId}
class="input w-64"
>
<option value="">Seleccionar cuenta...</option>
{#each bankAccounts as account}
<option value={account.id}>{account.name}</option>
{/each}
</select>
</div>

{#if !selectedAccountId}
<div class="card p-12 text-center">
<div class="i-lucide-hand-coins mx-auto h-12 w-12 text-gray-400 mb-4"></div>
<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Selecciona una cuenta</h3>
<p class="text-gray-500 dark:text-gray-400">Elige una cuenta bancaria para comenzar la conciliación</p>
</div>
{:else}
<!-- Toolbar -->
<div class="card p-4">
<div class="flex justify-between items-center">
<div class="flex items-center gap-4">
<label class="flex items-center gap-2">
<input 
type="checkbox" 
bind:checked={showOnlyUnmatched}
on:change={() => loadTransactions()}
class="checkbox"
/>
<span class="text-sm text-gray-700 dark:text-gray-300">Solo sin conciliar</span>
</label>
<span class="text-sm text-gray-500 dark:text-gray-400">
{selectedTransactions.size} seleccionadas de {transactions.length}
</span>
</div>
<div class="flex gap-2">
<button 
onclick={selectAll}
class="btn-secondary text-sm"
>
Seleccionar todas
</button>
<button 
onclick={clearSelection}
class="btn-secondary text-sm"
>
Limpiar
</button>
<button 
onclick={reconcileSelected}
disabled={selectedTransactions.size === 0 || reconciling}
class="btn-primary text-sm disabled:opacity-50"
>
{#if reconciling}
<span class="i-lucide-loader-2 animate-spin mr-2"></span>
Conciliando...
{:else}
<span class="i-lucide-check mr-2"></span>
Conciliar ({selectedTransactions.size})
{/if}
</button>
</div>
</div>
</div>

<!-- Tabla de Transacciones -->
{#if loading}
<div class="card p-8 text-center">
<div class="i-lucide-loader-2 animate-spin mx-auto h-8 w-8 text-primary mb-4"></div>
<p class="text-gray-500 dark:text-gray-400">Cargando transacciones...</p>
</div>
{:else if transactions.length === 0}
<div class="card p-12 text-center">
<div class="i-lucide-check-circle mx-auto h-12 w-12 text-green-500 mb-4"></div>
<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
{showOnlyUnmatched ? '¡Todo conciliado!' : 'No hay transacciones'}
</h3>
<p class="text-gray-500 dark:text-gray-400">
{showOnlyUnmatched 
? 'No hay transacciones pendientes de conciliar' 
: 'Importa transacciones desde el banco'}
</p>
</div>
{:else}
<div class="card overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full">
<thead class="bg-gray-50 dark:bg-gray-800">
<tr>
<th class="px-4 py-3 text-left">
<input 
type="checkbox"
checked={selectedTransactions.size === transactions.filter(t => !t.matchedEntryId).length && transactions.filter(t => !t.matchedEntryId).length > 0}
on:change={(e) => e.currentTarget.checked ? selectAll() : clearSelection()}
class="checkbox"
/>
</th>
<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
<th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
<th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Match</th>
</tr>
</thead>
<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
{#each transactions as transaction}
<tr class="{getMatchStatusClass(transaction)} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
<td class="px-4 py-3">
{#if !transaction.matchedEntryId}
<input 
type="checkbox"
checked={selectedTransactions.has(transaction.id)}
on:change={() => toggleSelection(transaction.id)}
class="checkbox"
/>
{/if}
</td>
<td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
{formatDate(transaction.transactionDate)}
</td>
<td class="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
{transaction.description}
</td>
<td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
{transaction.referenceNumber}
</td>
<td class="px-4 py-3 text-sm font-medium text-right {transaction.amountCents < 0 ? 'text-red-600' : 'text-green-600'}">
{formatCurrency(Math.abs(transaction.amountCents), transaction.currency)}
{transaction.amountCents < 0 ? ' -' : ' +'}
</td>
<td class="px-4 py-3 text-center">
{#if transaction.matchedEntryId}
<span class="badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
Conciliado
</span>
{:else}
<span class="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
Pendiente
</span>
{/if}
</td>
<td class="px-4 py-3 text-center">
{#if transaction.matchScore !== undefined}
<div class="flex items-center justify-center gap-1">
<div class="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
<div 
class="h-full bg-primary rounded-full"
style="width: {transaction.matchScore}%"
></div>
</div>
<span class="text-xs text-gray-500">{Math.round(transaction.matchScore)}%</span>
</div>
{:else}
<span class="text-xs text-gray-400">-</span>
{/if}
</td>
</tr>
{/each}
</tbody>
</table>
</div>
</div>
{/if}
{/if}
</div>
