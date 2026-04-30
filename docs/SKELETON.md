# Kairux Stack — Skeleton Framework 2026

> **Stack:** Cloudflare Workers + Svelte 5 + Tailwind v4 + D1/R2/KV
> **Arquitectura:** Command-based, multi-tenant, server-first

---

## Estructura del Proyecto

```
mi-app/
├── app_web/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── server/
│   │   │   │   ├── kairux/              # Core framework
│   │   │   │   │   ├── modules/         # Backend handlers (HE01, HF01, HO01, etc.)
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── hf.service.ts
│   │   │   │   │   │   ├── command-registry.ts
│   │   │   │   │   │   ├── context-utils.ts
│   │   │   │   │   │   └── kairux-rpc.types.ts
│   │   │   │   │   ├── observers/
│   │   │   │   │   ├── types/
│   │   │   │   │   └── utils/
│   │   │   │   │       ├── audit-logger.ts
│   │   │   │   │       └── safe-db.ts
│   │   │   │   └── db/
│   │   │   │       ├── schema/
│   │   │   │       └── migrations/
│   │   │   └── components/
│   │   │       ├── ui/                  # Componentes base
│   │   │       └── shared/              # Componentes compartidos
│   │   ├── routes/
│   │   │   ├── (modules)/               # Módulos de negocio
│   │   │   │   ├── financiero/
│   │   │   │   ├── estrategico/
│   │   │   │   ├── operativo/
│   │   │   │   └── digital/
│   │   │   ├── admin/
│   │   │   └── api/
│   │   ├── app.html
│   │   ├── app.css                      # Tailwind v4 + design tokens
│   │   └── app.d.ts
│   ├── static/
│   └── package.json
├── workers/
│   └── src/
│       └── index.ts                     # Worker entry point
├── drizzle.config.ts
├── tailwind.config.ts                   # Opcional (v4 usa @theme)
├── svelte.config.js
├── tsconfig.json
└── wrangler.toml
```

---

## Core Framework (`src/lib/server/kairux/`)

### 1. Command Registry (`command-registry.ts`)

```typescript
import type { CommandContext } from './types';
import { hfService } from './services/hf.service';

// Tipos base
export interface CommandRegistry {
  'HF01.list': { payload: { limit?: number }, response: any };
  'HE01.listMurals': { payload: {}, response: any };
  'HO01.list': { payload: { status?: string }, response: any };
  // ... más comandos
}

export type KnownCommandName = keyof CommandRegistry;

// Registro de comandos
function registerWorkerProxyCommand<K extends KnownCommandName>(
  commandName: K,
  description: string,
  options: {
    idempotent?: boolean;
    needsSafeDb?: boolean;
    queryOrCommand?: 'query' | 'command';
  } = {}
): void {
  // Registra en el Polygraph delegando a hfService
}

// Inicialización
export function initializeCommandGenome(): void {
  // Módulo Financiero
  registerWorkerProxyCommand('HF01.list', 'Lista transacciones', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF01.create', 'Crea transacción', { idempotent: false, needsSafeDb: true });
  
  // Módulo Estratégico
  registerWorkerProxyCommand('HE01.listMurals', 'Lista murales', { idempotent: true, needsSafeDb: true });
  
  // Módulo Operativo
  registerWorkerProxyCommand('HO01.list', 'Lista procesos', { idempotent: true, needsSafeDb: true });
}
```

### 2. HF Service Dispatcher (`hf.service.ts`)

```typescript
import { error } from '@sveltejs/kit';
import type { CommandContext, DuendeRuntimeContext, DuendeEnvBindings } from '../types';

export class HFService {
  async executeCall(action: string, payload: any, context: CommandContext): Promise<unknown> {
    // Enrutamiento por prefijo de módulo
    if (action.startsWith('HF')) {
      return handleHFCommands(action, payload, context);
    }
    if (action.startsWith('HE')) {
      return handleHECommands(action, payload, context);
    }
    if (action.startsWith('HO')) {
      return handleHOCommands(action, payload, context);
    }
    if (action.startsWith('HD')) {
      return handleHDCommands(action, payload, context);
    }
    
    throw new Error(`Unrecognized RPC action: ${action}`);
  }
}

// Dispatcher genérico por módulo
async function handleHECommands(action: string, payload: any, context: CommandContext) {
  const moduleCode = action.split('.')[0];
  const subAction = action.replace(`${moduleCode}.`, '');
  
  const runtimeContext = buildRuntimeContext(context);
  
  switch (moduleCode) {
    case 'HE01': {
      const { he01Commands } = await import('../modules/he01');
      if (subAction in he01Commands) {
        return (he01Commands as Record<string, Function>)[subAction](runtimeContext, payload);
      }
      break;
    }
    case 'HE02': {
      const { he02Commands } = await import('../modules/he02');
      if (subAction in he02Commands) {
        return (he02Commands as Record<string, Function>)[subAction](runtimeContext, payload);
      }
      break;
    }
    // ... más módulos HE
  }
  
  throw error(404, `Acción '${action}' no encontrada`);
}

// Pattern repetido para HO, HD, etc.
async function handleHOCommands(action: string, payload: any, context: CommandContext) {
  // ... igual que HE pero con módulos HO
}

async function handleHDCommands(action: string, payload: any, context: CommandContext) {
  // ... igual que HE pero con módulos HD
}

export const hfService = new HFService();
```

