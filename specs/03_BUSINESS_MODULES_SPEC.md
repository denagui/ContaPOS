# Especificación de Módulos de Negocio

> Estructura de rutas y organización de la aplicación Contabilidad

---

## 1. Estructura de Directorios

```
routes/(modules)/
├── (app)/                          # Layout principal
│   ├── +layout.server.ts           # Auth guards + context
│   ├── +layout.svelte              # App shell (sidebar, nav)
│   └── +page.svelte                # Dashboard/Bienvenida
│
├── financiero/
│   ├── +layout.server.ts           # Guard: modulo financiero
│   ├── +page.svelte                # Index → redirect to /libro
│   │
│   ├── libro/
│   │   ├── +page.server.ts         # HF01.list
│   │   ├── +page.svelte            # Vista "Libro" (deck)
│   │   ├── TransaccionCard.svelte  # Componente de card
│   │   └── Filtros.svelte
│   │
│   ├── transaccion/
│   │   ├── [id]/
│   │   │   ├── +page.server.ts     # HF01.get
│   │   │   ├── +page.svelte        # Detail view
│   │   │   ├── +page.server.ts     # HF01.delete
│   │   │   └── +page.svelte        # Form view
│   │   │
│   │   └── nuevo/
│   │       ├── +page.server.ts     # HF01.create
│   │       └── +page.svelte        # Form view
│   │
│   ├── cuentas-por-cobrar/
│   │   ├── +page.server.ts         # HF01.listCuentasPorCobrar
│   │   └── +page.svelte            # Vista filtrada
│   │
│   ├── cuentas-por-pagar/
│   │   ├── +page.server.ts         # HF01.listCuentasPorPagar
│   │   └── +page.svelte            # Vista filtrada
│   │
│   ├── catalogo/
│   │   ├── +page.server.ts         # HF02.list
│   │   ├── +page.svelte            # Vista "Catalogo" (card)
│   │   ├── [id]/
│   │   │   ├── +page.server.ts     # HF02.get
│   │   │   └── +page.svelte        # Detail
│   │   └── nuevo/
│   │       ├── +page.server.ts     # HF02.create
│   │       └── +page.svelte
│   │
│   ├── contactos/
│   │   ├── +page.server.ts         # HF03.list
│   │   ├── +page.svelte            # Vista "Directorio" (card)
│   │   ├── [id]/
│   │   │   ├── +page.server.ts     # HF03.get
│   │   │   └── +page.svelte        # Detail
│   │   └── nuevo/
│   │       ├── +page.server.ts     # HF03.create
│   │       └── +page.svelte
│   │
│   ├── abonos/
│   │   └── transaccion/
│   │       └── [txId]/
│   │           ├── +page.server.ts # HF04.list + HF04.create
│   │           └── +page.svelte      # Lista inline + form
│   │
│   └── reportes/
│       ├── +page.server.ts         # HF05.*
│       ├── +page.svelte            # Dashboard charts
│       ├── balance/
│       │   ├── +page.server.ts     # HF05.getBalanceData
│       │   └── +page.svelte        # Chart view
│       ├── cuentas-por-cobrar/
│       │   └── +page.svelte        # HF05.getCuentasPorCobrarData
│       ├── cuentas-por-pagar/
│       │   └── +page.svelte
│       └── ventas-por-cliente/
│           └── +page.svelte        # HF05.getVentasPorCliente
│
└── api/                           # API endpoints
    └── v1/
        └── kairux/
            └── +server.ts         # RPC endpoint for executeKairuxCommand
```

---

## 2. Layout Guards

### Root Layout (app shell)

```typescript
// routes/(modules)/(app)/+layout.server.ts

import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, route }) => {
  // R1: Authentication check
  const { session, safeDb } = locals;
  
  if (!session?.user) {
    throw redirect(302, '/login');
  }
  
  // R2: Ensure safeDb is available
  if (!safeDb) {
    throw error(500, 'Database context unavailable');
  }
  
  // R3: Load user settings / company context
  const companyId = session.user.companyId ?? null;
  
  return {
    user: session.user,
    companyId,
    meta: {
      appName: 'Contabilidad',
      version: '1.0.0'
    }
  };
}) satisfies LayoutServerLoad;
```

### Financiero Module Guard

