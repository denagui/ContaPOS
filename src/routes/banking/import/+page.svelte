<script lang="ts">
	import { page } from '$app/stores';
	import type { BankAccount, BankTransaction } from '$lib/server/db/schema';
	import { MoneyUtils } from '$lib/utils/money';

	let bankAccounts = $prop<BankAccount[]>();
	let selectedAccountId = $prop<string>('');
	let statementDate = $state('');
	let file = $state<File | null>(null);
	let uploading = $state(false);
	let result = $state<{
		success?: boolean;
		message?: string;
		importedCount?: number;
		duplicatesSkipped?: number;
		parseErrors?: Array<{ row: number; error: string }> | null;
	} | null>(null);

	function formatCurrency(cents: number, currency: string) {
		return MoneyUtils.format(cents, currency as any);
	}

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			file = target.files[0];
		}
	}

	async function handleSubmit() {
		if (!file || !selectedAccountId) return;

		uploading = true;
		result = null;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('accountId', selectedAccountId);
		if (statementDate) {
			formData.append('statementDate', statementDate);
		}

		try {
			const response = await fetch('?/import', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();
			result = data;
		} catch (error) {
			result = {
				success: false,
				message: 'Error de conexión al importar'
			};
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Importar Transacciones - ContaPOS</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/banking" class="btn-secondary text-sm">
			<span class="i-lucide-arrow-left mr-2"></span>
			Volver
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Importar Transacciones Bancarias</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Sube un archivo CSV con los movimientos de tu cuenta</p>
		</div>
	</div>

	<!-- Formulario -->
	<div class="card p-6">
		<form use:preventDefault={handleSubmit} class="space-y-6">
			<!-- Selección de Cuenta -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Cuenta Bancaria *
				</label>
				<select 
					bind:value={selectedAccountId}
					class="w-full input"
					required
				>
					<option value="">Seleccionar cuenta...</option>
					{#each bankAccounts as account}
						<option value={account.id}>
							{account.name} ({account.accountNumber}) - {account.currency}
						</option>
					{/each}
				</select>
			</div>

			<!-- Fecha de Estado de Cuenta -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Fecha de Estado de Cuenta (opcional)
				</label>
				<input 
					type="date" 
					bind:value={statementDate}
					class="w-full input"
				/>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					Usada para calcular el saldo final del período
				</p>
			</div>

			<!-- Upload de Archivo -->
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Archivo CSV *
				</label>
				<div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-colors">
					<input 
						type="file" 
						accept=".csv"
						on:change={handleFileChange}
						class="hidden"
						id="file-upload"
					/>
					<label for="file-upload" class="cursor-pointer">
						<div class="i-lucide-upload mx-auto h-12 w-12 text-gray-400 mb-4"></div>
						<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
							{file ? file.name : 'Arrastra tu archivo CSV aquí o haz click para seleccionar'}
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-500">
							Formatos soportados: BAC San José, Banco Nacional, Scotiabank, Promerica
						</p>
					</label>
				</div>
			</div>

			<!-- Botón de Envío -->
			<div class="flex justify-end gap-3">
				<a href="/banking" class="btn-secondary">
					Cancelar
				</a>
				<button 
					type="submit" 
					disabled={!file || !selectedAccountId || uploading}
					class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if uploading}
						<span class="i-lucide-loader-2 animate-spin mr-2"></span>
						Importando...
					{:else}
						<span class="i-lucide-download mr-2"></span>
						Importar Transacciones
					{/if}
				</button>
			</div>
		</form>
	</div>

	<!-- Resultados -->
	{#if result}
		<div class="card p-6 {result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}">
			<div class="flex items-start gap-4">
				<div class="i-lucide-{result.success ? 'check-circle' : 'alert-circle'} h-6 w-6 {result.success ? 'text-green-600' : 'text-red-600'} mt-0.5"></div>
				<div class="flex-1">
					<h3 class="font-semibold {result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}">
						{result.message}
					</h3>
					{#if result.importedCount !== undefined}
						<div class="mt-2 text-sm text-green-700 dark:text-green-400">
							<p>✓ {result.importedCount} transacciones importadas</p>
							{#if result.duplicatesSkipped && result.duplicatesSkipped > 0}
								<p>⚠ {result.duplicatesSkipped} duplicados omitidos</p>
							{/if}
						</div>
					{/if}
					{#if result.parseErrors && result.parseErrors.length > 0}
						<div class="mt-4">
							<h4 class="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Errores de parsing:</h4>
							<div class="bg-white dark:bg-gray-800 rounded-md p-3 max-h-48 overflow-y-auto">
								<ul class="text-xs text-red-700 dark:text-red-400 space-y-1">
									{#each result.parseErrors.slice(0, 10) as err}
										<li>Fila {err.row}: {err.error}</li>
									{/each}
									{#if result.parseErrors.length > 10}
										<li class="text-gray-500">... y {result.parseErrors.length - 10} más</li>
									{/if}
								</ul>
							</div>
						</div>
					{/if}
					{#if result.success}
						<div class="mt-4 flex gap-2">
							<a href="/banking/reconcile?accountId={selectedAccountId}" class="btn-primary text-sm">
								Ir a Conciliar
							</a>
							<a href="/banking/history?accountId={selectedAccountId}" class="btn-secondary text-sm">
								Ver Historial
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Formato Esperado -->
	<div class="card p-6 bg-blue-50 dark:bg-blue-900/20">
		<h3 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Formato CSV Esperado</h3>
		<div class="grid md:grid-cols-2 gap-4 text-sm">
			<div>
				<h4 class="font-medium text-blue-800 dark:text-blue-400 mb-2">Columnas requeridas:</h4>
				<ul class="space-y-1 text-blue-700 dark:text-blue-500">
					<li>• <strong>Fecha</strong> (YYYY-MM-DD o DD/MM/YYYY)</li>
					<li>• <strong>Descripción</strong> (texto libre)</li>
					<li>• <strong>Monto</strong> (positivo=negro, negativo=rojo)</li>
					<li>• <strong>Referencia</strong> (ID transacción banco)</li>
				</ul>
			</div>
			<div>
				<h4 class="font-medium text-blue-800 dark:text-blue-400 mb-2">Ejemplo:</h4>
				<pre class="bg-white dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">fecha,descripcion,monto,referencia
2024-01-15,PAGO FACTURA 001,-50000,REF123
2024-01-16,DEPOSITO CLIENTE,100000,REF124</pre>
			</div>
		</div>
	</div>
</div>
