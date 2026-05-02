<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { BillingConfig, BillingProviderType } from '$lib/server/services/billing/types';

  export let data: PageData;

  let selectedProvider: BillingProviderType = 'kairux_native';
  let showAdvanced = false;

  // Campos específicos por proveedor
  const providerFields: Record<string, string[]> = {
    kairux_native: ['certificatePath', 'privateKey'],
    generic_api: ['baseUrl', 'apiKey', 'apiSecret', 'timeout'],
    nubox: ['baseUrl', 'apiKey', 'environment'],
  };

  function handleProviderChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedProvider = target.value as BillingProviderType;
  }
</script>

<svelte:head>
  <title>Configuración Fiscal | ContaPOS</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <!-- Encabezado -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Configuración de Facturación Electrónica</h1>
    <p class="mt-2 text-gray-600">
      Configura tu proveedor de facturación electrónica para Costa Rica
    </p>
  </div>

  <!-- Estado Actual -->
  {#if data.isConfigured}
    <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p class="font-semibold text-green-800">Sistema de facturación activo</p>
          <p class="text-sm text-green-700">Proveedor configurado: {data.providerName}</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="font-semibold text-yellow-800">Facturación no configurada</p>
          <p class="text-sm text-yellow-700">Selecciona un proveedor para comenzar</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Formulario de Configuración -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <form method="POST" action="?/save" use:enhance class="space-y-6">
      
      <!-- Selector de Proveedor -->
      <div>
        <label for="providerType" class="block text-sm font-medium text-gray-700 mb-2">
          Proveedor de Facturación
        </label>
        <select
          id="providerType"
          name="providerType"
          value={selectedProvider}
          onchange={handleProviderChange}
          class="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {#each data.providers as provider}
            <option value={provider.id}>{provider.name}</option>
          {/each}
        </select>
        <p class="mt-2 text-sm text-gray-600">
          {#each data.providers as provider}
            {#if provider.id === selectedProvider}
              {provider.description}
            {/if}
          {/each}
        </p>
      </div>

      <!-- Toggle Habilitar/Deshabilitar -->
      <div class="flex items-center justify-between py-3 border-t border-b">
        <div>
          <label class="text-sm font-medium text-gray-700">Habilitar facturación</label>
          <p class="text-xs text-gray-500">Activa o desactiva el envío de comprobantes</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" name="enabled" checked class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <!-- Modo Test -->
      <div class="flex items-center justify-between py-3 border-b">
        <div>
          <label class="text-sm font-medium text-gray-700">Modo de prueba</label>
          <p class="text-xs text-gray-500">Las facturas no se envían a Hacienda real</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" name="testMode" checked class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <!-- Campos específicos por proveedor -->
      {#if selectedProvider === 'kairux_native'}
        <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-800">Configuración Kairux Native</h3>
          
          <div>
            <label for="certificatePath" class="block text-sm font-medium text-gray-700">
              Ruta del Certificado Digital (.p12/.pfx)
            </label>
            <input
              type="text"
              id="certificatePath"
              name="certificatePath"
              placeholder="/certificados/certificado.p12"
              class="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">Opcional en modo test</p>
          </div>

          <div>
            <label for="privateKey" class="block text-sm font-medium text-gray-700">
              Clave Privada (opcional)
            </label>
            <textarea
              id="privateKey"
              name="privateKey"
              rows="3"
              placeholder="-----BEGIN PRIVATE KEY-----..."
              class="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>
      {/if}

      {#if selectedProvider === 'generic_api' || selectedProvider === 'nubox'}
        <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-800">
            {selectedProvider === 'nubox' ? 'Configuración Nubox' : 'Configuración API Genérica'}
          </h3>

          <div>
            <label for="baseUrl" class="block text-sm font-medium text-gray-700">
              URL Base de la API *
            </label>
            <input
              type="url"
              id="baseUrl"
              name="baseUrl"
              placeholder="https://api.proveedor.com/v1"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="apiKey" class="block text-sm font-medium text-gray-700">
              API Key *
            </label>
            <input
              type="password"
              id="apiKey"
              name="apiKey"
              placeholder="tu-api-key-secreta"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="apiSecret" class="block text-sm font-medium text-gray-700">
              API Secret (opcional)
            </label>
            <input
              type="password"
              id="apiSecret"
              name="apiSecret"
              placeholder="tu-api-secret"
              class="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {#if selectedProvider === 'nubox'}
            <div>
              <label for="environment" class="block text-sm font-medium text-gray-700">
                Ambiente
              </label>
              <select
                id="environment"
                name="environment"
                class="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sandbox">Sandbox (Pruebas)</option>
                <option value="production">Producción</option>
              </select>
            </div>
          {/if}

          <div>
            <label for="timeout" class="block text-sm font-medium text-gray-700">
              Timeout (ms)
            </label>
            <input
              type="number"
              id="timeout"
              name="timeout"
              value="30000"
              min="5000"
              max="60000"
              class="mt-1 w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">Tiempo máximo de espera para respuestas</p>
          </div>
        </div>
      {/if}

      <!-- Botones de Acción -->
      <div class="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Guardar Configuración
        </button>
        
        <button
          type="submit"
          formaction="?/testConnection"
          class="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          Probar Conexión
        </button>
      </div>
    </form>

    <!-- Botón Eliminar Configuración -->
    {#if data.isConfigured}
      <div class="mt-6 pt-6 border-t">
        <form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm('¿Estás seguro de eliminar esta configuración? Esta acción no se puede deshacer.')) { e.preventDefault(); } }}>
          <button
            type="submit"
            class="w-full bg-red-50 text-red-700 px-6 py-3 rounded-md hover:bg-red-100 transition-colors font-medium border border-red-200"
          >
            Eliminar Configuración
          </button>
        </form>
      </div>
    {/if}
  </div>

  <!-- Información Adicional -->
  <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
    <h3 class="font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h3>
    <ul class="space-y-2 text-sm text-blue-800">
      <li class="flex items-start">
        <span class="mr-2">•</span>
        <span>En modo test, las facturas se generan pero no se envían a Hacienda.</span>
      </li>
      <li class="flex items-start">
        <span class="mr-2">•</span>
        <span>Para producción, necesitarás un certificado digital válido emitido por una entidad certificadora autorizada en Costa Rica.</span>
      </li>
      <li class="flex items-start">
        <span class="mr-2">•</span>
        <span>El código CABYS es obligatorio para todos los productos y servicios.</span>
      </li>
      <li class="flex items-start">
        <span class="mr-2">•</span>
        <span>Puedes cambiar de proveedor en cualquier momento sin perder el historial de ventas.</span>
      </li>
    </ul>
  </div>

  <!-- Enlaces Útiles -->
  <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
    <a href="/reports/tax" class="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <h4 class="font-semibold text-gray-800">📊 Reportes Fiscales</h4>
      <p class="text-sm text-gray-600 mt-1">Consulta impuestos por periodo y exporta reportes NIIF</p>
    </a>
    <a href="/pos" class="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <h4 class="font-semibold text-gray-800">🛒 Punto de Venta</h4>
      <p class="text-sm text-gray-600 mt-1">Realiza ventas con facturación electrónica automática</p>
    </a>
  </div>
</div>
