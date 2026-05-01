<script lang="ts">
	let inventory = $state([
		{ id: '1', name: 'Arroz Tío Pelón 1kg', stock: 50, minStock: 10, price: 1.20, category: 'Granos' },
		{ id: '2', name: 'Frijoles Negros 500g', stock: 30, minStock: 15, price: 0.85, category: 'Granos' },
		{ id: '3', name: 'Leche Dos Pinos 1L', stock: 25, minStock: 20, price: 1.50, category: 'Lácteos' },
		{ id: '4', name: 'Huevos Docena', stock: 15, minStock: 10, price: 2.80, category: 'Refrigerados' },
		{ id: '5', name: 'Pan Gallo Negro', stock: 100, minStock: 30, price: 0.50, category: 'Panadería' }
	]);

	const lowStock = $derived(inventory.filter(item => item.stock <= item.minStock));
	const totalValue = $derived(inventory.reduce((sum, item) => sum + (item.stock * item.price), 0));
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
	<header class="glass-card mb-6">
		<h1 class="text-2xl md:text-3xl font-bold text-white mb-4">📦 Inventario</h1>
		
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="glass p-4 rounded-xl">
				<p class="text-white/60 text-sm">Total Productos</p>
				<p class="text-2xl font-bold text-white">{inventory.length}</p>
			</div>
			<div class="glass p-4 rounded-xl">
				<p class="text-white/60 text-sm">Valor Inventario</p>
				<p class="text-2xl font-bold text-success">${totalValue.toFixed(2)}</p>
			</div>
			<div class="glass p-4 rounded-xl">
				<p class="text-white/60 text-sm">Stock Bajo</p>
				<p class="text-2xl font-bold text-warning">{lowStock.length}</p>
			</div>
			<div class="glass p-4 rounded-xl">
				<p class="text-white/60 text-sm">Categorías</p>
				<p class="text-2xl font-bold text-primary">{new Set(inventory.map(i => i.category)).size}</p>
			</div>
		</div>
	</header>

	{#if lowStock.length > 0}
		<div class="glass-card mb-6 border-warning/50">
			<h2 class="text-lg font-bold text-warning mb-3">⚠️ Alertas de Stock Bajo</h2>
			<div class="space-y-2">
				{#each lowStock as item}
					<div class="flex justify-between items-center bg-white/5 p-3 rounded-lg">
						<span class="text-white">{item.name}</span>
						<span class="text-warning font-bold">
							{item.stock} / {item.minStock} mín
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="glass-card overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-b border-white/20">
					<th class="text-left text-white/80 p-3">Producto</th>
					<th class="text-left text-white/80 p-3">Categoría</th>
					<th class="text-right text-white/80 p-3">Precio</th>
					<th class="text-center text-white/80 p-3">Stock</th>
					<th class="text-center text-white/80 p-3">Mínimo</th>
					<th class="text-center text-white/80 p-3">Estado</th>
				</tr>
			</thead>
			<tbody>
				{#each inventory as item (item.id)}
					<tr class="border-b border-white/10 hover:bg-white/5">
						<td class="p-3 text-white">{item.name}</td>
						<td class="p-3 text-white/60">{item.category}</td>
						<td class="p-3 text-right text-success font-bold">${item.price.toFixed(2)}</td>
						<td class="p-3 text-center text-white">{item.stock}</td>
						<td class="p-3 text-center text-white/60">{item.minStock}</td>
						<td class="p-3 text-center">
							{#if item.stock <= item.minStock}
								<span class="bg-warning/20 text-warning px-3 py-1 rounded-full text-xs font-bold">
									Bajo
								</span>
							{:else}
								<span class="bg-success/20 text-success px-3 py-1 rounded-full text-xs font-bold">
									OK
								</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