```typescript
// routes/(modules)/financiero/+layout.server.ts

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, parent }) => {
  const { user } = await parent();
  
  // Check permissions for financial module
  const hasAccess = user.roles?.includes('financiero') || user.roles?.includes('admin');
  
  if (!hasAccess) {
    throw error(403, 'Acceso denegado al módulo financiero');
  }
  
  return {
    module: 'financiero',
    navigation: [
      { label: 'Libro', href: '/financiero/libro', icon: 'book' },
      { label: 'Cuentas por Cobrar', href: '/financiero/cuentas-por-cobrar', icon: 'receipt' },
      { label: 'Cuentas por Pagar', href: '/financiero/cuentas-por-pagar', icon: 'credit-card' },
      { label: 'Catálogo', href: '/financiero/catalogo', icon: 'list' },
      { label: 'Contactos', href: '/financiero/contactos', icon: 'users' },
      { label: 'Reportes', href: '/financiero/reportes', icon: 'chart' },
    ]
  };
}) satisfies LayoutServerLoad;
```

---

## 3. Server Loaders (Examples)

### Libro View (Deck)

```typescript
// routes/(modules)/financiero/libro/+page.server.ts

import { executeKairuxCommand } from '$lib/server/kairux/command-registry';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, url, depends }) => {
  depends('app:transacciones');
  
  const { safeDb, session, platform } = locals;
  
  // Parse query params for filtering
  const tipo = url.searchParams.get('tipo') as 'Ingreso' | 'Gasto' | null;
  const estado = url.searchParams.get('estado') as 'Pagado' | 'Pendiente' | 'Vencido' | null;
  const search = url.searchParams.get('search');
  
  const transactions = await executeKairuxCommand('HF01.list', {
    limit: 100,
    tipoMovimiento: tipo || undefined,
    estadoPago: estado || undefined,
    // search is handled client-side for now
  }, { safeDb, session, platform });
  
  // Get totals for summary
  const totales = await executeKairuxCommand('HF01.calcularTotales', {
    fechaDesde: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days
    fechaHasta: Date.now()
  }, { safeDb, session, platform });
  
  return {
    transactions: transactions ?? [],
    totales,
    filters: { tipo, estado, search },
    meta: {
      title: 'Libro Contable',
      description: 'Registro de transacciones'
    }
  };
}) satisfies PageServerLoad;
```

### Transaction Detail

```typescript
// routes/(modules)/financiero/transaccion/[id]/+page.server.ts

import { executeKairuxCommand } from '$lib/server/kairux/command-registry';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params, platform }) => {
  const { safeDb, session } = locals;
  const { id } = params;
  
  const transaction = await executeKairuxCommand('HF01.get', {
    id
  }, { safeDb, session, platform });
  
  if (!transaction) {
    throw error(404, 'Transacción no encontrada');
  }
  
  // Load related payments
  const abonos = await executeKairuxCommand('HF04.list', {
    transaccionRef: id
  }, { safeDb, session, platform });
  
  return {
    transaction,
    abonos: abonos ?? [],
    meta: {
      title: `Transacción ${id}`,
      description: transaction.detalleAdicional || ''
    }
  };
}) satisfies PageServerLoad;
```

### Cuentas por Cobrar

```typescript
// routes/(modules)/financiero/cuentas-por-cobrar/+page.server.ts

import { executeKairuxCommand } from '$lib/server/kairux/command-registry';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, platform }) => {
  const { safeDb, session } = locals;
  
  const [transactions, reporte] = await Promise.all([
    executeKairuxCommand('HF01.listCuentasPorCobrar', {
      limit: 100
    }, { safeDb, session, platform }),
    executeKairuxCommand('HF05.getCuentasPorCobrarData', {}, { safeDb, session, platform })
  ]);
  
  return {
    transactions: transactions ?? [],
    reporte,
    meta: {
      title: 'Cuentas por Cobrar',
      description: `${reporte.total} pendientes`
    }
  };
}) satisfies PageServerLoad;
```

---

## 4. API RPC Endpoint

