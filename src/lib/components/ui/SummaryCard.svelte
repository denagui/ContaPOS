<script lang="ts">
	import { cn } from '$lib/utils';
	import MoneyUtils from '$lib/utils/money';

	interface Props {
		title?: string;
		value?: number | string;
		change?: number;
		icon?: any;
		variant?: 'default' | 'success' | 'warning' | 'danger';
		isMoney?: boolean;
		currency?: string;
		class?: string;
	}

	let {
		title,
		value = 0,
		change,
		icon,
		variant = 'default',
		isMoney = false,
		currency = 'CRC',
		class: className = '',
		...restProps
	}: Props = $props();

	function getVariantStyles(): string {
		switch (variant) {
			case 'success':
				return 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800';
			case 'warning':
				return 'bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
			case 'danger':
				return 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800';
			default:
				return 'bg-white/80 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700';
		}
	}

	function getChangeStyles(): string {
		if (!change) return '';
		return change >= 0 
			? 'text-green-600 dark:text-green-400' 
			: 'text-red-600 dark:text-red-400';
	}

	function formatValue(): string {
		if (isMoney) {
			const amount = typeof value === 'string' ? parseInt(value) : value;
			return MoneyUtils.format(amount, currency);
		}
		
		if (typeof value === 'number') {
			if (value >= 1000000) {
				return (value / 1000000).toFixed(1) + 'M';
			}
			if (value >= 1000) {
				return (value / 1000).toFixed(1) + 'K';
			}
			return value.toString();
		}
		
		return value.toString();
	}

	function getChangeText(): string {
		if (!change) return '';
		const sign = change >= 0 ? '+' : '';
		return `${sign}${change.toFixed(1)}%`;
	}
</script>

<div 
	class={cn(
		"relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-200 hover:shadow-lg",
		getVariantStyles(),
		className
	)} 
	{...restProps}
>
	<div class="flex items-center justify-between">
		<div class="flex-1 min-w-0">
			{#if title}
				<p class="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
					{title}
				</p>
			{/if}
			
			<div class="mt-2 flex items-baseline space-x-2">
				<p class="text-3xl font-bold text-gray-900 dark:text-white">
					{formatValue()}
				</p>
				
				{#if change !== undefined && change !== null}
					<span class={cn("inline-flex items-center text-sm font-semibold px-2 py-0.5 rounded-full bg-opacity-20", getChangeStyles())}>
						{#if change >= 0}
							<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
							</svg>
						{:else}
							<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
							</svg>
						{/if}
						{getChangeText()}
					</span>
				{/if}
			</div>
		</div>

		{#if icon}
			<div class="flex-shrink-0 ml-4">
				<div class={cn(
					"w-12 h-12 rounded-xl flex items-center justify-center",
					variant === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
					variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
					variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
					'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
				)}>
					<svelte:component this={icon} class="w-6 h-6" />
				</div>
			</div>
		{/if}
	</div>
</div>