### 3. Backend Module Pattern (`modules/he01.ts`)

```typescript
import { z } from 'zod';
import { requireSafeDb } from '../utils/safe-db';
import type { DuendeRuntimeContext } from '../types';

// Esquemas Zod
const createMuralSchema = z.object({
  nombre: z.string().min(1),
  perspectiva: z.enum(['financial', 'customer', 'internal', 'learning']),
  objetivo: z.string(),
  companyId: z.string().optional()
});

// Función principal
export async function createMural(runtime: DuendeRuntimeContext, input: z.infer<typeof createMuralSchema>) {
  const { nombre, perspectiva, objetivo } = createMuralSchema.parse(input);
  const db = requireSafeDb(runtime, 'HE01', 'createMural');
  
  // Lógica de negocio
  const mural = {
    id: crypto.randomUUID(),
    nombre,
    perspectiva,
    objetivo,
    companyId: runtime.companyId,
    tenantId: runtime.tenantId,
    createdAt: Date.now()
  };
  
  await db.insert(murales).values(mural);
  return mural;
}

export async function listMurals(runtime: DuendeRuntimeContext) {
  const db = requireSafeDb(runtime, 'HE01', 'listMurals');
  return db.select().from(murales).where(eq(murales.companyId, runtime.companyId));
}

// Objeto de comandos para el dispatcher
export const he01Commands = {
  createMural,
  listMurals,
  // ... más comandos
};
```

### 4. Tipos Base (`types/index.ts`)

```typescript
import type { Session } from '@auth/core/types';
import type { DrizzleClient } from '../db';

export interface DuendeEnvBindings {
  D1_DB: D1Database;
  KV_FINANCIAL: KVNamespace;
  R2_DOCUMENTS: R2Bucket;
  AI: any; // Workers AI
}

export interface CommandContext {
  tenantId: string;
  companyId: string | null;
  userId: string | null;
  session: Session | null;
  platform?: {
    env: DuendeEnvBindings;
  };
  safeDb: ReturnType<typeof requireSafeDb>;
  db: DrizzleClient;
}

export interface DuendeRuntimeContext {
  db: DrizzleClient;
  safeDb: ReturnType<typeof requireSafeDb>;
  tenantId: string;
  companyId: string | null;
  user: Session | null;
  env: DuendeEnvBindings;
  actorId: string | null;
  userId: string | null;
}
```

### 5. Safe DB Wrapper (`utils/safe-db.ts`)

```typescript
import { DrizzleClient } from '../db';
import type { DuendeRuntimeContext } from '../types';

/**
 * Wrapper con aislamiento multi-tenant
 * Nunca bypassar - siempre usar en handlers
 */
export function requireSafeDb(
  runtime: DuendeRuntimeContext,
  moduleCode: string,
  action: string
): DrizzleClient {
  if (!runtime.safeDb) {
    throw new Error(`[R2] safeDb required for ${moduleCode}.${action}`);
  }
  return runtime.safeDb;
}

/**
 * Construye el contexto de runtime con aislamiento
 */
export function buildRuntimeContext(context: CommandContext) {
  return {
    db: context.db,
    safeDb: context.safeDb,
    tenantId: String(context.tenantId),
    companyId: context.companyId ?? null,
    user: context.session?.user ?? null,
    env: context.platform?.env,
    actorId: context.session?.user?.id ?? null,
    userId: context.session?.user?.id ?? null
  };
}
```

---

## Frontend Patterns

### 1. Server Loader (`routes/(modules)/financiero/libro/+page.server.ts`)

