<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		value?: number;
		max?: number;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'success' | 'warning' | 'danger';
		showLabel?: boolean;
		label?: string;
		class?: string;
	}

	let {
		value = 0,
		max = 100,
		size = 'md',
		variant = 'default',
		showLabel = false,
		label,
		class: className = '',
		...restProps
	}: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));

	const baseStyles = 'w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 backdrop-blur-sm';
	
	const sizes = {
		sm: 'h-1.5',
		md: 'h-2.5',
		lg: 'h-4'
	};

	function getVariantStyles(): string {
		switch (variant) {
			case 'success':
				return 'bg-gradient-to-r from-green-500 to-emerald-500';
			case 'warning':
				return 'bg-gradient-to-r from-yellow-500 to-orange-500';
			case 'danger':
				return 'bg-gradient-to-r from-red-500 to-rose-500';
			default:
				return 'bg-gradient-to-r from-blue-500 to-indigo-500';
		}
	}

	function getLabelColor(): string {
		switch (variant) {
			case 'success':
				return 'text-green-600 dark:text-green-400';
			case 'warning':
				return 'text-yellow-600 dark:text-yellow-400';
			case 'danger':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-blue-600 dark:text-blue-400';
		}
	}
</script>

<div class={cn('space-y-2', className)} {...restProps}>
	{#if showLabel || label}
		<div class="flex items-center justify-between">
			{#if label}
				<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
			{/if}
			{#if showLabel}
				<span class={cn("text-sm font-semibold", getLabelColor())}>
					{percentage.toFixed(0)}%
				</span>
			{/if}
		</div>
	{/if}
	
	<div class={cn(baseStyles, sizes[size])}>
		<div 
			class={cn("h-full rounded-full transition-all duration-500 ease-out", getVariantStyles())}
			style="width: {percentage}%;"
			role="progressbar"
			aria-valuenow={value}
			aria-valuemin="0"
			aria-valuemax={max}
		></div>
	</div>
</div>
