# Especificación de UI Components

> Mapeo de 29 Vistas AppSheet → Componentes Svelte 5 + Tailwind v4

---

## 1. Vista: Libro (Deck View)

### AppSheet Configuration
```json
{
  "View name": "Libro",
  "View type": "deck",
  "ActionType": "Round Image",
  "Position": "center",
  "MainDeckImageColumn": "Foto_Comprobante",
  "ImageShape": "Round Image",
  "PrimaryDeckHeaderColumn": "Contacto_Ref",
  "SecondaryDeckHeaderColumn": "Total_Facturado",
  "DeckSummaryColumn": "**auto**",
  "ActionBarEntries": ["Delete","Edit","View Ref (Contacto_Ref)","View Ref (Item_Ref)"],
  "GroupBy": [{"Column":"Fecha","Order":"Descending"}],
  "SortBy": [{"Column":"Fecha","Order":"Descending"}],
  "Icon": "far fa-coins"
}
```

### Svelte 5 Implementation

```svelte
<!-- routes/(modules)/financiero/libro/TransactionCard.svelte -->
<script lang="ts">
  interface Props {
    transaction: {
      id: string;
      fotoComprobante?: string;
      contactoRef: string;
      contacto?: { nombreRazonSocial: string };
      totalFacturado: number;
      tipoMovimiento: 'Ingreso' | 'Gasto';
      estadoPago: 'Pagado' | 'Pendiente' | 'Vencido';
      metodoPago: string;
      fecha: number;
    };
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
  }
  
  let { transaction, onDelete, onEdit }: Props = $props();
  
  // Format rules applied
  let estadoClasses = $derived(
    transaction.estadoPago === 'Pagado' ? 'bg-green-100 text-green-800' :
    transaction.estadoPago === 'Vencido' ? 'bg-red-100 text-red-800' :
    'bg-orange-100 text-orange-800'
  );
  
  let tipoClasses = $derived(
    transaction.tipoMovimiento === 'Ingreso' ? 'text-green-600' : 'text-red-600'
  );
</script>

<div class="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
  <!-- Round Image -->
  <div class="relative w-16 h-16 flex-shrink-0">
    {#if transaction.fotoComprobante}
      <img
        src={transaction.fotoComprobante}
        alt="Comprobante"
        class="w-full h-full object-cover rounded-full"
      />
    {:else}
      <div class="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
        <i class="fas fa-receipt text-gray-400 text-xl"></i>
      </div>
    {/if}
    <!-- Type indicator badge -->
    <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs
      {transaction.tipoMovimiento === 'Ingreso' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">
      {transaction.tipoMovimiento === 'Ingreso' ? '+' : '-'}
    </div>
  </div>
  
  <!-- Content -->
  <div class="flex-1 min-w-0">
    <h3 class="font-semibold text-gray-900 truncate">
      {transaction.contacto?.nombreRazonSocial || transaction.contactoRef}
    </h3>
    <p class="text-sm text-gray-500">
      {new Date(transaction.fecha).toLocaleDateString('es-CR')}
      <span class="mx-1">•</span>
      <span class={estadoClasses}>
        {transaction.estadoPago}
      </span>
    </p>
  </div>
  
  <!-- Amount -->
  <div class="text-right">
    <p class="font-bold {tipoClasses}">
      ₡{(transaction.totalFacturado / 100).toFixed(2)}
    </p>
    <p class="text-xs text-gray-400">
      {transaction.metodoPago}
    </p>
  </div>
  
  <!-- Actions -->
  <div class="flex gap-2">
    <button
      onclick={() => onEdit(transaction.id)}
      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
    >
      <i class="fas fa-edit"></i>
    </button>
    <button
      onclick={() => onDelete(transaction.id)}
      class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
    >
      <i class="fas fa-trash"></i>
    </button>
  </div>
</div>
```

