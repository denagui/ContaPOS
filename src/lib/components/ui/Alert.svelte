<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		title?: string;
		description?: string;
		variant?: 'info' | 'success' | 'warning' | 'error';
		dismissible?: boolean;
		class?: string;
	}

	let {
		title,
		description,
		variant = 'info',
		dismissible = false,
		class: className = '',
		children,
		...restProps
	}: Props & { children?: any } = $props();

	let isVisible = $state(true);

	function getVariantStyles(): string {
		switch (variant) {
			case 'success':
				return 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
			case 'warning':
				return 'bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
			case 'error':
				return 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
			default:
				return 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
		}
	}

	function getIconColor(): string {
		switch (variant) {
			case 'success':
				return 'text-green-600 dark:text-green-400';
			case 'warning':
				return 'text-yellow-600 dark:text-yellow-400';
			case 'error':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-blue-600 dark:text-blue-400';
		}
	}

	function getIcon(): string {
		switch (variant) {
			case 'success':
				return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'warning':
				return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
			case 'error':
				return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
			default:
				return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}
</script>

{#if isVisible}
	<div 
		class={cn(
			"relative px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-200",
			getVariantStyles(),
			className
		)} 
		role="alert"
		{...restProps}
	>
		<div class="flex items-start space-x-3">
			<svg class={cn("w-5 h-5 flex-shrink-0 mt-0.5", getIconColor())} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon()} />
			</svg>
			
			<div class="flex-1 min-w-0">
				{#if title}
					<h4 class="text-sm font-semibold">{title}</h4>
				{/if}
				
				{#if description || children}
					<div class={cn("mt-1 text-sm", title ? '' : 'font-medium')}>
						{description}
						{children}
					</div>
				{/if}
			</div>

			{#if dismissible}
				<button
					type="button"
					onclick={() => isVisible = false}
					class="flex-shrink-0 ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-150 focus:outline-none"
					aria-label="Cerrar"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
{/if}
