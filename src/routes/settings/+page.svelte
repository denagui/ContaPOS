<script lang="ts">
	let settings = $state({
		storeName: 'Mi Pulpería',
		currency: 'CRC',
		taxRate: 13,
		address: 'San José, Costa Rica',
		phone: '8888-8888',
		email: 'contacto@mipulperia.com'
	});

	let saved = $state(false);

	function saveSettings() {
		saved = true;
		setTimeout(() => saved = false, 3000);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
	<header class="glass-card mb-6">
		<h1 class="text-2xl md:text-3xl font-bold text-white mb-2">⚙️ Configuración</h1>
		<p class="text-white/60">Administra tu negocio</p>
	</header>

	{#if saved}
		<div class="fixed top-4 right-4 glass bg-success/50 px-6 py-3 rounded-xl text-white animate-pulse">
			✓ Configuración guardada
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Configuración General -->
		<div class="glass-card">
			<h2 class="text-lg font-bold text-white mb-4">🏪 Datos del Negocio</h2>
			<form class="space-y-4" onsubmit|preventDefault={saveSettings}>
				<div>
					<label class="block text-white/80 text-sm mb-2">Nombre del Negocio</label>
					<input 
						type="text" 
						bind:value={settings.storeName}
						class="glass-button w-full" 
					/>
				</div>
				<div>
					<label class="block text-white/80 text-sm mb-2">Dirección</label>
					<input 
						type="text" 
						bind:value={settings.address}
						class="glass-button w-full" 
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-white/80 text-sm mb-2">Teléfono</label>
						<input 
							type="tel" 
							bind:value={settings.phone}
							class="glass-button w-full" 
						/>
					</div>
					<div>
						<label class="block text-white/80 text-sm mb-2">Email</label>
						<input 
							type="email" 
							bind:value={settings.email}
							class="glass-button w-full" 
						/>
					</div>
				</div>
				<button type="submit" class="glass-button w-full bg-primary/50 hover:bg-primary/70">
					Guardar Cambios
				</button>
			</form>
		</div>

		<!-- Configuración Fiscal -->
		<div class="glass-card">
			<h2 class="text-lg font-bold text-white mb-4">💰 Configuración Fiscal</h2>
			<form class="space-y-4" onsubmit|preventDefault={saveSettings}>
				<div>
					<label class="block text-white/80 text-sm mb-2">Moneda</label>
					<select bind:value={settings.currency} class="glass-button w-full">
						<option value="CRC">Colón Costarricense (₡)</option>
						<option value="USD">Dólar Estadounidense ($)</option>
					</select>
				</div>
				<div>
					<label class="block text-white/80 text-sm mb-2">Impuesto de Venta (%)</label>
					<input 
						type="number" 
						step="0.01"
						bind:value={settings.taxRate}
						class="glass-button w-full" 
					/>
				</div>
				<button type="submit" class="glass-button w-full bg-primary/50 hover:bg-primary/70">
					Actualizar Impuestos
				</button>
			</form>
		</div>

		<!-- Gestión de Usuarios -->
		<div class="glass-card">
			<h2 class="text-lg font-bold text-white mb-4">👥 Usuarios del Sistema</h2>
			<div class="space-y-3">
				<div class="bg-white/5 p-3 rounded-lg flex justify-between items-center">
					<div>
						<p class="text-white font-bold">Administrador</p>
						<p class="text-xs text-white/60">admin@mipulperia.com</p>
					</div>
					<span class="bg-success/20 text-success px-3 py-1 rounded-full text-xs">Activo</span>
				</div>
				<button class="glass-button w-full text-sm">
					➕ Agregar Usuario
				</button>
			</div>
		</div>

		<!-- Base de Datos y Respaldo -->
		<div class="glass-card">
			<h2 class="text-lg font-bold text-white mb-4">💾 Datos y Respaldo</h2>
			<div class="space-y-3">
				<button class="glass-button w-full text-left">
					📥 Exportar Datos (CSV)
				</button>
				<button class="glass-button w-full text-left">
					📤 Importar Productos
				</button>
				<button class="glass-button w-full text-left bg-warning/20 hover:bg-warning/30">
					💿 Crear Respaldo Completo
				</button>
				<button class="glass-button w-full text-left bg-danger/20 hover:bg-danger/30">
					🗑️ Resetear Sistema
				</button>
			</div>
		</div>
	</div>

	<!-- Información del Sistema -->
	<div class="glass-card mt-6">
		<h2 class="text-lg font-bold text-white mb-4">ℹ️ Información del Sistema</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
			<div>
				<p class="text-white/60 text-xs">Versión</p>
				<p class="text-white font-mono">1.0.0</p>
			</div>
			<div>
				<p class="text-white/60 text-xs">Stack</p>
				<p class="text-white font-mono text-xs">Svelte 5</p>
			</div>
			<div>
				<p class="text-white/60 text-xs">Base de Datos</p>
				<p class="text-white font-mono text-xs">Cloudflare D1</p>
			</div>
			<div>
				<p class="text-white/60 text-xs">Estado</p>
				<p class="text-success font-bold text-xs">● En línea</p>
			</div>
		</div>
	</div>
</div>