```svelte
<!-- routes/(modules)/financiero/libro/+page.svelte -->
<script lang="ts">
  let { data } = $props();
  
  let transactions = $derived(data.transactions);
  let filters = $state({ tipo: '', estado: '', search: '' });
  
  let filtered = $derived(
    transactions.filter(tx => {
      if (filters.tipo && tx.tipoMovimiento !== filters.tipo) return false;
      if (filters.estado && tx.estadoPago !== filters.estado) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return tx.contacto?.nombreRazonSocial?.toLowerCase().includes(search);
      }
      return true;
    })
  );
  
  // Group by date (descending)
  let grouped = $derived(() => {
    const groups: Record<string, typeof transactions> = {};
    for (const tx of filtered) {
      const date = new Date(tx.fecha).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    }
    return Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">{data.meta.title}</h1>
    <a href="/financiero/transaccion/nuevo" class="btn-primary">
      <i class="fas fa-plus mr-2"></i>
      Nueva Transacción
    </a>
  </div>
  
  <!-- Filters -->
  <div class="flex gap-4 p-4 bg-white rounded-lg shadow-sm">
    <select bind:value={filters.tipo} class="form-select">
      <option value="">Todos los tipos</option>
      <option value="Ingreso">Ingresos</option>
      <option value="Gasto">Gastos</option>
    </select>
    
    <select bind:value={filters.estado} class="form-select">
      <option value="">Todos los estados</option>
      <option value="Pagado">Pagado</option>
      <option value="Pendiente">Pendiente</option>
      <option value="Vencido">Vencido</option>
    </select>
    
    <input
      type="search"
      bind:value={filters.search}
      placeholder="Buscar contacto..."
      class="form-input flex-1"
    />
  </div>
  
  <!-- Grouped List -->
  <div class="space-y-4">
    {#each grouped() as [date, txs]}
      <div>
        <h2 class="text-sm font-medium text-gray-500 mb-2 sticky top-0 bg-gray-50 py-2">
          {new Date(date).toLocaleDateString('es-CR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        <div class="space-y-2">
          {#each txs as tx (tx.id)}
            <TransactionCard
              transaction={tx}
              onDelete={(id) => console.log('delete', id)}
              onEdit={(id) => goto(`/financiero/transaccion/${id}/editar`)}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
```

---

## 2. Vista: Directorio (Card View)

### AppSheet Configuration
```json
{
  "View name": "Directorio",
  "View type": "card",
  "ActionType": "Square Image",
  "Position": "left",
  "Layout": {...card JSON...},
  "Icon": "far fa-address-card"
}
```

### Svelte 5 Implementation

```svelte
<!-- routes/(modules)/financiero/contactos/ContactCard.svelte -->
<script lang="ts">
  interface Props {
    contact: {
      id: string;
      logo?: string;
      nombreRazonSocial: string;
      cedulaRuc?: string;
      tipo: string;
      telefono?: string;
      email?: string;
    };
  }
  
  let { contact }: Props = $props();
  
  let typeBadge = $derived({
    'Cliente': 'bg-blue-100 text-blue-800',
    'Proveedor': 'bg-purple-100 text-purple-800',
    'Ambos': 'bg-green-100 text-green-800'
  }[contact.tipo] || 'bg-gray-100');
</script>

<div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
  <div class="flex p-4 gap-4">
    <!-- Square Logo -->
    <div class="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
      {#if contact.logo}
        <img src={contact.logo} alt={contact.nombreRazonSocial} class="w-full h-full object-cover" />
      {:else}
        <div class="w-full h-full flex items-center justify-center">
          <i class="fas fa-building text-gray-400 text-2xl"></i>
        </div>
      {/if}
    </div>
    
    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-semibold text-gray-900 truncate">{contact.nombreRazonSocial}</h3>
          <p class="text-sm text-gray-500">{contact.cedulaRuc || 'Sin cédula'}</p>
        </div>
        <span class="px-2 py-1 text-xs font-medium rounded-full {typeBadge}">
          {contact.tipo}
        </span>
      </div>
      
      <!-- Contact Actions -->
      <div class="flex gap-2 mt-3">
        {#if contact.telefono}
          <a href="tel:{contact.telefono}" class="btn-icon" title="Llamar">
            <i class="fas fa-phone text-green-600"></i>
          </a>
          <a href="sms:{contact.telefono}" class="btn-icon" title="SMS">
            <i class="fas fa-comment text-blue-600"></i>
          </a>
        {/if}
        {#if contact.email}
          <a href="mailto:{contact.email}" class="btn-icon" title="Email">
            <i class="fas fa-envelope text-purple-600"></i>
          </a>
        {/if}
      </div>
    </div>
  </div>
</div>
```

---

## 3. Vista: Catálogo (Card View)

