<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';

	type UserRole = 'owner' | 'admin' | 'cashier' | 'waiter' | 'accountant';
	type Industry = 'retail' | 'restaurant' | 'services' | 'utility';

	interface NavItem {
		title: string;
		href: string;
		icon: string;
		roles: UserRole[];
		industries?: Industry[];
	}

	const navItems: NavItem[] = [
		{ title: 'Dashboard', href: '/', icon: '📊', roles: ['owner', 'admin', 'accountant'], industries: ['retail', 'restaurant', 'services', 'utility'] },
		{ title: 'POS', href: '/pos', icon: '🛒', roles: ['owner', 'admin', 'cashier'], industries: ['retail', 'restaurant'] },
		{ title: 'Inventario', href: '/inventory', icon: '📦', roles: ['owner', 'admin'], industries: ['retail', 'restaurant'] },
		{ title: 'Mesas', href: '/tables', icon: '🪑', roles: ['owner', 'admin', 'waiter'], industries: ['restaurant'] },
		{ title: 'Gastos', href: '/expenses', icon: '💸', roles: ['owner', 'admin'], industries: ['retail', 'restaurant', 'services', 'utility'] },
		{ title: 'Contactos', href: '/crm', icon: '👥', roles: ['owner', 'admin'], industries: ['retail', 'restaurant', 'services', 'utility'] },
		{ title: 'Contabilidad', href: '/accounting', icon: '📈', roles: ['owner', 'admin', 'accountant'], industries: ['retail', 'restaurant', 'services', 'utility'] },
		{ title: 'Reportes', href: '/reports', icon: '📑', roles: ['owner', 'admin', 'accountant'], industries: ['retail', 'restaurant', 'services', 'utility'] },
		{ title: 'Configuración', href: '/settings', icon: '⚙️', roles: ['owner', 'admin'], industries: ['retail', 'restaurant', 'services', 'utility'] }
	];

	let currentRole: UserRole = $state('owner');
	let currentIndustry: Industry = $state('retail');
	let isMobile = $state(false);

	// Detección de dispositivo
	$effect(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	// Obtener datos del usuario (mock por ahora)
	$effect(() => {
		// Aquí se leerá de la sesión real más adelante
		currentRole = 'owner';
		currentIndustry = 'retail';
	});

	const visibleItems = $derived(
		navItems.filter(item => 
			item.roles.includes(currentRole) && 
			(!item.industries || item.industries.includes(currentIndustry))
		)
	);
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
	<!-- Desktop Sidebar -->
	{#if !isMobile}
		<aside class="fixed inset-y-0 left-0 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50">
			<div class="flex flex-col h-full">
				<div class="p-6">
					<h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						ContaPOS
					</h1>
					<p class="text-xs text-gray-500 mt-1 capitalize">{currentIndustry} • {currentRole}</p>
				</div>
				
				<nav class="flex-1 px-4 space-y-2 overflow-y-auto">
					{#each visibleItems as item}
						<a
							href={item.href}
							class={cn(
								'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
								$page.url.pathname === item.href
									? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
									: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
							)}
						>
							<span class="text-xl">{item.icon}</span>
							<span>{item.title}</span>
						</a>
					{/each}
				</nav>

				<div class="p-4 border-t border-gray-200/50 dark:border-gray-800/50">
					<a href="/login" class="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-xl transition-all">
						<span>🚪</span>
						<span>Cerrar sesión</span>
					</a>
				</div>
			</div>
		</aside>
		<main class="ml-64 p-8">
			<slot />
		</main>
	{:else}
		<!-- Mobile Bottom Bar -->
		<main class="pb-20">
			<div class="p-4">
				<slot />
			</div>
		</main>
		<nav class="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 safe-area-pb">
			<div class="flex justify-around items-center h-16">
				{#each visibleItems.slice(0, 5) as item}
					<a
						href={item.href}
						class={cn(
							'flex flex-col items-center justify-center w-full h-full space-y-1',
							$page.url.pathname === item.href
								? 'text-blue-600 dark:text-blue-400'
								: 'text-gray-500 dark:text-gray-400'
						)}
					>
						<span class="text-xl">{item.icon}</span>
						<span class="text-[10px] font-medium">{item.title}</span>
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</div>
