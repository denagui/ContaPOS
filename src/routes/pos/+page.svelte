<script lang="ts">
	import { onMount } from 'svelte';

	type Product = {
		id: string;
		name: string;
		price: number;
		stock: number;
		barcode?: string;
		imageUrl?: string;
	};

	type CartItem = Product & {
		quantity: number;
		subtotal: number;
	};

	let searchQuery = $state('');
	let cart = $state<CartItem[]>([]);
	let products = $state<Product[]>([]);
	let barcodeScanned = $state('');
	let isProcessing = $state(false);

	// Productos de ejemplo (luego vendrán de D1)
	$effect(() => {
		products = [
			{ id: '1', name: 'Arroz Tío Pelón 1kg', price: 1.20, stock: 50, barcode: '7501234567890' },
			{ id: '2', name: 'Frijoles Negros 500g', price: 0.85, stock: 30, barcode: '7501234567891' },
			{ id: '3', name: 'Leche Dos Pinos 1L', price: 1.50, stock: 25, barcode: '7501234567892' },
			{ id: '4', name: 'Huevos Docena', price: 2.80, stock: 15, barcode: '7501234567893' },
			{ id: '5', name: 'Pan Gallo Negro', price: 0.50, stock: 100, barcode: '7501234567894' },
			{ id: '6', name: 'Refresco Coca-Cola 500ml', price: 1.00, stock: 40, barcode: '7501234567895' },
			{ id: '7', name: 'Galletas Gamesa', price: 0.75, stock: 60, barcode: '7501234567896' },
			{ id: '8', name: 'Aceite Vegetal 1L', price: 2.50, stock: 20, barcode: '7501234567897' }
		];
	});

	// Escuchar lector de código de barras (USB/Bluetooth)
	onMount(() => {
		const handleBarcode = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				addProductByBarcode(barcodeScanned);
				barcodeScanned = '';
			} else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) {
				barcodeScanned += e.key;
			}
		};

		window.addEventListener('keydown', handleBarcode);
		return () => window.removeEventListener('keydown', handleBarcode);
	});

	function addToCart(product: Product) {
		const existing = cart.find(item => item.id === product.id);
		if (existing) {
			if (existing.quantity < product.stock) {
				existing.quantity++;
				existing.subtotal = existing.quantity * existing.price;
			}
		} else {
			cart.push({
				...product,
				quantity: 1,
				subtotal: product.price
			});
		}
	}

	function addProductByBarcode(barcode: string) {
		const product = products.find(p => p.barcode === barcode);
		if (product) {
			addToCart(product);
		} else {
			alert('Producto no encontrado: ' + barcode);
		}
	}

	function removeFromCart(productId: string) {
		cart = cart.filter(item => item.id !== productId);
	}

	function updateQuantity(item: CartItem, delta: number) {
		const newQty = item.quantity + delta;
		if (newQty <= 0) {
			removeFromCart(item.id);
		} else if (newQty <= item.stock) {
			item.quantity = newQty;
			item.subtotal = newQty * item.price;
		}
	}

	function get total() {
		return cart.reduce((sum, item) => sum + item.subtotal, 0);
	}

	async function processPayment(method: 'cash' | 'card' | 'transfer' | 'credit') {
		if (cart.length === 0) return;
		
		isProcessing = true;
		// Simular procesamiento
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		alert(`Venta procesada: $${total.toFixed(2)} (${method})`);
		cart = [];
		isProcessing = false;
	}

	const filteredProducts = $derived(
		searchQuery 
			? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: products
	);
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
	<header class="glass-card mb-6">
		<h1 class="text-2xl md:text-3xl font-bold text-white mb-4">🛒 Punto de Venta</h1>
		
		<!-- Buscador y Lector -->
		<div class="flex flex-col md:flex-row gap-4">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="🔍 Buscar producto..."
				class="glass-button flex-1 text-white placeholder-white/60"
			/>
			<div class="glass px-4 py-3 rounded-xl flex items-center gap-2">
				<span class="text-white/60 text-sm">Código:</span>
				<span class="text-white font-mono">{barcodeScanned || '---'}</span>
			</div>
		</div>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Lista de Productos -->
		<div class="lg:col-span-2">
			<div class="pos-grid max-h-[60vh] overflow-y-auto pr-2">
				{#each filteredProducts as product (product.id)}
					<button
						onclick={() => addToCart(product)}
						class="glass-card group text-left disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={product.stock === 0}
					>
						<div class="flex items-start justify-between mb-2">
							<h3 class="font-semibold text-white group-hover:text-primary transition-colors">
								{product.name}
							</h3>
							{#if product.imageUrl}
								<img src={product.imageUrl} alt="" class="w-12 h-12 rounded-lg object-cover" />
							{/if}
						</div>
						<div class="flex justify-between items-center">
							<span class="text-success font-bold">${product.price.toFixed(2)}</span>
							<span class="text-xs text-white/60">Stock: {product.stock}</span>
						</div>
						{#if product.barcode}
							<p class="text-xs text-white/40 mt-1 font-mono">{product.barcode}</p>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Carrito -->
		<div class="glass-card h-fit">
			<h2 class="text-xl font-bold text-white mb-4">📋 Orden Actual</h2>
			
			{#if cart.length === 0}
				<p class="text-white/60 text-center py-8">Carrito vacío</p>
			{:else}
				<div class="space-y-3 max-h-[40vh] overflow-y-auto mb-4">
					{#each cart as item (item.id)}
						<div class="bg-white/5 rounded-lg p-3">
							<div class="flex justify-between items-start mb-2">
								<h4 class="text-white text-sm font-medium flex-1">{item.name}</h4>
								<button 
									onclick={() => removeFromCart(item.id)}
									class="text-danger hover:text-red-400 ml-2"
								>
									✕
								</button>
							</div>
							<div class="flex justify-between items-center">
								<div class="flex items-center gap-2">
									<button 
										onclick={() => updateQuantity(item, -1)}
										class="glass px-2 py-1 rounded text-white hover:bg-white/20"
									>−</button>
									<span class="text-white w-6 text-center">{item.quantity}</span>
									<button 
										onclick={() => updateQuantity(item, 1)}
										class="glass px-2 py-1 rounded text-white hover:bg-white/20"
									>+</button>
								</div>
								<span class="text-success font-bold">${item.subtotal.toFixed(2)}</span>
							</div>
						</div>
					{/each}
				</div>

				<div class="border-t border-white/20 pt-4 mb-4">
					<div class="flex justify-between items-center mb-4">
						<span class="text-white/80">Total:</span>
						<span class="text-2xl font-bold text-success">${total.toFixed(2)}</span>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<button
							onclick={() => processPayment('cash')}
							disabled={isProcessing}
							class="glass-button bg-green-600/50 hover:bg-green-600/70"
						>
							💵 Efectivo
						</button>
						<button
							onclick={() => processPayment('card')}
							disabled={isProcessing}
							class="glass-button bg-blue-600/50 hover:bg-blue-600/70"
						>
							💳 Tarjeta
						</button>
						<button
							onclick={() => processPayment('transfer')}
							disabled={isProcessing}
							class="glass-button bg-purple-600/50 hover:bg-purple-600/70"
						>
							🏦 Transferencia
						</button>
						<button
							onclick={() => processPayment('credit')}
							disabled={isProcessing}
							class="glass-button bg-orange-600/50 hover:bg-orange-600/70"
						>
							📝 Fiado
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