```svelte
<!-- routes/(modules)/financiero/catalogo/CatalogCard.svelte -->
<script lang="ts">
  interface Props {
    item: {
      id: string;
      categoria: string;
      nombreItem: string;
      codigoCabys?: string;
      tarifaIva: string;
      precioUnitario?: number;
    };
  }
  
  let { item }: Props = $props();
  
  // Format rules from reglas.md
  let categoryConfig = $derived({
    'Productos': { icon: 'box', color: 'text-purple-600', bg: 'bg-purple-50' },
    'Servicios': { icon: 'briefcase', color: 'text-blue-600', bg: 'bg-blue-50' },
    'Gastos fijos': { icon: 'store', color: 'text-gray-600', bg: 'bg-gray-50' }
  }[item.categoria] || { icon: 'tag', color: 'text-gray-600', bg: 'bg-gray-50' });
</script>

<div class="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
  <div class="flex items-center gap-3">
    <!-- Category Icon -->
    <div class="w-12 h-12 rounded-full {categoryConfig.bg} flex items-center justify-center">
      <i class="fas fa-{categoryConfig.icon} {categoryConfig.color} text-lg"></i>
    </div>
    
    <!-- Info -->
    <div class="flex-1 min-w-0">
      <h3 class="font-semibold text-gray-900 truncate">{item.nombreItem}</h3>
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span>{item.codigoCabys || 'Sin CABYS'}</span>
        <span>•</span>
        <span>IVA {item.tarifaIva}</span>
      </div>
    </div>
    
    <!-- Price -->
    {#if item.precioUnitario}
      <div class="text-right">
        <p class="font-bold text-gray-900">
          ₡{(item.precioUnitario / 100).toFixed(2)}
        </p>
      </div>
    {/if}
  </div>
</div>
```

---

## 4. Vista: Formulario (Form View)

### Transaction Form

