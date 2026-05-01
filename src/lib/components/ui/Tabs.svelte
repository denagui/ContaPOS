<script lang="ts">
	import { cn } from '$lib/utils';

	interface Tab {
		id: string;
		label: string;
		icon?: any;
		disabled?: boolean;
		badge?: string | number;
	}

	interface Props {
		tabs: Tab[];
		activeTab?: string;
		variant?: 'default' | 'pills' | 'underline';
		class?: string;
	}

	let {
		tabs = [],
		activeTab = $bindable(''),
		variant = 'default',
		class: className = '',
		...restProps
	}: Props = $props();

	const baseStyles = 'flex space-x-1 p-1 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm';
	
	const pillsStyles = 'flex space-x-2';
	
	const underlineStyles = 'flex space-x-6 border-b border-gray-200 dark:border-gray-700 bg-transparent';

	function getTabStyles(tab: Tab): string {
		const isActive = activeTab === tab.id;
		const isDisabled = tab.disabled;

		const base = 'inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap';

		if (variant === 'pills') {
			if (isDisabled) return `${base} opacity-50 cursor-not-allowed`;
			return isActive 
				? `${base} bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm` 
				: `${base} text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50`;
		}

		if (variant === 'underline') {
			if (isDisabled) return `${base} opacity-50 cursor-not-allowed border-b-2 border-transparent`;
			return isActive 
				? `${base} text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-2.5 -mb-px` 
				: `${base} text-gray-600 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 pb-2.5 -mb-px`;
		}

		// Default variant
		if (isDisabled) return `${base} opacity-50 cursor-not-allowed`;
		return isActive 
			? `${base} bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm` 
			: `${base} text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50`;
	}
</script>

<div class={cn(variant === 'default' ? baseStyles : variant === 'pills' ? pillsStyles : underlineStyles, className)} {...restProps}>
	{#each tabs as tab (tab.id)}
		<button
			type="button"
			class={getTabStyles(tab)}
			disabled={tab.disabled}
			onclick={() => { if (!tab.disabled) activeTab = tab.id; }}
		>
			{#if tab.icon}
				<svelte:component this={tab.icon} class="w-4 h-4 mr-2" />
			{/if}
			{tab.label}
			
			{#if tab.badge !== undefined}
				<span class="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
					{tab.badge}
				</span>
			{/if}
		</button>
	{/each}
</div>
