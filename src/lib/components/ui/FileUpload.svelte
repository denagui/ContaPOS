<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		label?: string;
		accept?: string;
		multiple?: boolean;
		disabled?: boolean;
		error?: string;
		class?: string;
		onFileSelect?: (files: File[]) => void;
	}

	let {
		label = 'Arrastra archivos aquí o haz clic para seleccionar',
		accept = '.csv,.ofx,.qif',
		multiple = false,
		disabled = false,
		error,
		class: className = '',
		onFileSelect
	}: Props = $props();

	let isDragging = $state(false);
	let files = $state<File[]>([]);

	const baseStyles = 'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50';
	
	const dragStyles = $derived(
		isDragging 
			? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 scale-[1.02]' 
			: error 
				? 'border-red-300 dark:border-red-800 hover:border-red-400' 
				: 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
	);

	const classes = $derived(cn(baseStyles, dragStyles, className));

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (!disabled) {
			isDragging = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		
		if (disabled || !e.dataTransfer?.files) return;
		
		const droppedFiles = Array.from(e.dataTransfer.files);
		handleFiles(droppedFiles);
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files) return;
		
		const selectedFiles = Array.from(target.files);
		handleFiles(selectedFiles);
	}

	function handleFiles(newFiles: File[]) {
		if (multiple) {
			files = [...files, ...newFiles];
		} else {
			files = [newFiles[0]];
		}
		
		onFileSelect?.(files);
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
		onFileSelect?.(files);
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<div class={classes} {...{ ondragover: handleDragOver, ondragleave: handleDragLeave, ondrop: handleDrop }}>
	<input
		type="file"
		{accept}
		{multiple}
		{disabled}
		class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
		onchange={handleFileInput}
	/>
	
	<div class="space-y-4">
		<div class="flex justify-center">
			<div class="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
				<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
				</svg>
			</div>
		</div>
		
		<div>
			<p class="text-sm font-medium text-gray-900 dark:text-white">
				{label}
			</p>
			<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
				CSV, OFX, QIF hasta 10MB
			</p>
		</div>

		{#if files.length > 0}
			<div class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
				{#each files as file, index}
					<div class="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl backdrop-blur-sm">
						<div class="flex items-center space-x-3 overflow-hidden">
							<svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							<div class="overflow-hidden">
								<p class="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
							</div>
						</div>
						<button
							type="button"
							onclick={(e) => { e.stopPropagation(); removeFile(index); }}
							class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 flex-shrink-0"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
	{/if}
</div>
