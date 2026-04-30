# Especificación de Fórmulas y Cálculos

> Traducción de AppSheet Formulas → TypeScript Functions

---

## 1. Fórmulas de Virtual Columns (Transacciones)

### Estado_Real (Real Status)

**AppSheet Formula:**
```
=IF([Estado_Pago] = "Pagado", "Pagado",
   IF(TODAY() > [Fecha_Vencimiento], "Vencido",
   "Pendiente"))
```

**TypeScript Implementation:**
```typescript
// lib/server/kairux/utils/formulas.ts

export function calcularEstadoReal(
  estadoPago: 'Pagado' | 'Pendiente',
  fechaVencimiento: number,
  saldoActual: number
): 'Pagado' | 'Pendiente' | 'Vencido' {
  // If paid or no balance
  if (estadoPago === 'Pagado' || saldoActual <= 0) {
    return 'Pagado';
  }
  
  // Check if overdue
  const now = Date.now();
  if (now > fechaVencimiento) {
    return 'Vencido';
  }
  
  return 'Pendiente';
}
```

---

### Monto_IVA (Tax Amount)

**AppSheet Formula:**
```
=IF([Porcentaje_IVA] > 0,
   ([Cantidad] * [Precio_Unitario] - [Monto_Descuento]) * [Porcentaje_IVA] / 100,
   0)
```

**TypeScript:**
```typescript
export function calcularMontoIva(
  cantidad: number,
  precioUnitario: number, // cents
  montoDescuento: number, // cents
  porcentajeIva: number // 4, 8, 13
): number {
  if (!porcentajeIva || porcentajeIva <= 0) {
    return 0;
  }
  
  const subtotal = (cantidad * precioUnitario) - montoDescuento;
  return Math.round(subtotal * porcentajeIva / 100);
}
```

---

### Total_Facturado (Total Amount)

**AppSheet Formula:**
```
=([Cantidad] * [Precio_Unitario]) - [Monto_Descuento] + [Monto_IVA]
```

**TypeScript:**
```typescript
export function calcularTotalFacturado(
  cantidad: number,
  precioUnitario: number, // cents
  montoDescuento: number, // cents
  montoIva: number // cents
): number {
  const subtotal = cantidad * precioUnitario;
  return subtotal - montoDescuento + montoIva;
}

// Combined calculation (used in HF01.create)
export function calcularTotales(
  cantidad: number,
  precioUnitario: number,
  tieneDescuento: boolean,
  porcentajeDescuento: number,
  porcentajeIva: number
): {
  montoDescuento: number;
  montoIva: number;
  totalFacturado: number;
} {
  const subtotal = cantidad * precioUnitario;
  
  // Discount
  let montoDescuento = 0;
  if (tieneDescuento && porcentajeDescuento) {
    montoDescuento = Math.round(subtotal * porcentajeDescuento / 100);
  }
  
  const baseIva = subtotal - montoDescuento;
  
  // IVA
  let montoIva = 0;
  if (porcentajeIva) {
    montoIva = Math.round(baseIva * porcentajeIva / 100);
  }
  
  return {
    montoDescuento,
    montoIva,
    totalFacturado: baseIva + montoIva
  };
}
```

---

### Saldo_Actual (Current Balance)

**AppSheet Formula:**
```
=[Total_Facturado] - SUM([Related Abonos][Monto_Pagado])
```

**TypeScript:**
```typescript
export function calcularSaldoActual(
  totalFacturado: number, // cents
  abonos: Array<{ montoPagado: number }>
): number {
  const totalPagado = abonos.reduce((sum, abono) => sum + abono.montoPagado, 0);
  return Math.max(0, totalFacturado - totalPagado);
}

// Update transaction after new payment
export async function actualizarSaldoTransaccion(
  db: DrizzleClient,
  transaccionId: string,
  montoNuevoAbono: number
) {
  const tx = await db.query.transacciones.findFirst({
    where: eq(transacciones.id, transaccionId),
    with: { abonos: true }
  });
  
  if (!tx) throw new Error('Transaction not found');
  
  const nuevoSaldo = calcularSaldoActual(tx.totalFacturado, tx.abonos);
  const nuevoEstado = nuevoSaldo <= 0 ? 'Pagado' : 'Pendiente';
  
  await db.update(transacciones)
    .set({ saldoActual: nuevoSaldo, estadoPago: nuevoEstado })
    .where(eq(transacciones.id, transaccionId));
}
```

---

### Fecha_Vencimiento (Due Date Auto-calculation)

**AppSheet:**
```
Initial Value: =IF([Condicion_Venta] = "Crédito", [Fecha] + ([Plazo_Dias] * 86400000), [Fecha])
```

**TypeScript:**
```typescript
export function calcularFechaVencimiento(
  fecha: number, // timestamp ms
  condicionVenta: 'Contado' | 'Crédito',
  plazoDias?: number
): number {
  if (condicionVenta === 'Contado') {
    return fecha;
  }
  
  const dias = plazoDias ?? 0;
  return fecha + (dias * 24 * 60 * 60 * 1000);
}
```

---

## 2. Fórmulas de Resumen (Summary Columns)

