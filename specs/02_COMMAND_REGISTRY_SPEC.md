# Especificación de Comandos Kairux

> Mapeo de acciones AppSheet → Commands HF (Financiero) + HO (Operativo)

---

## 1. Module Structure

```typescript
// lib/server/kairux/modules/
├── hf01-transacciones.ts    // HF01.* commands
├── hf02-catalogo.ts         // HF02.* commands
├── hf03-contactos.ts        // HF03.* commands
├── hf04-abonos.ts           // HF04.* commands
├── hf05-reportes.ts         // HF05.* commands (charts)
└── ho01-shared.ts           // HO01.* shared operations
```

---

## 2. Command Registry Extension

```typescript
// lib/server/kairux/command-registry.ts

export interface CommandRegistry {
  // === HF01: Transacciones (Financial Core) ===
  'HF01.list': { 
    payload: { 
      limit?: number;
      offset?: number;
      tipoMovimiento?: 'Ingreso' | 'Gasto';
      estadoPago?: 'Pagado' | 'Pendiente' | 'Vencido';
      contactoRef?: string;
      fechaDesde?: number;
      fechaHasta?: number;
    }, 
    response: Transaction[] 
  };
  'HF01.get': {
    payload: { id: string };
    response: Transaction;
  };
  'HF01.create': { 
    payload: {
      fecha: number;
      tipoMovimiento: 'Ingreso' | 'Gasto';
      contactoRef: string;
      itemRef: string;
      detalleAdicional?: string;
      numeroFactura?: string;
      claveHacienda?: string;
      metodoPago: 'Sinpe' | 'Tarjeta' | 'Transferencia' | 'Efectivo';
      estadoPago: 'Pagado' | 'Pendiente' | 'Vencido';
      cantidad: number;
      precioUnitario: number; // cents
      tieneDescuento?: boolean;
      porcentajeDescuento?: number;
      porcentajeIva?: number; // 4, 8, 13
      moneda: 'CRC' | 'USD';
      tipoCambio?: number;
      condicionVenta: 'Contado' | 'Crédito';
      plazoDias?: number;
      fechaVencimiento?: number;
      fotoComprobante?: string; // R2 path
    }, 
    response: Transaction 
  };
  'HF01.update': { 
    payload: { 
      id: string;
      updates: Partial<HF01.create['payload']>;
    }, 
    response: Transaction 
  };
  'HF01.delete': { 
    payload: { id: string; confirm?: boolean }, 
    response: { success: boolean; deletedId: string } 
  };
  'HF01.listCuentasPorCobrar': {
    payload: { limit?: number };
    response: Transaction[]; // Ingresos + Pendientes
  };
  'HF01.listCuentasPorPagar': {
    payload: { limit?: number };
    response: Transaction[]; // Gastos + Pendientes
  };
  'HF01.calcularTotales': {
    payload: { fechaDesde?: number; fechaHasta?: number };
    response: {
      totalIngresos: number; // cents
      totalGastos: number; // cents
      balance: number; // cents
    };
  };

  // === HF02: Catalogo ===
  'HF02.list': { 
    payload: { 
      limit?: number;
      categoria?: 'Productos' | 'Servicios' | 'Gastos fijos';
      search?: string;
    }, 
    response: CatalogItem[] 
  };
  'HF02.get': {
    payload: { id: string };
    response: CatalogItem;
  };
  'HF02.create': { 
    payload: {
      categoria: 'Productos' | 'Servicios' | 'Gastos fijos';
      nombreItem: string;
      naturaleza: 'Compra' | 'Venta' | 'Ambos';
      tarifaIva: '4%' | '8%' | '13%';
      codigoCabys?: string;
      precioUnitario?: number; // cents
      foto?: string; // R2 path
      notas?: string;
    }, 
    response: CatalogItem 
  };
  'HF02.update': { 
    payload: { id: string; updates: Partial<HF02.create['payload']> }, 
    response: CatalogItem 
  };
  'HF02.delete': { 
    payload: { id: string; confirm?: boolean }, 
    response: { success: boolean; deletedId: string } 
  };

  // === HF03: Contactos ===
  'HF03.list': { 
    payload: { 
      limit?: number;
      tipo?: 'Cliente' | 'Proveedor' | 'Ambos';
      search?: string;
    }, 
    response: Contact[] 
  };
  'HF03.get': {
    payload: { id: string };
    response: Contact;
  };
  'HF03.create': { 
    payload: {
      nombreRazonSocial: string;
      cedulaRuc?: string;
      tipo: 'Cliente' | 'Proveedor' | 'Ambos';
      telefono?: string;
      email?: string;
      direccion?: string;
      latitud?: number;
      longitud?: number;
      logo?: string; // R2 path
    }, 
    response: Contact 
  };
  'HF03.update': { 
    payload: { id: string; updates: Partial<HF03.create['payload']> }, 
    response: Contact 
  };
  'HF03.delete': { 
    payload: { id: string; confirm?: boolean }, 
    response: { success: boolean; deletedId: string } 
  };
  'HF03.composeEmail': {
    payload: { id: string; subject?: string; body?: string };
    response: { mailtoUrl: string };
  };
  'HF03.callPhone': {
    payload: { id: string };
    response: { telUrl: string };
  };
  'HF03.sendSMS': {
    payload: { id: string; message?: string };
    response: { smsUrl: string };
  };
  'HF03.viewMap': {
    payload: { id: string };
    response: { mapUrl: string; lat: number; lng: number };
  };

  // === HF04: Abonos ===
  'HF04.list': { 
    payload: { 
      transaccionRef?: string;
      limit?: number;
    }, 
    response: Payment[] 
  };
  'HF04.create': { 
    payload: {
      transaccionRef: string;
      fechaPago: number;
      montoPagado: number; // cents
      metodoPago: 'Sinpe' | 'Tarjeta' | 'Transferencia' | 'Efectivo';
      comprobantePago?: string; // R2 path
      notas?: string;
    }, 
    response: Payment 
  };
  'HF04.update': { 
    payload: { id: string; updates: Partial<HF04.create['payload']> }, 
    response: Payment 
  };
  'HF04.delete': { 
    payload: { id: string }, 
    response: { success: boolean; deletedId: string } 
  };

  // === HF05: Reportes y Gráficos ===
  'HF05.getBalanceData': {
    payload: { groupBy?: 'tipo' | 'mes' | 'categoria' };
    response: {
      labels: string[];
      ingresos: number[];
      gastos: number[];
    };
  };
  'HF05.getCuentasPorCobrarData': {
    payload: {};
    response: {
      total: number; // cents
      porVencer: number;
      vencidas: number;
      items: Array<{
        contacto: string;
        monto: number;
        diasVencido: number;
      }>;
    };
  };
  'HF05.getCuentasPorPagarData': {
    payload: {};
    response: {
      total: number; // cents
      porVencer: number;
      vencidas: number;
      items: Array<{
        contacto: string;
        monto: number;
        diasVencido: number;
      }>;
    };
  };
  'HF05.getVentasPorCliente': {
    payload: { periodo?: 'mes' | 'trimestre' | 'año' };
    response: Array<{
      contacto: string;
      totalFacturado: number;
      cantidadTransacciones: number;
    }>;
  };
}

export type KnownCommandName = keyof CommandRegistry;

// Command registration
export function initializeCommandGenome(): void {
  // HF01: Transacciones
  registerWorkerProxyCommand('HF01.list', 'Lista transacciones', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF01.get', 'Obtiene transacción', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF01.create', 'Crea transacción', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF01.update', 'Actualiza transacción', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF01.delete', 'Elimina transacción', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF01.listCuentasPorCobrar', 'Lista CxC', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF01.listCuentasPorPagar', 'Lista CxP', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF01.calcularTotales', 'Calcula totales', { idempotent: true, needsSafeDb: true });

  // HF02: Catalogo
  registerWorkerProxyCommand('HF02.list', 'Lista catálogo', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF02.get', 'Obtiene ítem', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF02.create', 'Crea ítem', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF02.update', 'Actualiza ítem', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF02.delete', 'Elimina ítem', { idempotent: false, needsSafeDb: true });

  // HF03: Contactos
  registerWorkerProxyCommand('HF03.list', 'Lista contactos', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF03.get', 'Obtiene contacto', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF03.create', 'Crea contacto', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF03.update', 'Actualiza contacto', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF03.delete', 'Elimina contacto', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF03.composeEmail', 'Genera mailto', { idempotent: true, needsSafeDb: false });
  registerWorkerProxyCommand('HF03.callPhone', 'Genera tel:', { idempotent: true, needsSafeDb: false });
  registerWorkerProxyCommand('HF03.sendSMS', 'Genera sms:', { idempotent: true, needsSafeDb: false });
  registerWorkerProxyCommand('HF03.viewMap', 'Genera URL mapa', { idempotent: true, needsSafeDb: true });

  // HF04: Abonos
  registerWorkerProxyCommand('HF04.list', 'Lista abonos', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF04.create', 'Crea abono', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF04.update', 'Actualiza abono', { idempotent: false, needsSafeDb: true });
  registerWorkerProxyCommand('HF04.delete', 'Elimina abono', { idempotent: false, needsSafeDb: true });

  // HF05: Reportes
  registerWorkerProxyCommand('HF05.getBalanceData', 'Datos balance', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF05.getCuentasPorCobrarData', 'Datos CxC', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF05.getCuentasPorPagarData', 'Datos CxP', { idempotent: true, needsSafeDb: true });
  registerWorkerProxyCommand('HF05.getVentasPorCliente', 'Ventas por cliente', { idempotent: true, needsSafeDb: true });
}
```

