<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button, Card, Input, Select, Badge } from '$lib/components/ui';

  // Datos mock para pruebas (se reemplazarán con Oslo/Arctic después)
  const industries = [
    { value: 'retail', label: 'Pulpería / Supermercado' },
    { value: 'restaurant', label: 'Restaurante / Bar / Soda' },
    { value: 'services', label: 'Servicios Profesionales' },
    { value: 'utility', label: 'ASADA / Servicios Públicos' }
  ];

  const rolesByIndustry: Record<string, Array<{ value: string; label: string }>> = {
    retail: [
      { value: 'owner', label: 'Dueño' },
      { value: 'admin', label: 'Administrador' },
      { value: 'cashier', label: 'Cajero' },
      { value: 'accountant', label: 'Contador' }
    ],
    restaurant: [
      { value: 'owner', label: 'Dueño' },
      { value: 'admin', label: 'Administrador' },
      { value: 'cashier', label: 'Cajero' },
      { value: 'waiter', label: 'Mesero' },
      { value: 'accountant', label: 'Contador' }
    ],
    services: [
      { value: 'owner', label: 'Dueño' },
      { value: 'admin', label: 'Administrador' },
      { value: 'cashier', label: 'Secretario' },
      { value: 'accountant', label: 'Contador' }
    ],
    utility: [
      { value: 'owner', label: 'Presidente' },
      { value: 'admin', label: 'Administrador' },
      { value: 'cashier', label: 'Cajero' },
      { value: 'reader', label: 'Lector de Medidores' },
      { value: 'accountant', label: 'Contador' }
    ]
  };

  let selectedIndustry = 'retail';
  let selectedRole = 'owner';
  let email = '';
  let isLoading = false;

  $: availableRoles = rolesByIndustry[selectedIndustry] || [];
  $: if (!availableRoles.find(r => r.value === selectedRole)) {
    selectedRole = availableRoles[0]?.value || '';
  }

  async function handleLogin() {
    isLoading = true;
    
    // Simulación de login - en producción esto irá a Oslo Auth
    const mockSession = {
      user: {
        id: 'mock-user-id',
        email: email || 'user@kairux.cr',
        role: selectedRole,
        organization: {
          id: 'mock-org-id',
          name: 'Empresa Demo',
          industryType: selectedIndustry
        }
      }
    };

    // Guardar sesión mock en localStorage (solo para desarrollo)
    localStorage.setItem('mock_session', JSON.stringify(mockSession));
    
    // Redirigir al dashboard
    await goto('/');
    
    isLoading = false;
  }

  onMount(() => {
    // Verificar si ya hay sesión mock
    const existingSession = localStorage.getItem('mock_session');
    if (existingSession) {
      goto('/');
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
  <Card class="w-full max-w-md backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-2xl">
    <div class="p-8 space-y-6">
      <!-- Header -->
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          ContaPOS
        </h1>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Sistema Multi-Industria Inteligente
        </p>
      </div>

      <!-- Formulario Mock -->
      <form on:submit|preventDefault={handleLogin} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Industria
          </label>
          <Select 
            bind:value={selectedIndustry}
            options={industries}
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rol a Simular
          </label>
          <Select 
            bind:value={selectedRole}
            options={availableRoles}
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email (opcional)
          </label>
          <Input 
            type="email"
            bind:value={email}
            placeholder="tu@email.com"
            class="w-full"
          />
        </div>

        <Button 
          type="submit" 
          variant="primary"
          class="w-full py-3 text-lg"
          disabled={isLoading}
        >
          {isLoading ? 'Entrando...' : 'Iniciar Sesión'}
        </Button>
      </form>

      <!-- Info -->
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <p class="text-xs text-blue-700 dark:text-blue-300 text-center">
          🔒 <strong>Modo Desarrollo:</strong> Este login simulado permite probar roles e industrias.
          <br/>En producción se usará Oslo Auth + Arctic (Google/Passkeys).
        </p>
      </div>

      <!-- Roles Info -->
      <div class="mt-4 space-y-2">
        <p class="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
          Permisos por rol en {industries.find(i => i.value === selectedIndustry)?.label}:
        </p>
        <div class="flex flex-wrap gap-1 justify-center">
          {#each availableRoles as role}
            <Badge variant={role.value === selectedRole ? 'primary' : 'secondary'} size="sm">
              {role.label}
            </Badge>
          {/each}
        </div>
      </div>
    </div>
  </Card>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
