<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		type?: 'button' | 'submit' | 'reset';
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		class: className = '',
		type = 'button',
		children,
		...restProps
	}: Props & { children?: any } = $props();

	const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
	
	const variants = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 focus:ring-blue-500',
		secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm focus:ring-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700',
		danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 focus:ring-red-500',
		ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
	};

	const sizes = {
		sm: 'h-9 px-3 text-xs',
		md: 'h-11 px-5 text-sm',
		lg: 'h-14 px-8 text-base'
	};

	const classes = $derived(
		cn(baseStyles, variants[variant], sizes[size], className)
	);
</script>

<button 
	{type} 
	{disabled} 
	class={classes} 
	{...restProps}
>
	{#if loading}
		<svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	{/if}
	{children}
</button>
