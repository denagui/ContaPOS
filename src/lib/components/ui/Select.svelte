<script lang="ts">
	import { cn } from '$lib/utils';

	interface Option {
		value: string | number;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		label?: string;
		options: Option[];
		value?: string | number;
		placeholder?: string;
		disabled?: boolean;
		error?: string;
		class?: string;
	}

	let {
		label,
		options = [],
		value = $bindable(''),
		placeholder = 'Seleccionar...',
		disabled = false,
		error,
		class: className = '',
		...restProps
	}: Props = $props();

	let isOpen = $state(false);

	const baseStyles = 'relative';
	
	const triggerStyles = 'w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center justify-between';
	
	const stateStyles = $derived(
		error 
			? 'border-red-300 focus:ring-red-500 dark:border-red-800' 
			: 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
	);

	const dropdownStyles = 'absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg backdrop-blur-xl py-1';
	
	const optionStyles = 'px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150';
	
	const optionActiveStyles = 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
	
	const optionHoverStyles = 'hover:bg-gray-50 dark:hover:bg-gray-800';

	function selectOption(option: Option) {
		if (option.disabled) return;
		value = option.value;
		isOpen = false;
	}

	function getSelectedLabel(): string {
		const selected = options.find(opt => opt.value === value);
		return selected ? selected.label : placeholder;
	}
</script>

<div class={cn(baseStyles, className)} {...restProps}>
	{#if label}
		<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
			{label}
		</label>
	{/if}
	
	<div class={baseStyles}>
		<button
			type="button"
			class={cn(triggerStyles, stateStyles)}
			disabled={disabled}
			onclick={() => { if (!disabled) isOpen = !isOpen; }}
		>
			<span class={value ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
				{getSelectedLabel()}
			</span>
			<svg 
				class={cn("w-5 h-5 text-gray-400 transition-transform duration-200", isOpen && 'rotate-180')} 
				fill="none" 
				stroke="currentColor" 
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if isOpen}
			<div 
				class={dropdownStyles}
				transition:slide={{ duration: 150 }}
			>
				{#each options as option (option.value)}
					<div
						class={cn(
							optionStyles, 
							optionHoverStyles,
							value === option.value && optionActiveStyles,
							option.disabled && 'opacity-50 cursor-not-allowed'
						)}
						onclick={() => selectOption(option)}
					>
						{option.label}
					</div>
				{/each}
				{#if options.length === 0}
					<div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
						No hay opciones disponibles
					</div>
				{/if}
			</div>
			
			<div class="fixed inset-0 z-40" onclick={() => isOpen = false}></div>
		{/if}
	</div>

	{#if error}
		<p class="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
	{/if}
</div>

<style>
	:global(.slide-enter) {
		transform: translateY(-8px);
		opacity: 0;
	}
	:global(.slide-enter-active) {
		transform: translateY(0);
		opacity: 1;
	}
	:global(.slide-exit) {
		transform: translateY(0);
		opacity: 1;
	}
	:global(.slide-exit-active) {
		transform: translateY(-8px);
		opacity: 0;
	}
</style>
