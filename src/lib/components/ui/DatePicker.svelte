<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		label?: string;
		value?: Date | null;
		min?: Date;
		max?: Date;
		disabled?: boolean;
		error?: string;
		class?: string;
	}

	let {
		label,
		value = $bindable(null as Date | null),
		min,
		max,
		disabled = false,
		error,
		class: className = '',
		...restProps
	}: Props = $props();

	const baseStyles = 'space-y-1.5';
	
	const inputWrapperStyles = 'relative';
	
	const inputStyles = 'w-full px-4 py-3 pr-12 rounded-xl border bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white';
	
	const stateStyles = $derived(
		error 
			? 'border-red-300 focus:ring-red-500 dark:border-red-800' 
			: 'border-gray-200 dark:border-gray-700'
	);

	function formatDate(date: Date | null): string {
		if (!date) return '';
		return date.toLocaleDateString('es-CR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.value) {
			value = new Date(target.value);
		} else {
			value = null;
		}
	}

	function getISODate(date: Date | null): string {
		if (!date) return '';
		return date.toISOString().split('T')[0];
	}
</script>

<div class={cn(baseStyles, className)} {...restProps}>
	{#if label}
		<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
			{label}
		</label>
	{/if}
	
	<div class={inputWrapperStyles}>
		<input
			type="date"
			:value={getISODate(value)}
			{min}
			{max}
			{disabled}
			class={cn(inputStyles, stateStyles)}
			onchange={handleInputChange}
		/>
		
		<div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
			<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
		</div>
	</div>

	{#if error}
		<p class="text-xs text-red-600 dark:text-red-400">{error}</p>
	{/if}
</div>