```typescript
// routes/api/v1/kairux/+server.ts

import { executeKairuxCommand } from '$lib/server/kairux/command-registry';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { KnownCommandName } from '$lib/server/kairux/command-registry';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { safeDb, session, platform } = locals;
  
  if (!session?.user) {
    throw error(401, 'Unauthorized');
  }
  
  try {
    const { action, payload } = await request.json();
    
    // Type-safe command execution
    const result = await executeKairuxCommand(
      action as KnownCommandName,
      payload ?? {},
      { safeDb, session, platform }
    );
    
    return json({ success: true, data: result });
  } catch (err) {
    console.error('[Kairux RPC Error]', err);
    
    if (err instanceof Error) {
      throw error(400, err.message);
    }
    
    throw error(500, 'Internal server error');
  }
};
```

---

## 5. Component Hierarchy

```
App
├── Layout (Sidebar + Header)
│   └── ModuleNav (dynamic based on permissions)
│
└── Routes
    ├── Libro
    │   ├── Header (title + filters + add button)
    │   ├── FilterBar (tipo, estado, date range)
    │   ├── TransactionList (deck layout)
    │   │   └── TransactionCard (per item)
    │   │       ├── Image (Foto_Comprobante)
    │   │       ├── Header (Contacto_Ref + Total_Facturado)
    │   │       ├── Summary (Resumen_Financiero)
    │   │       └── Actions (Delete, Edit, View)
    │   └── BottomNav (pagination)
    │
    ├── TransaccionDetail
    │   ├── Header (back button + actions)
    │   ├── MediaGallery (Foto_Comprobante)
    │   ├── InfoGrid (all fields)
    │   ├── FinancialSummary (Resumen_Financiero, Resumen_Saldos)
    │   ├── PaymentHistory (Related Abonos)
    │   └── PaymentForm (inline add abono)
    │
    ├── TransaccionForm
    │   ├── FormHeader
    │   ├── Section: General (Fecha, Tipo, Contacto, Item)
    │   ├── Section: Detalle (Cantidad, Precio, Descuento)
    │   ├── Section: Financiero (Moneda, IVA, Total)
    │   ├── Section: Condiciones (Venta, Plazo, Vencimiento)
    │   ├── Section: Comprobante (Foto, Factura, Clave)
    │   └── SubmitActions
    │
    ├── Catalogo
    │   └── CatalogCard (Nombre_Item + Categoria + Icon)
    │
    ├── Contactos
    │   └── ContactCard (Logo + Nombre + Actions)
    │
    └── Reportes
        ├── BalanceChart
        ├── CxCPieChart
        └── DataTable
```

---

## 6. Format Rules → Tailwind Mapping

From reglas.md, map to Tailwind classes:

```typescript
// lib/components/FormatBadge.svelte
<script lang="ts">
  interface FormatRule {
    condition: boolean;
    classes: string;
    icon?: string;
  }
  
  const rules: Record<string, FormatRule> = {
    // Servicios: bold, uppercase, theme color
    'Servicios': {
      condition: (categoria) => categoria === 'Servicios',
      classes: 'font-bold uppercase text-primary-600',
      icon: 'briefcase'
    },
    // Gastos Fijos: bold, uppercase, muted
    'Gastos Fijos': {
      condition: (categoria) => categoria === 'Gastos fijos',
      classes: 'font-bold uppercase text-gray-500',
      icon: 'store'
    },
    // Gastos: red, bold
    'Gastos': {
      condition: (tipo) => tipo === 'Gasto',
      classes: 'text-red-600 font-bold',
      icon: 'engine-warning'
    },
    // Ingresos: green, bold
    'Ingresos': {
      condition: (tipo) => tipo === 'Ingreso',
      classes: 'text-green-600 font-bold',
      icon: 'hand-holding-usd'
    },
    // Estado_Pagado: green background
    'Pagado': {
      condition: (estado) => estado === 'Pagado',
      classes: 'bg-green-100 text-green-800 font-bold uppercase',
      icon: 'check-circle'
    },
    // Estado_Pendiente: orange
    'Pendiente': {
      condition: (estado) => estado === 'Pendiente',
      classes: 'bg-orange-100 text-orange-800',
      icon: 'clock'
    },
    // Icono_SINPE: mobile icon
    'Sinpe': {
      condition: (metodo) => metodo === 'Sinpe',
      classes: '',
      icon: 'mobile-alt'
    },
    // Icono_Tarjeta: credit card
    'Tarjeta': {
      condition: (metodo) => metodo === 'Tarjeta',
      classes: '',
      icon: 'credit-card'
    }
  };
</script>
```
