<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	
	let { data, form } = $props();
	
	type Contact = typeof data.contacts[0];
	
	let showModal = $state(false);
	let selectedContact = $state<Contact | null>(null);
	let filterType = $state('both');
	let searchQuery = $state('');
	
	function openModal(contact?: Contact) {
		selectedContact = contact || null;
		showModal = true;
	}
	
	function closeModal() {
		showModal = false;
		selectedContact = null;
	}
	
	const filteredContacts = $derived(
		data.contacts.filter(c => {
			const matchesType = filterType === 'both' || c.contactType === filterType;
			const matchesSearch = !searchQuery || 
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(c.documentNumber || '').includes(searchQuery) ||
				(c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
			return matchesType && matchesSearch;
		})
	);
	
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
	};
	
	const getDocumentLabel = (type: string) => {
		const labels: Record<string, string> = {
			cedula_fisica: 'Cédula Física',
			cedula_juridica: 'Cédula Jurídica',
			dimex: 'DIMEX',
			nite: 'NITE',
			pasaporte: 'Pasaporte'
		};
		return labels[type] || type;
	};
</script>

<svelte:head>
	<title>Contactos - ContaPOS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
	<!-- Header -->
	<header class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">👥 Gestión de Contactos</h1>
		<p class="text-gray-600">Administra clientes y proveedores en un solo lugar</p>
	</header>
	
	<!-- Filtros y Acciones -->
	<div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
		<div class="flex flex-wrap gap-3">
			<input 
				type="text" 
				bind:value={searchQuery}
				placeholder="🔍 Buscar por nombre, documento..."
				class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 min-w-[250px]"
			/>
			
			<select 
				bind:value={filterType}
				class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
			>
				<option value="both">Todos</option>
				<option value="customer">Clientes</option>
				<option value="supplier">Proveedores</option>
			</select>
		</div>
		
		<button 
			onclick={() => openModal()}
			class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
		>
			<span>➕</span> Nuevo Contacto
		</button>
	</div>
	
	<!-- Tabla de Contactos -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50 border-b border-gray-200">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
					<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Crédito</th>
					<th class="px-6 py-3 text-right"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#if filteredContacts.length === 0}
					<tr>
						<td colspan="7" class="px-6 py-12 text-center text-gray-500">
							No hay contactos registrados
						</td>
					</tr>
				{:else}
					{#each filteredContacts as contact}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4">
								<div>
									<p class="font-medium text-gray-900">{contact.name}</p>
									{#if contact.tradeName}
										<p class="text-sm text-gray-500">{contact.tradeName}</p>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded-full {
									contact.contactType === 'customer' ? 'bg-green-100 text-green-800' :
									contact.contactType === 'supplier' ? 'bg-purple-100 text-purple-800' :
									'bg-blue-100 text-blue-800'
								}">
									{contact.contactType === 'customer' && '🛒 Cliente'}
									{contact.contactType === 'supplier' && '📦 Proveedor'}
									{contact.contactType === 'both' && '🔄 Ambos'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if contact.documentNumber}
									<div>
										<p class="text-sm text-gray-900 font-mono">{contact.documentNumber}</p>
										<p class="text-xs text-gray-500">{getDocumentLabel(contact.documentType || '')}</p>
									</div>
								{:else}
									<span class="text-gray-400">-</span>
								{/if}
							</td>
							<td class="px-6 py-4">
								<div class="text-sm">
									{#if contact.email}
										<p class="text-gray-600">✉️ {contact.email}</p>
									{/if}
									{#if contact.phone}
										<p class="text-gray-600">📞 {contact.phone}</p>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4">
								{#if contact.province}
									<p class="text-sm text-gray-600">
										{contact.province}, {contact.canton}, {contact.district}
									</p>
								{:else}
									<span class="text-gray-400">-</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-right">
								{#if contact.creditLimit > 0}
									<div>
										<p class="text-sm font-medium text-gray-900">{formatCurrency(contact.creditLimit)}</p>
										<p class="text-xs text-gray-500">{contact.creditDays} días</p>
									</div>
								{:else}
									<span class="text-gray-400">-</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-right">
								<div class="flex justify-end gap-2">
									<button 
										onclick={() => openModal(contact)}
										class="text-blue-600 hover:text-blue-800 transition-colors"
									>
										✏️
									</button>
									<form method="POST" use:enhance>
										<input type="hidden" name="id" value={contact.id} />
										<button 
											type="submit" 
											name="action" 
											value="delete"
											class="text-red-600 hover:text-red-800 transition-colors"
											onclick={() => confirm('¿Eliminar este contacto?')}
										>
											🗑️
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Modal Nuevo/Editar Contacto -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={closeModal}>
		<div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
			<div class="p-6 border-b border-gray-200 sticky top-0 bg-white">
				<h2 class="text-xl font-bold text-gray-900">
					{selectedContact ? 'Editar Contacto' : 'Nuevo Contacto'}
				</h2>
			</div>
			
			<form method="POST" use:enhance class="p-6 space-y-6">
				<input type="hidden" name="id" value={selectedContact?.id || ''} />
				
				<!-- Información Básica -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social *</label>
						<input 
							type="text" 
							name="name" 
							required
							value={selectedContact?.name || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="Nombre completo o razón social"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
						<input 
							type="text" 
							name="tradeName" 
							value={selectedContact?.tradeName || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="Nombre comercial (opcional)"
						/>
					</div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Contacto *</label>
						<select 
							name="contactType" 
							required
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
						>
							<option value="customer">🛒 Cliente</option>
							<option value="supplier">📦 Proveedor</option>
							<option value="both">🔄 Ambos</option>
						</select>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
						<select 
							name="documentType" 
							value={selectedContact?.documentType || 'cedula_fisica'}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
						>
							<option value="cedula_fisica">Cédula Física</option>
							<option value="cedula_juridica">Cédula Jurídica</option>
							<option value="dimex">DIMEX</option>
							<option value="nite">NITE</option>
							<option value="pasaporte">Pasaporte</option>
						</select>
					</div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Número de Documento</label>
						<input 
							type="text" 
							name="documentNumber" 
							value={selectedContact?.documentNumber || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="Sin guiones ni espacios"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
						<input 
							type="email" 
							name="email" 
							value={selectedContact?.email || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="correo@ejemplo.com"
						/>
					</div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
						<input 
							type="tel" 
							name="phone" 
							value={selectedContact?.phone || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="8888-8888"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Celular</label>
						<input 
							type="tel" 
							name="mobile" 
							value={selectedContact?.mobile || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="8888-8888"
						/>
					</div>
				</div>
				
				<!-- Dirección -->
				<div class="border-t border-gray-200 pt-4">
					<h3 class="text-sm font-semibold text-gray-900 mb-3">📍 Ubicación</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
							<input 
								type="text" 
								name="province" 
								value={selectedContact?.province || ''}
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
								placeholder="San José"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Cantón</label>
							<input 
								type="text" 
								name="canton" 
								value={selectedContact?.canton || ''}
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
								placeholder="Central"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
							<input 
								type="text" 
								name="district" 
								value={selectedContact?.district || ''}
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
								placeholder="Carmen"
							/>
						</div>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta</label>
						<textarea 
							name="address" 
							rows="2"
							value={selectedContact?.address || ''}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
							placeholder="De la iglesia 100m al sur, casa #45"
						></textarea>
					</div>
				</div>
				
				<!-- Crédito -->
				<div class="border-t border-gray-200 pt-4">
					<h3 class="text-sm font-semibold text-gray-900 mb-3">💳 Línea de Crédito</h3>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Límite de Crédito (₡)</label>
							<input 
								type="number" 
								name="creditLimit" 
								step="0.01" 
								min="0"
								value={selectedContact?.creditLimit || 0}
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
								placeholder="0.00"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Plazo (días)</label>
							<input 
								type="number" 
								name="creditDays" 
								min="0"
								value={selectedContact?.creditDays || 0}
								class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
								placeholder="30"
							/>
						</div>
					</div>
				</div>
				
				<!-- Botones -->
				<div class="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
					<button 
						type="button" 
						onclick={closeModal}
						class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
					<button 
						type="submit" 
						name="action" 
						value={selectedContact ? 'update' : 'create'}
						class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						{selectedContact ? 'Actualizar' : 'Guardar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
