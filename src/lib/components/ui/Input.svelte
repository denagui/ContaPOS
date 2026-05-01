<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		label?: string;
		type?: 'text' | 'email' | 'password' | 'number' | 'search';
		placeholder?: string;
		value?: string;
		error?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		label,
		type = 'text',
		placeholder,
		value = $bindable(''),
		error,
		disabled = false,
		class: className = '',
		...restProps
	}: Props = $props();

	const baseStyles = 'w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';
	
	const stateStyles = $derived(
		error 
			? 'border-red-300 focus:ring-red-500 dark:border-red-800' 
			: 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400'
	);

	const classes = $derived(cn(baseStyles, stateStyles, className));
</script>

<div class="space-y-1.5">
	{#if label}
		<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
			{label}
		</label>
	{/if}
	<input 
		{type} 
		{placeholder} 
		bind:value 
		{disabled} 
		class={classes} 
		{...restProps} 
	/>
	{#if error}
		<p class="text-xs text-red-600 dark:text-red-400">{error}</p>
	{/if}
</div>