### Resumen_Financiero

**AppSheet:** Formatted text with line breaks
```
="Subtotal: " & TEXT([Cantidad] * [Precio_Unitario]) & 
"\nDescuento: " & TEXT([Monto_Descuento]) &
"\nIVA (" & [Porcentaje_IVA] & "%): " & TEXT([Monto_IVA]) &
"\nTotal: " & TEXT([Total_Facturado])
```

**TypeScript:**
```typescript
export function generarResumenFinanciero(tx: Transaction): string {
  const subtotal = tx.cantidad * tx.precioUnitario;
  const moneda = tx.moneda === 'CRC' ? '₡' : '$';
  
  return [
    `Subtotal: ${moneda}${(subtotal / 100).toFixed(2)}`,
    `Descuento: ${moneda}${(tx.montoDescuento / 100).toFixed(2)}`,
    `IVA (${tx.porcentajeIva}%): ${moneda}${(tx.montoIva / 100).toFixed(2)}`,
    `Total: ${moneda}${(tx.totalFacturado / 100).toFixed(2)}`
  ].join('\n');
}
```

---

### Resumen_Identidad

**AppSheet:** With emojis
```
="📄 " & [Numero_Factura] & " | 🔑 " & [Clave_Hacienda]
```

**TypeScript:**
```typescript
export function generarResumenIdentidad(tx: Transaction): string {
  const parts: string[] = [];
  
  if (tx.numeroFactura) {
    parts.push(`📄 ${tx.numeroFactura}`);
  }
  
  if (tx.claveHacienda) {
    parts.push(`🔑 ${tx.claveHacienda.substring(0, 20)}...`);
  }
  
  return parts.join(' | ');
}
```

---

### Resumen_Estado_Flujo

**AppSheet:** Payment status with icons
```
=IF([Estado_Pago] = "Pagado", "✅ Pagado",
   IF([Estado_Pago] = "Vencido", "⚠️ Vencido",
   "⏳ Pendiente"))
```

**TypeScript:**
```typescript
export function generarResumenEstado(estado: string): string {
  const iconos: Record<string, string> = {
    'Pagado': '✅',
    'Pendiente': '⏳',
    'Vencido': '⚠️'
  };
  
  return `${iconos[estado] || '❓'} ${estado}`;
}
```

---

## 3. Condiciones (Show_If, Valid_If, Required_If)

### Descuento visibility

**AppSheet Show_If:**
```
=[Descuento] = TRUE
```

**Svelte 5:**
```svelte
<script>
  let tieneDescuento = $state(false);
  let porcentajeDescuento = $state(0);
</script>

{#if tieneDescuento}
  <FormField label="Porcentaje Descuento">
    <Input type="number" bind:value={porcentajeDescuento} max={100} />
  </FormField>
{/if}
```

---

### Moneda y Tipo de Cambio

**AppSheet:**
```
Show_If Tipo_Cambio: =[Moneda] <> "CRC"
```

**Svelte 5:**
```svelte
<script>
  let moneda = $state<'CRC' | 'USD'>('CRC');
  let tipoCambio = $state(1);
</script>

<FormField label="Moneda">
  <Select bind:value={moneda} options={['CRC', 'USD']} />
</FormField>

{#if moneda !== 'CRC'}
  <FormField label="Tipo de Cambio">
    <Input type="number" bind:value={tipoCambio} step={0.01} />
  </FormField>
{/if}
```

---

### Fecha Vencimiento (Credit Only)

**AppSheet:**
```
Show_If: =[Condicion_Venta] = "Crédito"
Editable_If: =[Condicion_Venta] = "Crédito"
Required_If: =[Condicion_Venta] = "Crédito"
```

**Svelte 5:**
```svelte
<script>
  let condicionVenta = $state<'Contado' | 'Crédito'>('Contado');
  let plazoDias = $state(0);
  let fechaVencimiento = $state(Date.now());
  
  // Auto-calculate when condition or days change
  $effect(() => {
    if (condicionVenta === 'Crédito' && plazoDias > 0) {
      fechaVencimiento = fechaTransaccion + (plazoDias * 24 * 60 * 60 * 1000);
    }
  });
</script>

{#if condicionVenta === 'Crédito'}
  <FormField label="Plazo (días)" required>
    <Input type="number" bind:value={plazoDias} min={1} />
  </FormField>
  
  <FormField label="Fecha Vencimiento" required>
    <DatePicker bind:value={fechaVencimiento} />
  </FormField>
{/if}
```

---

## 4. Initial Values

### ID generation

```typescript
// UNIQUEID() → crypto.randomUUID()
export function generateId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

// Clave Hacienda (50 digits) - Costa Rica format
export function generateClaveHacienda(): string {
  // Format: 506 + fecha(8) + cédula(12) + consecutivo(20) + situación(1) + código(4) + seguridad(8)
  const date = new Date();
  const fecha = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
  
  // Simplified version - real implementation needs proper numbering
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 42);
  return `506${fecha}${random}`.slice(0, 50);
}
```

---

### Today's date

```typescript
// TODAY() → Date.now()
export function today(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}
```
