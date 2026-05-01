<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		items: any[];
		columns: { key: string; label: string; render?: (item: any) => any }[];
		selectable?: boolean;
		selectedRows?: any[];
		class?: string;
	}

	let {
		items = [],
		columns = [],
		selectable = false,
		selectedRows = $bindable([]),
		class: className = '',
		...restProps
	}: Props = $props();

	const baseStyles = 'w-full border-collapse rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50';

	const headerStyles = 'bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm';
	
	const rowStyles = 'border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-150';
	
	const cellStyles = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300';
	
	const headerCellStyles = 'px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-left';

	function toggleSelection(item: any) {
		if (!selectable) return;
		
		const index = selectedRows.findIndex(row => row.id === item.id);
		if (index > -1) {
			selectedRows = selectedRows.filter(row => row.id !== item.id);
		} else {
			selectedRows = [...selectedRows, item];
		}
	}

	function isSelected(item: any) {
		return selectedRows.some(row => row.id === item.id);
	}
</script>

<div class={cn('overflow-x-auto', className)} {...restProps}>
	<table class={baseStyles}>
		<thead>
			<tr class={headerStyles}>
				{#if selectable}
					<th class={headerCellStyles} style="width: 50px;">
						<input 
							type="checkbox" 
							class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
							checked={selectedRows.length === items.length && items.length > 0}
							onchange={(e) => {
								if (e.currentTarget.checked) {
									selectedRows = [...items];
								} else {
									selectedRows = [];
								}
							}}
						/>
					</th>
				{/if}
				{#each columns as col}
					<th class={headerCellStyles}>{col.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each items as item (item.id)}
				<tr class={cn(rowStyles, isSelected(item) ? 'bg-blue-50/50 dark:bg-blue-900/20' : '')}>
					{#if selectable}
						<td class={cellStyles}>
							<input 
								type="checkbox" 
								class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
								checked={isSelected(item)}
								onclick={() => toggleSelection(item)}
							/>
						</td>
					{/if}
					{#each columns as col}
						<td class={cellStyles}>
							{#if col.render}
								{@render col.render(item)}
							{:else}
								{item[col.key]}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
			{#if items.length === 0}
				<tr>
					<td class={cellStyles} colspan={columns.length + (selectable ? 1 : 0)}>
						<div class="text-center py-8 text-gray-500 dark:text-gray-400">
							No hay datos disponibles
						</div>
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>