---

## 3. Module: HF01 (Transacciones)

```typescript
// lib/server/kairux/modules/hf01-transacciones.ts

import { z } from 'zod';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { requireSafeDb } from '../utils/safe-db';
import type { DuendeRuntimeContext } from '../types';
import { transacciones, abonos } from '$lib/server/db/schema';
import { toCents, calculateTotal } from '../utils/currency';

// === Schemas ===

const createSchema = z.object({
  fecha: z.number().int(),
  tipoMovimiento: z.enum(['Ingreso', 'Gasto']),
  contactoRef: z.string().min(1),
  itemRef: z.string().min(1),
  detalleAdicional: z.string().optional(),
  numeroFactura: z.string().optional(),
  claveHacienda: z.string().length(50).optional(),
  metodoPago: z.enum(['Sinpe', 'Tarjeta', 'Transferencia', 'Efectivo']),
  estadoPago: z.enum(['Pagado', 'Pendiente', 'Vencido']),
  cantidad: z.number().int().min(1).default(1),
  precioUnitario: z.number().int(), // cents
  tieneDescuento: z.boolean().default(false),
  porcentajeDescuento: z.number().int().min(0).max(100).optional(),
  porcentajeIva: z.number().int().optional(),
  moneda: z.enum(['CRC', 'USD']),
  tipoCambio: z.number().default(1),
  condicionVenta: z.enum(['Contado', 'Crédito']),
  plazoDias: z.number().int().optional(),
  fechaVencimiento: z.number().int().optional(),
  fotoComprobante: z.string().optional(),
});

// === Handlers ===

export async function list(runtime: DuendeRuntimeContext, payload: { 
  limit?: number; 
  offset?: number;
  tipoMovimiento?: 'Ingreso' | 'Gasto';
  estadoPago?: 'Pagado' | 'Pendiente' | 'Vencido';
  contactoRef?: string;
  fechaDesde?: number;
  fechaHasta?: number;
}) {
  const db = requireSafeDb(runtime, 'HF01', 'list');
  
  const conditions = [
    eq(transacciones.tenantId, runtime.tenantId)
  ];
  
  if (payload.tipoMovimiento) {
    conditions.push(eq(transacciones.tipoMovimiento, payload.tipoMovimiento));
  }
  if (payload.estadoPago) {
    conditions.push(eq(transacciones.estadoPago, payload.estadoPago));
  }
  if (payload.contactoRef) {
    conditions.push(eq(transacciones.contactoRef, payload.contactoRef));
  }
  if (payload.fechaDesde) {
    conditions.push(gte(transacciones.fecha, payload.fechaDesde));
  }
  if (payload.fechaHasta) {
    conditions.push(lte(transacciones.fecha, payload.fechaHasta));
  }
  
  return db.query.transacciones.findMany({
    where: and(...conditions),
    limit: payload.limit ?? 100,
    offset: payload.offset ?? 0,
    orderBy: desc(transacciones.fecha),
    with: {
      contacto: true,
      item: true,
      abonos: true
    }
  });
}

export async function create(runtime: DuendeRuntimeContext, payload: z.infer<typeof createSchema>) {
  const db = requireSafeDb(runtime, 'HF01', 'create');
  
  const data = createSchema.parse(payload);
  
  // Calculate derived values
  const subtotal = data.cantidad * data.precioUnitario;
  
  let montoDescuento = 0;
  if (data.tieneDescuento && data.porcentajeDescuento) {
    montoDescuento = Math.round(subtotal * data.porcentajeDescuento / 100);
  }
  
  const baseIva = subtotal - montoDescuento;
  let montoIva = 0;
  if (data.porcentajeIva) {
    montoIva = Math.round(baseIva * data.porcentajeIva / 100);
  }
  
  const totalFacturado = baseIva + montoIva;
  
  // Calculate saldo actual
  let saldoActual = totalFacturado;
  if (data.estadoPago === 'Pagado') {
    saldoActual = 0;
  }
  
  // Auto-calculate fecha vencimiento si es crédito
  let fechaVencimiento = data.fechaVencimiento;
  if (data.condicionVenta === 'Crédito' && data.plazoDias && !fechaVencimiento) {
    fechaVencimiento = data.fecha + (data.plazoDias * 24 * 60 * 60 * 1000);
  }
  
  const tx = {
    id: crypto.randomUUID(),
    tenantId: runtime.tenantId,
    companyId: runtime.companyId,
    idTransaccion: crypto.randomUUID().slice(0, 8).toUpperCase(),
    ...data,
    montoDescuento,
    montoIva,
    totalFacturado,
    saldoActual,
    fechaVencimiento,
    createdAt: Date.now(),
  };
  
  await db.insert(transacciones).values(tx);
  return tx;
}

export async function deleteTransaction(runtime: DuendeRuntimeContext, payload: { id: string; confirm?: boolean }) {
  const db = requireSafeDb(runtime, 'HF01', 'delete');
  
  if (!payload.confirm) {
    throw new Error('Confirmation required');
  }
  
  // Delete related abonos first
  await db.delete(abonos).where(eq(abonos.transaccionRef, payload.id));
  
  // Delete transaction
  await db.delete(transacciones).where(
    and(
      eq(transacciones.idTransaccion, payload.id),
      eq(transacciones.tenantId, runtime.tenantId)
    )
  );
  
  return { success: true, deletedId: payload.id };
}

// === Cuentas por Cobrar / Pagar ===

export async function listCuentasPorCobrar(runtime: DuendeRuntimeContext, payload: { limit?: number }) {
  const db = requireSafeDb(runtime, 'HF01', 'listCuentasPorCobrar');
  
  return db.query.transacciones.findMany({
    where: and(
      eq(transacciones.tenantId, runtime.tenantId),
      eq(transacciones.tipoMovimiento, 'Ingreso'),
      eq(transacciones.estadoPago, 'Pendiente')
    ),
    limit: payload.limit ?? 100,
    orderBy: desc(transacciones.fechaVencimiento),
    with: {
      contacto: true,
      abonos: true
    }
  });
}

export async function listCuentasPorPagar(runtime: DuendeRuntimeContext, payload: { limit?: number }) {
  const db = requireSafeDb(runtime, 'HF01', 'listCuentasPorPagar');
  
  return db.query.transacciones.findMany({
    where: and(
      eq(transacciones.tenantId, runtime.tenantId),
      eq(transacciones.tipoMovimiento, 'Gasto'),
      eq(transacciones.estadoPago, 'Pendiente')
    ),
    limit: payload.limit ?? 100,
    orderBy: desc(transacciones.fechaVencimiento),
    with: {
      contacto: true,
      abonos: true
    }
  });
}

// === Command Export ===

export const hf01Commands = {
  list,
  get: async (runtime: DuendeRuntimeContext, payload: { id: string }) => {
    const db = requireSafeDb(runtime, 'HF01', 'get');
    return db.query.transacciones.findFirst({
      where: and(
        eq(transacciones.idTransaccion, payload.id),
        eq(transacciones.tenantId, runtime.tenantId)
      ),
      with: {
        contacto: true,
        item: true,
        abonos: true
      }
    });
  },
  create,
  update: async (runtime: DuendeRuntimeContext, payload: { id: string; updates: any }) => {
    const db = requireSafeDb(runtime, 'HF01', 'update');
    // Implementation with recalculation
    throw new Error('Not implemented');
  },
  delete: deleteTransaction,
  listCuentasPorCobrar,
  listCuentasPorPagar,
  calcularTotales: async (runtime: DuendeRuntimeContext, payload: { fechaDesde?: number; fechaHasta?: number }) => {
    const db = requireSafeDb(runtime, 'HF01', 'calcularTotales');
    
    const conditions = [eq(transacciones.tenantId, runtime.tenantId)];
    if (payload.fechaDesde) conditions.push(gte(transacciones.fecha, payload.fechaDesde));
    if (payload.fechaHasta) conditions.push(lte(transacciones.fecha, payload.fechaHasta));
    
    const result = await db.select({
      tipo: transacciones.tipoMovimiento,
      total: sql<number>`SUM(${transacciones.totalFacturado})`.as('total')
    })
    .from(transacciones)
    .where(and(...conditions))
    .groupBy(transacciones.tipoMovimiento);
    
    const ingresos = result.find(r => r.tipo === 'Ingreso')?.total ?? 0;
    const gastos = result.find(r => r.tipo === 'Gasto')?.total ?? 0;
    
    return {
      totalIngresos: ingresos,
      totalGastos: gastos,
      balance: ingresos - gastos
    };
  }
};
```

