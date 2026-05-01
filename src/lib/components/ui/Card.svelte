<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		title?: string;
		description?: string;
		class?: string;
	}

	let {
		title,
		description,
		class: className = '',
		children,
		...restProps
	}: Props & { children?: any } = $props();

	const classes = $derived(
		cn(
			'relative rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 p-6',
			className
		)
	);
</script>

<div class={classes} {...restProps}>
	{#if title || description}
		<div class="mb-4">
			{#if title}
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
			{/if}
			{#if description}
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
			{/if}
		</div>
	{/if}
	{children}
</div>
