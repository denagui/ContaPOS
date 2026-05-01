<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		variant?: 'default' | 'success' | 'warning' | 'error';
		class?: string;
	}

	let {
		variant = 'default',
		class: className = '',
		children,
		...restProps
	}: Props & { children?: any } = $props();

	const variants = {
		default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
		success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
		warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
		error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
	};

	const classes = $derived(
		cn(
			'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
			variants[variant],
			className
		)
	);
</script>

<span class={classes} {...restProps}>
	{children}
</span>