---

## 4. Module: HF02 (Catalogo)

```typescript
// lib/server/kairux/modules/hf02-catalogo.ts

import { z } from 'zod';
import { eq, like, desc, and } from 'drizzle-orm';
import { requireSafeDb } from '../utils/safe-db';
import type { DuendeRuntimeContext } from '../types';
import { catalogo } from '$lib/server/db/schema';

const createSchema = z.object({
  categoria: z.enum(['Productos', 'Servicios', 'Gastos fijos']),
  nombreItem: z.string().min(1),
  naturaleza: z.enum(['Compra', 'Venta', 'Ambos']),
  tarifaIva: z.enum(['4%', '8%', '13%']),
  codigoCabys: z.string().optional(),
  precioUnitario: z.number().int().optional(),
  foto: z.string().optional(),
  notas: z.string().optional(),
});

export const hf02Commands = {
  list: async (runtime: DuendeRuntimeContext, payload: { limit?: number; categoria?: string; search?: string }) => {
    const db = requireSafeDb(runtime, 'HF02', 'list');
    
    const conditions = [eq(catalogo.tenantId, runtime.tenantId)];
    if (payload.categoria) conditions.push(eq(catalogo.categoria, payload.categoria));
    if (payload.search) conditions.push(like(catalogo.nombreItem, `%${payload.search}%`));
    
    return db.query.catalogo.findMany({
      where: and(...conditions),
      limit: payload.limit ?? 100,
      orderBy: desc(catalogo.nombreItem)
    });
  },
  
  get: async (runtime: DuendeRuntimeContext, payload: { id: string }) => {
    const db = requireSafeDb(runtime, 'HF02', 'get');
    return db.query.catalogo.findFirst({
      where: and(
        eq(catalogo.idItem, payload.id),
        eq(catalogo.tenantId, runtime.tenantId)
      )
    });
  },
  
  create: async (runtime: DuendeRuntimeContext, payload: z.infer<typeof createSchema>) => {
    const db = requireSafeDb(runtime, 'HF02', 'create');
    
    const data = createSchema.parse(payload);
    const item = {
      id: crypto.randomUUID(),
      tenantId: runtime.tenantId,
      companyId: runtime.companyId,
      idItem: crypto.randomUUID().slice(0, 8).toUpperCase(),
      ...data,
      createdAt: Date.now(),
    };
    
    await db.insert(catalogo).values(item);
    return item;
  },
  
  update: async (runtime: DuendeRuntimeContext, payload: { id: string; updates: any }) => {
    const db = requireSafeDb(runtime, 'HF02', 'update');
    const { eq } = await import('drizzle-orm');
    
    await db.update(catalogo)
      .set({ ...payload.updates, updatedAt: Date.now() })
      .where(and(
        eq(catalogo.idItem, payload.id),
        eq(catalogo.tenantId, runtime.tenantId)
      ));
    
    return hf02Commands.get(runtime, { id: payload.id });
  },
  
  delete: async (runtime: DuendeRuntimeContext, payload: { id: string; confirm?: boolean }) => {
    const db = requireSafeDb(runtime, 'HF02', 'delete');
    
    if (!payload.confirm) {
      throw new Error('Confirmation required');
    }
    
    await db.delete(catalogo).where(and(
      eq(catalogo.idItem, payload.id),
      eq(catalogo.tenantId, runtime.tenantId)
    ));
    
    return { success: true, deletedId: payload.id };
  }
};
```

