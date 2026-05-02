<script lang="ts"}; }>
	let customers = $state([
		{ id: '1', name: 'Juan Pérez', phone: '8888-8888', balance: 15.50, creditLimit: 100, lastPurchase: '2026-04-28' },
		{ id: '2', name: 'María González', phone: '9999-9999', balance: 0, creditLimit: 50, lastPurchase: '2026-04-30' },
		{ id: '3', name: 'Carlos Rodríguez', phone: '7777-7777', balance: 45.00, creditLimit: 75, lastPurchase: '2026-04-25' }
	]);

	const withDebt = $derived(customers.filter(c => c.balance > 0));
	const totalReceivable = $derived(customers.reduce((sum, c) => sum + c.balance, 0));
</script}; }>

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4"}; }>
	<header class="glass-card mb-6"}; }>
		<h1 class="text-2xl md:text-3xl font-bold text-white mb-4">👥 CRM - Clientes</h1}; }>
		
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4"}; }>
			<div class="glass p-4 rounded-xl"}; }>
				<p class="text-white/60 text-sm">Total Clientes</p}; }>
				<p class="text-2xl font-bold text-white">{customers.length}</p}; }>
			</div}; }>
			<div class="glass p-4 rounded-xl"}; }>
				<p class="text-white/60 text-sm">Con Fiado</p}; }>
				<p class="text-2xl font-bold text-warning">{withDebt.length}</p}; }>
			</div}; }>
			<div class="glass p-4 rounded-xl"}; }>
				<p class="text-white/60 text-sm">Por Cobrar</p}; }>
				<p class="text-2xl font-bold text-danger">${totalReceivable.toFixed(2)}</p}; }>
			</div}; }>
		</div}; }>
	</header}; }>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6"}; }>
		<!-- Lista de Clientes --}; }>
		<div class="glass-card"}; }>
			<h2 class="text-lg font-bold text-white mb-4">Todos los Clientes</h2}; }>
			<div class="space-y-3"}; }>
				{#each customers as customer (customer.id)}
					<div class="bg-white/5 p-4 rounded-xl"}; }>
						<div class="flex justify-between items-start mb-2"}; }>
							<h3 class="text-white font-bold">{customer.name}</h3}; }>
							<span class="text-xs text-white/40">{customer.lastPurchase}</span}; }>
						</div}; }>
						<p class="text-white/60 text-sm mb-3">📞 {customer.phone}</p}; }>
						<div class="flex justify-between items-center"}; }>
							<div}; }>
								<p class="text-xs text-white/40">Saldo Pendiente</p}; }>
								<p class="text-lg font-bold {customer.balance > 0 ? 'text-danger' : 'text-success'}"}; }>
									${customer.balance.toFixed(2)}
								</p}; }>
							</div}; }>
							<div class="text-right"}; }>
								<p class="text-xs text-white/40">Límite Crédito</p}; }>
								<p class="text-sm text-white">${customer.creditLimit.toFixed(2)}</p}; }>
							</div}; }>
						</div}; }>
						{#if customer.balance > 0}
							<div class="mt-3 pt-3 border-t border-white/10"}; }>
								<button class="glass-button w-full text-sm py-2 bg-warning/20 hover:bg-warning/30"}; }>
									💰 Registrar Pago
								</button}; }>
							</div}; }>
						{/if}
					</div}; }>
				{/each}
			</div}; }>
		</div}; }>

		<!-- Formulario Nuevo Cliente --}; }>
		<div class="glass-card"}; }>
			<h2 class="text-lg font-bold text-white mb-4">➕ Nuevo Cliente</h2}; }>
			<form class="space-y-4" onsubmit={(e) => { e.preventDefault();}; }>
				<div}; }>
					<label class="block text-white/80 text-sm mb-2">Nombre Completo</label}; }>
					<input type="text" class="glass-button w-full" placeholder="Ej: Ana Martínez" /}; }>
				</div}; }>
				<div}; }>
					<label class="block text-white/80 text-sm mb-2">Teléfono</label}; }>
					<input type="tel" class="glass-button w-full" placeholder="Ej: 8888-8888" /}; }>
				</div}; }>
				<div}; }>
					<label class="block text-white/80 text-sm mb-2">Límite de Crédito</label}; }>
					<input type="number" step="0.01" class="glass-button w-full" placeholder="0.00" /}; }>
				</div}; }>
				<div}; }>
					<label class="block text-white/80 text-sm mb-2">Dirección (Opcional)</label}; }>
					<textarea class="glass-button w-full" rows="2" placeholder="Dirección del cliente"></textarea}; }>
				</div}; }>
				<button type="submit" class="glass-button w-full bg-primary/50 hover:bg-primary/70"}; }>
					Guardar Cliente
				</button}; }>
			</form}; }>
		</div}; }>
	</div}; }>
</div}; }>