```svelte
<!-- routes/(modules)/financiero/transaccion/nuevo/+page.svelte -->
<script lang="ts">
  let { data } = $props();
  
  // Form state
  let form = $state({
    fecha: Date.now(),
    tipoMovimiento: 'Ingreso' as 'Ingreso' | 'Gasto',
    contactoRef: '',
    itemRef: '',
    detalleAdicional: '',
    numeroFactura: '',
    claveHacienda: '',
    metodoPago: 'Efectivo' as const,
    estadoPago: 'Pagado' as 'Pagado' | 'Pendiente',
    cantidad: 1,
    precioUnitario: 0,
    tieneDescuento: false,
    porcentajeDescuento: 0,
    porcentajeIva: 13,
    moneda: 'CRC' as 'CRC' | 'USD',
    tipoCambio: 1,
    condicionVenta: 'Contado' as 'Contado' | 'Crédito',
    plazoDias: 0,
    fechaVencimiento: Date.now(),
  });
  
  // Derived calculations (from 04_FORMULAS_CALCULATIONS_SPEC)
  let subtotal = $derived(form.cantidad * form.precioUnitario);
  let montoDescuento = $derived(
    form.tieneDescuento && form.porcentajeDescuento 
      ? Math.round(subtotal * form.porcentajeDescuento / 100) 
      : 0
  );
  let baseIva = $derived(subtotal - montoDescuento);
  let montoIva = $derived(Math.round(baseIva * form.porcentajeIva / 100));
  let totalFacturado = $derived(baseIva + montoIva);
  
  // Auto-calculate due date
  $effect(() => {
    if (form.condicionVenta === 'Crédito' && form.plazoDias > 0) {
      form.fechaVencimiento = form.fecha + (form.plazoDias * 24 * 60 * 60 * 1000);
    } else {
      form.fechaVencimiento = form.fecha;
    }
  });
  
  // Show conditions
  let showTipoCambio = $derived(form.moneda !== 'CRC');
  let showDescuento = $derived(form.tieneDescuento);
  let showCredito = $derived(form.condicionVenta === 'Crédito');
</script>

<form method="POST" action="?/create" class="max-w-2xl mx-auto space-y-8">
  <!-- Section: General -->
  <section class="bg-white rounded-xl shadow-sm p-6">
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <i class="fas fa-info-circle text-blue-500"></i>
      Información General
    </h2>
    
    <div class="grid grid-cols-2 gap-4">
      <!-- Date -->
      <div class="col-span-2">
        <label class="block text-sm font-medium mb-1">Fecha</label>
        <input type="date" bind:value={form.fecha} class="form-input" required />
      </div>
      
      <!-- Type -->
      <div>
        <label class="block text-sm font-medium mb-1">Tipo de Movimiento</label>
        <select bind:value={form.tipoMovimiento} class="form-select" required>
          <option value="Ingreso">Ingreso</option>
          <option value="Gasto">Gasto</option>
        </select>
      </div>
      
      <!-- Contact -->
      <div>
        <label class="block text-sm font-medium mb-1">Contacto</label>
        <ContactPicker bind:value={form.contactoRef} required />
      </div>
      
      <!-- Item -->
      <div>
        <label class="block text-sm font-medium mb-1">Ítem</label>
        <CatalogPicker bind:value={form.itemRef} required />
      </div>
      
      <!-- Detail -->
      <div class="col-span-2">
        <label class="block text-sm font-medium mb-1">Detalle Adicional</label>
        <textarea bind:value={form.detalleAdicional} class="form-textarea" rows="2"></textarea>
      </div>
    </div>
  </section>
  
  <!-- Section: Document Reference -->
  <section class="bg-white rounded-xl shadow-sm p-6">
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <i class="fas fa-file-invoice text-purple-500"></i>
      Referencia Documental
    </h2>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1">Número de Factura</label>
        <input type="text" bind:value={form.numeroFactura} class="form-input" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Clave Hacienda</label>
        <input 
          type="text" 
          bind:value={form.claveHacienda} 
          maxlength="50"
          class="form-input font-mono text-sm" 
        />
      </div>
    </div>
  </section>
  
  <!-- Section: Financial -->
  <section class="bg-white rounded-xl shadow-sm p-6">
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <i class="fas fa-coins text-yellow-500"></i>
      Detalle Financiero
    </h2>
    
    <div class="grid grid-cols-3 gap-4 mb-4">
      <!-- Quantity -->
      <div>
        <label class="block text-sm font-medium mb-1">Cantidad</label>
        <input type="number" bind:value={form.cantidad} min="1" class="form-input" required />
      </div>
      
      <!-- Unit Price -->
      <div>
        <label class="block text-sm font-medium mb-1">Precio Unitario</label>
        <CurrencyInput bind:value={form.precioUnitario} required />
      </div>
      
      <!-- Discount Toggle -->
      <div class="flex items-center pt-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" bind:checked={form.tieneDescuento} class="form-checkbox" />
          <span class="text-sm font-medium">Tiene Descuento</span>
        </label>
      </div>
    </div>
    
    <!-- Discount % (conditional) -->
    {#if showDescuento}
      <div class="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium mb-1">% Descuento</label>
          <input type="number" bind:value={form.porcentajeDescuento} min="0" max="100" class="form-input" />
        </div>
        <div class="flex items-end">
          <p class="text-sm text-gray-600">
            Monto: <span class="font-medium">₡{(montoDescuento / 100).toFixed(2)}</span>
          </p>
        </div>
      </div>
    {/if}
    
    <div class="grid grid-cols-3 gap-4">
      <!-- Currency -->
      <div>
        <label class="block text-sm font-medium mb-1">Moneda</label>
        <select bind:value={form.moneda} class="form-select" required>
          <option value="CRC">CRC (₡)</option>
          <option value="USD">USD ($)</option>
        </select>
      </div>
      
      <!-- Exchange Rate (conditional) -->
      {#if showTipoCambio}
        <div>
          <label class="block text-sm font-medium mb-1">Tipo de Cambio</label>
          <input type="number" bind:value={form.tipoCambio} step="0.01" class="form-input" required />
        </div>
      {/if}
      
      <!-- IVA -->
      <div>
        <label class="block text-sm font-medium mb-1">% IVA</label>
        <select bind:value={form.porcentajeIva} class="form-select" required>
          <option value={0}>Exento</option>
          <option value={4}>4%</option>
          <option value={8}>8%</option>
          <option value={13}>13%</option>
        </select>
      </div>
    </div>
    
    <!-- Summary -->
    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
      <div class="flex justify-between text-sm mb-1">
        <span class="text-gray-600">Subtotal:</span>
        <span class="font-medium">₡{(subtotal / 100).toFixed(2)}</span>
      </div>
      {#if montoDescuento > 0}
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-600">Descuento:</span>
          <span class="font-medium text-red-600">-₡{(montoDescuento / 100).toFixed(2)}</span>
        </div>
      {/if}
      <div class="flex justify-between text-sm mb-1">
        <span class="text-gray-600">IVA ({form.porcentajeIva}%):</span>
        <span class="font-medium">₡{(montoIva / 100).toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-lg font-bold pt-2 border-t border-blue-200">
        <span>Total:</span>
        <span class="text-blue-700">₡{(totalFacturado / 100).toFixed(2)}</span>
      </div>
    </div>
  </section>
  
  <!-- Section: Payment Terms -->
  <section class="bg-white rounded-xl shadow-sm p-6">
    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <i class="fas fa-handshake text-green-500"></i>
      Condiciones de Pago
    </h2>
    
    <div class="grid grid-cols-2 gap-4">
      <!-- Condition -->
      <div>
        <label class="block text-sm font-medium mb-1">Condición</label>
        <select bind:value={form.condicionVenta} class="form-select" required>
          <option value="Contado">Contado</option>
          <option value="Crédito">Crédito</option>
        </select>
      </div>
      
      <!-- Payment Method -->
      <div>
        <label class="block text-sm font-medium mb-1">Método de Pago</label>
        <select bind:value={form.metodoPago} class="form-select" required>
          <option value="Efectivo">💵 Efectivo</option>
          <option value="Sinpe">📱 Sinpe</option>
          <option value="Tarjeta">💳 Tarjeta</option>
          <option value="Transferencia">🏦 Transferencia</option>
        </select>
      </div>
      
      <!-- Payment Status -->
      <div>
        <label class="block text-sm font-medium mb-1">Estado de Pago</label>
        <select bind:value={form.estadoPago} class="form-select" required>
          <option value="Pagado">✅ Pagado</option>
          <option value="Pendiente">⏳ Pendiente</option>
        </select>
      </div>
      
      {#if showCredito}
        <!-- Credit Terms -->
        <div>
          <label class="block text-sm font-medium mb-1">Plazo (días)</label>
          <input type="number" bind:value={form.plazoDias} min="1" class="form-input" required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Fecha Vencimiento</label>
          <input type="date" bind:value={form.fechaVencimiento} class="form-input" required />
        </div>
      {/if}
    </div>
  </section>
  
  <!-- Actions -->
  <div class="flex gap-4">
    <button type="submit" class="btn-primary flex-1">
      <i class="fas fa-save mr-2"></i>
      Guardar Transacción
    </button>
    <a href="/financiero/libro" class="btn-secondary">
      Cancelar
    </a>
  </div>
</form>
```