---

## 5. Module: HF03 (Contactos)

```typescript
// lib/server/kairux/modules/hf03-contactos.ts

import { z } from 'zod';
import { eq, like, desc, and } from 'drizzle-orm';
import { requireSafeDb } from '../utils/safe-db';
import type { DuendeRuntimeContext } from '../types';
import { contactos } from '$lib/server/db/schema';

const createSchema = z.object({
  nombreRazonSocial: z.string().min(1),
  cedulaRuc: z.string().optional(),
  tipo: z.enum(['Cliente', 'Proveedor', 'Ambos']),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  direccion: z.string().optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  logo: z.string().optional(),
});

export const hf03Commands = {
  list: async (runtime: DuendeRuntimeContext, payload: { limit?: number; tipo?: string; search?: string }) => {
    const db = requireSafeDb(runtime, 'HF03', 'list');
    
    const conditions = [eq(contactos.tenantId, runtime.tenantId)];
    if (payload.tipo) conditions.push(eq(contactos.tipo, payload.tipo));
    if (payload.search) {
      conditions.push(like(contactos.nombreRazonSocial, `%${payload.search}%`));
    }
    
    return db.query.contactos.findMany({
      where: and(...conditions),
      limit: payload.limit ?? 100,
      orderBy: desc(contactos.nombreRazonSocial)
    });
  },
  
  get: async (runtime: DuendeRuntimeContext, payload: { id: string }) => {
    const db = requireSafeDb(runtime, 'HF03', 'get');
    return db.query.contactos.findFirst({
      where: and(
        eq(contactos.idContacto, payload.id),
        eq(contactos.tenantId, runtime.tenantId)
      )
    });
  },
  
  create: async (runtime: DuendeRuntimeContext, payload: z.infer<typeof createSchema>) => {
    const db = requireSafeDb(runtime, 'HF03', 'create');
    
    const data = createSchema.parse(payload);
    const contact = {
      id: crypto.randomUUID(),
      tenantId: runtime.tenantId,
      companyId: runtime.companyId,
      idContacto: crypto.randomUUID().slice(0, 8).toUpperCase(),
      ...data,
      createdAt: Date.now(),
    };
    
    await db.insert(contactos).values(contact);
    return contact;
  },
  
  // Communication actions (no DB needed)
  composeEmail: async (_runtime: DuendeRuntimeContext, payload: { id: string; subject?: string; body?: string }) => {
    // Returns mailto URL for frontend
    const subject = encodeURIComponent(payload.subject || '');
    const body = encodeURIComponent(payload.body || '');
    return { 
      mailtoUrl: `mailto:${payload.id}?subject=${subject}&body=${body}` 
    };
  },
  
  callPhone: async (_runtime: DuendeRuntimeContext, payload: { id: string }) => {
    return { telUrl: `tel:${payload.id}` };
  },
  
  sendSMS: async (_runtime: DuendeRuntimeContext, payload: { id: string; message?: string }) => {
    const message = encodeURIComponent(payload.message || '');
    return { smsUrl: `sms:${payload.id}?body=${message}` };
  },
  
  viewMap: async (runtime: DuendeRuntimeContext, payload: { id: string }) => {
    const db = requireSafeDb(runtime, 'HF03', 'viewMap');
    const contact = await hf03Commands.get(runtime, payload);
    
    if (!contact?.latitud || !contact?.longitud) {
      throw new Error('Contact has no location');
    }
    
    const lat = contact.latitud / 1000000; // Convert from integer storage
    const lng = contact.longitud / 1000000;
    
    return {
      mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      lat,
      lng
    };
  }
};
```

