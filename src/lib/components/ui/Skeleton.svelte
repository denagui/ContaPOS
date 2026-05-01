<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		count?: number;
		class?: string;
	}

	let { count = 3, class: className = '' }: Props = $props();

	const classes = $derived(
		cn('space-y-3', className)
	);
</script>

<div class={classes}>
	{#each Array(count) as _, i}
		<div class="w-full h-32 rounded-2xl bg-gray-200/50 dark:bg-gray-800/50 animate-pulse" />
	{/each}
</div>
