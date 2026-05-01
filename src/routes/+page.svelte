<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let isOnline = $state(true);
	let showOfflineBanner = $state(false);

	onMount(() => {
		// Detectar estado de conexión
		isOnline = navigator.onLine;
		
		window.addEventListener('online', () => {
			isOnline = true;
			showOfflineBanner = false;
		});

		window.addEventListener('offline', () => {
			isOnline = false;
			showOfflineBanner = true;
			setTimeout(() => showOfflineBanner = false, 5000);
		});

		// Registrar Service Worker para PWA
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js')
				.then(reg => console.log('SW registrado:', reg.scope))
				.catch(err => console.error('SW error:', err));
		}
	});
</script>

<svelte:head>
	<title>{data.message}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 md:p-8">
	{#if showOfflineBanner}
		<div class="offline-indicator">
			⚠️ Modo offline activado
		</div>
	{/if}

	<header class="glass-card mb-8">
		<h1 class="text-3xl md:text-4xl font-bold text-white mb-2">
			🏪 POS Moderno
		</h1>
		<p class="text-white/80">
			Sistema para Pulperías y Sodas - {data.version}
		</p>
	</header>

	<main class="pos-grid gap-4 md:gap-6">
		<a href="/pos" class="glass-card group">
			<div class="text-4xl mb-3">🛒</div>
			<h2 class="text-xl font-bold text-white group-hover:text-primary transition-colors">
				Punto de Venta
			</h2>
			<p class="text-white/60 text-sm mt-2">
				Ventas rápidas con lector de código de barras
			</p>
		</a>

		<a href="/inventory" class="glass-card group">
			<div class="text-4xl mb-3">📦</div>
			<h2 class="text-xl font-bold text-white group-hover:text-success transition-colors">
				Inventario
			</h2>
			<p class="text-white/60 text-sm mt-2">
				Gestión de productos y stock
			</p>
		</a>

		<a href="/crm" class="glass-card group">
			<div class="text-4xl mb-3">👥</div>
			<h2 class="text-xl font-bold text-white group-hover:text-warning transition-colors">
				CRM
			</h2>
			<p class="text-white/60 text-sm mt-2">
				Clientes y sistema de fiado
			</p>
		</a>

		<a href="/reports" class="glass-card group">
			<div class="text-4xl mb-3">📊</div>
			<h2 class="text-xl font-bold text-white group-hover:text-primary transition-colors">
				Reportes
			</h2>
			<p class="text-white/60 text-sm mt-2">
				Ventas diarias y análisis
			</p>
		</a>

		<a href="/settings" class="glass-card group">
			<div class="text-4xl mb-3">⚙️</div>
			<h2 class="text-xl font-bold text-white group-hover:text-danger transition-colors">
				Configuración
			</h2>
			<p class="text-white/60 text-sm mt-2">
				Sucursales, usuarios e impuestos
			</p>
		</a>
	</main>

	<footer class="mt-12 text-center text-white/40 text-sm">
		<p>Stack: Svelte 5 + Tailwind v4 + Cloudflare D1/KV/R2</p>
		<p class="mt-1">Diseño Liquid Glass - Mobile First</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: var(--font-family-sans);
	}
</style>
