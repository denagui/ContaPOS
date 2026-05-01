<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		closeOnOverlay?: boolean;
		class?: string;
	}

	let {
		open = $bindable(false),
		title,
		description,
		size = 'md',
		closeOnOverlay = true,
		class: className = '',
		children,
		...restProps
	}: Props & { children?: any } = $props();

	const baseStyles = 'fixed inset-0 z-50 flex items-center justify-center p-4';
	
	const overlayStyles = 'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200';
	
	const sizes = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	const modalStyles = 'relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all duration-200 overflow-hidden backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50';

	function handleClose() {
		if (closeOnOverlay) {
			open = false;
		}
	}
</script>

{#if open}
	<div class={cn(baseStyles, className)} {...restProps} role="dialog" aria-modal="true">
		<div 
			class={overlayStyles} 
			onclick={handleClose}
			transition:fade={{ duration: 200 }}
		></div>
		
		<div 
			class={cn(modalStyles, sizes[size])}
			transition:scale={{ duration: 200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
		>
			{#if title || description}
				<div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
					{#if title}
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
							{title}
						</h3>
					{/if}
					{#if description}
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							{description}
						</p>
					{/if}
					
					<button
						onclick={() => open = false}
						class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
						aria-label="Cerrar"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{:else}
				<button
					onclick={() => open = false}
					class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 z-10"
					aria-label="Cerrar"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
			
			<div class="px-6 py-4">
				{children}
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.modal-enter) {
		opacity: 0;
		transform: scale(0.95);
	}
	:global(.modal-enter-active) {
		opacity: 1;
		transform: scale(1);
	}
	:global(.modal-exit) {
		opacity: 1;
		transform: scale(1);
	}
	:global(.modal-exit-active) {
		opacity: 0;
		transform: scale(0.95);
	}
</style>