```typescript
import { executeKairuxCommand } from '$lib/server/kairux/command-registry';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, depends }) => {
  depends('app:financial');
  
  const { safeDb, session, platform } = locals;
  
  const transactions = await executeKairuxCommand('HF01.list', {
    limit: 100,
    companyId: session?.companyId
  }, { safeDb, session, platform });
  
  return {
    transactions: transactions ?? [],
    meta: {
      title: 'Libro Contable',
      description: 'Gestión de transacciones financieras'
    }
  };
}) satisfies PageServerLoad;
```

### 2. Svelte 5 Page (`+page.svelte`)

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  let { data } = $props();
  
  const transactions = $derived(data.transactions ?? []);
  const isLoading = $derived(page.status === 'loading');
</script>

<svelte:head>
  <title>{data.meta.title}</title>
</svelte:head>

<div class="p-6">
  <h1 class="text-2xl font-bold mb-4">{data.meta.title}</h1>
  
  {#if isLoading}
    <div class="animate-pulse">Cargando...</div>
  {:else if transactions.length === 0}
    <p class="text-gray-500">Sin transacciones</p>
  {:else}
    <ul class="space-y-2">
      {#each transactions as tx (tx.id)}
        <li class="p-4 bg-white rounded-lg shadow">
          {tx.description}: {tx.amountCents / 100}
        </li>
      {/each}
    </ul>
  {/if}
</div>
```

### 3. Design Tokens (`app.css`)

```css
@import "tailwindcss";

@theme {
  /* Colores base */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0 0);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-primary-foreground: oklch(0.985 0 0);
  --color-secondary: oklch(0.97 0 0);
  --color-secondary-foreground: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.556 0 0);
  --color-accent: oklch(0.97 0 0);
  --color-accent-foreground: oklch(0.205 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --color-destructive-foreground: oklch(0.577 0.245 27.325);
  --color-border: oklch(0.922 0 0);
  --color-input: oklch(0.922 0 0);
  --color-ring: oklch(0.708 0 0);
  
  /* Domain tokens */
  --financial-primary: oklch(0.55 0.2 140);
  --strategic-primary: oklch(0.65 0.2 260);
  --operational-primary: oklch(0.6 0.2 30);
  --digital-primary: oklch(0.7 0.2 200);
}

/* Utility classes */
@utility glass-panel {
  @apply bg-white/70 backdrop-blur-xl border border-white/20;
}

@utility solid-panel {
  @apply bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-sm;
}
```

---

## Database Schema (Drizzle + D1)

```typescript
// db/schema/empresas.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tenantId: text('tenant_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
});

// db/schema/he01-murals.ts
export const strategicMurals = sqliteTable('strategic_murals', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  perspectiva: text('perspective').notNull(),
  objetivo: text('objective').notNull(),
  companyId: text('company_id').references(() => companies.id),
  tenantId: text('tenant_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
});
```

---

## Configuración Base

### `wrangler.toml`

```toml
name = "mi-app"
main = "workers/src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "D1_DB"
database_name = "mi-app-db"
database_id = "xxx"

[[kv_namespaces]]
binding = "KV_FINANCIAL"
id = "xxx"

[[r2_buckets]]
binding = "R2_DOCUMENTS"
bucket_name = "mi-app-docs"
```

### `svelte.config.js`

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      '$lib': './src/lib',
      '$components': './src/lib/components',
      '$server': './src/lib/server'
    }
  }
};

export default config;
```

### `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/server/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: process.env.D1_CONNECTION_STRING || ''
  }
});
```

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Dev local
npm run dev

# Check types + lint
npm run check

# Build
npm run build

# Deploy
npm run deploy

# DB migrations
npm run db:generate
npm run db:migrate
```

---

## Reglas de Oro

1. **R1**: `executeKairuxCommand()` — único punto de entrada para lógica de negocio
2. **R2**: `context.safeDb` — aislamiento multi-tenant obligatorio
3. **R3**: Guards RBAC en `+layout.server.ts` antes de cargar módulos
4. **R4**: Sin floats para dinero — usar `amountCents` (integer)
5. **R5**: Fechas en Unix ms (13 dígitos)
6. **R6**: Svelte 5 runes — nunca class components
7. **R7**: Tailwind v4 — usar `@theme`, no config JS

---

## Estructura de un Módulo Nuevo

1. Crear `modules/moduloX.ts` con handlers exportados
2. Agregar comandos a `command-registry.ts` en `initializeCommandGenome()`
3. Crear ruta `(modules)/modulox/+page.server.ts` con loader
4. Crear ruta `(modules)/modulox/+page.svelte` con UI
5. Agregar guards en `(modules)/modulox/+layout.server.ts`
6. Ejecutar `npm run check` y `npm run build`
