<script lang="ts">
	let sales = $state([
		{ id: '001', date: '2026-04-30 09:15', total: 25.50, method: 'cash', items: 5 },
		{ id: '002', date: '2026-04-30 10:30', total: 12.75, method: 'card', items: 3 },
		{ id: '003', date: '2026-04-30 11:45', total: 48.00, method: 'credit', items: 8 },
		{ id: '004', date: '2026-04-30 13:20', total: 8.25, method: 'cash', items: 2 },
		{ id: '005', date: '2026-04-30 14:10', total: 35.90, method: 'transfer', items: 6 }
	]);

	const todayTotal = $derived(sales.reduce((sum, s) => sum + s.total, 0));
	const todayCount = sales.length;
	const avgTicket = $derived(todayCount > 0 ? todayTotal / todayCount : 0);
	
	const byMethod = $derived({
		cash: sales.filter(s => s.method === 'cash').reduce((sum, s) => sum + s.total, 0),
		card: sales.filter(s => s.method === 'card').reduce((sum, s) => sum + s.total, 0),
		transfer: sales.filter(s => s.method === 'transfer').reduce((sum, s) => sum + s.total, 0),
		credit: sales.filter(s => s.method === 'credit').reduce((sum, s) => sum + s.total, 0)
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
	<header class="glass-card mb-6">
		<h1 class="text-2xl md:text-3xl font-bold text-white mb-4">📊 Reportes del Día</h1>
		<p class="text-white/60">{new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
	</header>

	<!-- Métricas Principales -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
		<div class="glass-card">
			<p class="text-white/60 text-sm">Ventas Totales</p>
			<p class="text-2xl font-bold text-success">${todayTotal.toFixed(2)}</p>
		</div>
		<div class="glass-card">
			<p class="text-white/60 text-sm">Transacciones</p>
			<p class="text-2xl font-bold text-white">{todayCount}</p>
		</div>
		<div class="glass-card">
			<p class="text-white/60 text-sm">Ticket Promedio</p>
			<p class="text-2xl font-bold text-primary">${avgTicket.toFixed(2)}</p>
		</div>
		<div class="glass-card">
			<p class="text-white/60 text-sm">Hora Pico</p>
			<p class="text-xl font-bold text-warning">11:00 AM</p>
		</div>
	</div>

	<!-- Ventas por Método de Pago -->
	<div class="glass-card mb-6">
		<h2 class="text-lg font-bold text-white mb-4">💳 Ventas por Método de Pago</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="bg-green-600/20 p-4 rounded-xl">
				<p class="text-white/60 text-xs">Efectivo</p>
				<p class="text-xl font-bold text-green-400">${byMethod.cash.toFixed(2)}</p>
			</div>
			<div class="bg-blue-600/20 p-4 rounded-xl">
				<p class="text-white/60 text-xs">Tarjeta</p>
				<p class="text-xl font-bold text-blue-400">${byMethod.card.toFixed(2)}</p>
			</div>
			<div class="bg-purple-600/20 p-4 rounded-xl">
				<p class="text-white/60 text-xs">Transferencia</p>
				<p class="text-xl font-bold text-purple-400">${byMethod.transfer.toFixed(2)}</p>
			</div>
			<div class="bg-orange-600/20 p-4 rounded-xl">
				<p class="text-white/60 text-xs">Fiado</p>
				<p class="text-xl font-bold text-orange-400">${byMethod.credit.toFixed(2)}</p>
			</div>
		</div>
	</div>

	<!-- Últimas Ventas -->
	<div class="glass-card">
		<h2 class="text-lg font-bold text-white mb-4">📋 Últimas Transacciones</h2>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-white/20">
						<th class="text-left text-white/80 p-3 text-sm">#</th>
						<th class="text-left text-white/80 p-3 text-sm">Fecha</th>
						<th class="text-center text-white/80 p-3 text-sm">Items</th>
						<th class="text-center text-white/80 p-3 text-sm">Método</th>
						<th class="text-right text-white/80 p-3 text-sm">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each sales as sale (sale.id)}
						<tr class="border-b border-white/10 hover:bg-white/5">
							<td class="p-3 text-white font-mono text-sm">{sale.id}</td>
							<td class="p-3 text-white/60 text-sm">{sale.date}</td>
							<td class="p-3 text-center text-white text-sm">{sale.items}</td>
							<td class="p-3 text-center">
								<span class="text-xs px-2 py-1 rounded-full 
									{sale.method === 'cash' ? 'bg-green-600/30 text-green-400' : ''}
									{sale.method === 'card' ? 'bg-blue-600/30 text-blue-400' : ''}
									{sale.method === 'transfer' ? 'bg-purple-600/30 text-purple-400' : ''}
									{sale.method === 'credit' ? 'bg-orange-600/30 text-orange-400' : ''}
								">
									{sale.method === 'cash' ? '💵' : ''}
									{sale.method === 'card' ? '💳' : ''}
									{sale.method === 'transfer' ? '🏦' : ''}
									{sale.method === 'credit' ? '📝' : ''}
									{sale.method.toUpperCase()}
								</span>
							</td>
							<td class="p-3 text-right text-success font-bold">${sale.total.toFixed(2)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Botón Cierre de Caja -->
	<div class="mt-6 glass-card">
		<button class="glass-button w-full bg-red-600/50 hover:bg-red-600/70 py-4 text-lg">
			🔒 Realizar Cierre de Caja
		</button>
	</div>
</div>