---

## 6. Module: HF04 (Abonos)

```typescript
// lib/server/kairux/modules/hf04-abonos.ts

import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { requireSafeDb } from '../utils/safe-db';
import type { DuendeRuntimeContext } from '../types';
import { abonos, transacciones } from '$lib/server/db/schema';

const createSchema = z.object({
  transaccionRef: z.string().min(1),
  fechaPago: z.number().int(),
  montoPagado: z.number().int().positive(), // cents
  metodoPago: z.enum(['Sinpe', 'Tarjeta', 'Transferencia', 'Efectivo']),
  comprobantePago: z.string().optional(),
  notas: z.string().optional(),
});

export const hf04Commands = {
  list: async (runtime: DuendeRuntimeContext, payload: { transaccionRef?: string; limit?: number }) => {
    const db = requireSafeDb(runtime, 'HF04', 'list');
    
    const conditions = [eq(abonos.tenantId, runtime.tenantId)];
    if (payload.transaccionRef) {
      conditions.push(eq(abonos.transaccionRef, payload.transaccionRef));
    }
    
    return db.query.abonos.findMany({
      where: and(...conditions),
      limit: payload.limit ?? 100,
      orderBy: desc(abonos.fechaPago),
      with: { transaccion: true }
    });
  },
  
  create: async (runtime: DuendeRuntimeContext, payload: z.infer<typeof createSchema>) => {
    const db = requireSafeDb(runtime, 'HF04', 'create');
    
    const data = createSchema.parse(payload);
    
    // Get transaction to update saldo
    const tx = await db.query.transacciones.findFirst({
      where: eq(transacciones.idTransaccion, data.transaccionRef)
    });
    
    if (!tx) {
      throw new Error('Transaction not found');
    }
    
    // Create payment
    const payment = {
      id: crypto.randomUUID(),
      tenantId: runtime.tenantId,
      companyId: runtime.companyId,
      idPago: crypto.randomUUID().slice(0, 8).toUpperCase(),
      ...data,
      createdAt: Date.now(),
    };
    
    await db.insert(abonos).values(payment);
    
    // Update transaction saldo
    const newSaldo = Math.max(0, tx.saldoActual - data.montoPagado);
    const newEstado = newSaldo <= 0 ? 'Pagado' : 'Pendiente';
    
    await db.update(transacciones)
      .set({ 
        saldoActual: newSaldo, 
        estadoPago: newEstado,
        updatedAt: Date.now() 
      })
      .where(eq(transacciones.idTransaccion, data.transaccionRef));
    
    return payment;
  }
};
```