---

## 5. Vista: Gráficos (Chart Views)

```svelte
<!-- routes/(modules)/financiero/reportes/balance/+page.svelte -->
<script lang="ts">
  let { data } = $props();
  
  let chartData = $derived({
    labels: data.balanceData.labels,
    datasets: [
      {
        label: 'Ingresos',
        data: data.balanceData.ingresos.map(v => v / 100),
        backgroundColor: '#4CAF50'
      },
      {
        label: 'Gastos',
        data: data.balanceData.gastos.map(v => v / 100),
        backgroundColor: '#F44336'
      }
    ]
  });
</script>

<div class="p-6">
  <h1 class="text-2xl font-bold mb-6">Balance Financiero</h1>
  
  <div class="bg-white rounded-xl shadow-sm p-6">
    <Chart type="bar" data={chartData} options={{
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }} />
  </div>
  
  <!-- Summary Cards -->
  <div class="grid grid-cols-3 gap-4 mt-6">
    <div class="bg-green-50 rounded-xl p-4">
      <p class="text-sm text-green-600">Total Ingresos</p>
      <p class="text-2xl font-bold text-green-700">
        ₡{(data.totales.totalIngresos / 100).toFixed(2)}
      </p>
    </div>
    <div class="bg-red-50 rounded-xl p-4">
      <p class="text-sm text-red-600">Total Gastos</p>
      <p class="text-2xl font-bold text-red-700">
        ₡{(data.totales.totalGastos / 100).toFixed(2)}
      </p>
    </div>
    <div class="bg-blue-50 rounded-xl p-4">
      <p class="text-sm text-blue-600">Balance</p>
      <p class="text-2xl font-bold text-blue-700">
        ₡{(data.totales.balance / 100).toFixed(2)}
      </p>
    </div>
  </div>
</div>
```
