<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		label?: string;
		checked?: boolean;
		disabled?: boolean;
		class?: string;
	}

	let {
		label,
		checked = $bindable(false),
		disabled = false,
		class: className = '',
		...restProps
	}: Props = $props();

	const baseStyles = 'flex items-center space-x-2.5 cursor-pointer group';
	
	const checkboxStyles = 'w-5 h-5 rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900';
	
	const checkedStyles = 'bg-blue-600 border-blue-600 text-white';
	
	const uncheckedStyles = 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-500';
	
	const labelStyles = 'text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-150';
	
	const disabledStyles = 'opacity-50 cursor-not-allowed';
</script>

<label class={cn(baseStyles, disabled && disabledStyles, className)} {...restProps}>
	<input
		type="checkbox"
		bind:checked
		{disabled}
		class="sr-only"
	/>
	
	<div 
		class={cn(
			checkboxStyles,
			checked ? checkedStyles : uncheckedStyles,
			disabled && 'cursor-not-allowed'
		)}
		role="checkbox"
		aria-checked={checked}
	>
		{#if checked}
			<svg class="w-full h-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
		{/if}
	</div>

	{#if label}
		<span class={labelStyles}>{label}</span>
	{/if}
</label>
