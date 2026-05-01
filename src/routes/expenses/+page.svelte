<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	
	let { data, form } = $props();
	
	type Expense = typeof data.expenses[0];
	type Category = typeof data.categories[0];
	
	let showModal = $state(false);
	let selectedExpense = $state<Expense | null>(null);
	let filterCategory = $state('all');
	
	const filteredExpenses = $derived(
		filterCategory === 'all' 
			? data.expenses 
			: data.expenses.filter(e => e.category === filterCategory)
	);
	
	function openModal(expense?: Expense) {
		selectedExpense = expense || null;
		showModal = true;
	}
	
	function closeModal() {
		showModal = false;
		selectedExpense = null;
	}
	
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
	};
	
	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('es-CR');
	};
</script>

<svelte:head>
	<title>Gastos - ContaPOS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
	<!-- Header -->
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">💸 Gestión de Gastos</h1>
		<p class="text-gray-600">Registra y controla los gastos operativos de tu negocio</p>
	</header>
	
	<!-- Resumen -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
		<div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
			<p class="text-sm text-gray-500 mb-1">Total Gastos</p>
			<p class="text-2xl font-bold text-red-600">{formatCurrency(data.summary.totalAmount)}</p>
		</div>
		<div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
			<p class="text-sm text-gray-500 mb-1">IVA Pagado</p>
			<p class="text-2xl font-bold text-orange-600">{formatCurrency(data.summary.totalTax)}</p>
		</div>
		<div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
			<p class="text-sm text-gray-500 mb-1">Cantidad</p>
			<p class="text-2xl font-bold text-blue-600">{data.summary.count}</p>
		</div>
	</div>
	
	<!-- Acciones -->
	<div class="flex justify-between items-center mb-6">
		<select 
			bind:value={filterCategory}
			class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
		>
			<option value="all">Todas las categorías</option>
			{#each data.categories as cat}
				<option value={cat.id}>{cat.name}</option>
			{/each}
		</select>
		
		<button 
			onclick={() => openModal()}
			class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
		>
			<span>➕</span> Nuevo Gasto
		</button>
	</div>
	
	<!-- Tabla de Gastos -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50 border-b border-gray-200">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">IVA</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
					<th class="px-6 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#if filteredExpenses.length === 0}
					<tr>
						<td colspan="9" class="px-6 py-12 text-center text-gray-500">
							No hay gastos registrados
						</td>
					</tr>
				{:else}
					{#each filteredExpenses as expense}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(expense.date)}</td>
							<td class="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
									{expense.category}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
								{expense.paymentMethod === 'cash' && '💵 Efectivo'}
								{expense.paymentMethod === 'card' && '💳 Tarjeta'}
								{expense.paymentMethod === 'transfer' && '🏦 Transferencia'}
								{expense.paymentMethod === 'sinpe' && '📱 SINPE'}
								{expense.paymentMethod === 'credit' && '📝 Crédito'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
								{expense.receiptNumber || '-'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
								{formatCurrency(expense.subtotal)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
								{formatCurrency(expense.taxAmount || 0)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">
								{formatCurrency(expense.amount)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-right">
								<form method="POST" use:enhance>
									<input type="hidden" name="expenseId" value={expense.id} />
									<button 
										type="submit" 
										name="action" 
										value="delete_expense"
										class="text-red-600 hover:text-red-800 transition-colors"
										onclick={() => confirm('¿Eliminar este gasto?')}
									>
										🗑️
									</button>
								</form>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal Nuevo/Editar Gasto -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={closeModal}>
		<div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<div class="p-6 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-900">
					{selectedExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
				</h2>
			</div>
			
			<form method="POST" use:enhance class="p-6 space-y-4">
				<input type="hidden" name="expenseId" value={selectedExpense?.id || ''} />
				
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
						<input 
							type="date" 
							name="date" 
							required
							value={selectedExpense?.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
						<select 
							name="category" 
							required
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
						>
							{#each data.categories as cat}
								<option value={cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
					<textarea 
						name="description" 
						required
						rows="3"
						value={selectedExpense?.description || ''}
						class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
						placeholder="Descripción del gasto..."
					></textarea>
				</div>
				
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Monto Total *</label>
						<input 
							type="number" 
							name="amount" 
							step="0.01" 
							min="0"
							required
							value={selectedExpense?.amount || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="0.00"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
						<select 
							name="taxRate" 
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
						>
							<option value="0">0% - Exento</option>
							<option value="4">4%</option>
							<option value="8">8%</option>
							<option value="13" selected>13%</option>
						</select>
					</div>
				</div>
				
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
						<select 
							name="paymentMethod" 
							required
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
						>
							<option value="cash">💵 Efectivo</option>
							<option value="card">💳 Tarjeta</option>
							<option value="transfer">🏦 Transferencia</option>
							<option value="sinpe">📱 SINPE Móvil</option>
							<option value="credit">📝 Crédito</option>
						</select>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">N° Comprobante</label>
						<input 
							type="text" 
							name="invoiceNumber" 
							value={selectedExpense?.receiptNumber || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="Número de factura/ticket"
						/>
					</div>
				</div>
				
				<div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
					<button 
						type="button" 
						onclick={closeModal}
						class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
					<button 
						type="submit" 
						name="action" 
						value={selectedExpense ? 'update_expense' : 'create_expense'}
						class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						{selectedExpense ? 'Actualizar' : 'Guardar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
