<script lang="ts">
import { enhance } from '$app/forms';
import type { PageData } from './$types';

let { data } = $props();

type TaxSummary = typeof data.taxSummary[0];

// Filtros reactivos
let selectedPeriod = $state('current_month');
let exportFormat = $state('csv');

// Totales reactivos con $derived (Svelte 5)
const totalTaxByRate = $derived(() => {
const totals: Record<string, { base: number; tax: number }> = {
'0': { base: 0, tax: 0 },
'4': { base: 0, tax: 0 },
'8': { base: 0, tax: 0 },
'13': { base: 0, tax: 0 }
};

data.sales?.forEach((sale: any) => {
const items = sale.items || [];
items.forEach((item: any) => {
const rate = item.taxRate || '13';
if (totals[rate]) {
totals[rate].base += item.subtotal || 0;
totals[rate].tax += item.taxAmount || 0;
}
});
});

return totals;
});

const grandTotalBase = $derived(
Object.values(totalTaxByRate).reduce((sum, t) => sum + t.base, 0)
);

const grandTotalTax = $derived(
Object.values(totalTaxByRate).reduce((sum, t) => sum + t.tax, 0)
);

const totalSales = $derived(data.sales?.length || 0);

// Resumen de gastos por NIIF
const expensesByNiif = $derived(() => {
const summary: Record<string, number> = {};
data.expenses?.forEach((expense: any) => {
const category = expense.niifCategory || 'operating_expense';
summary[category] = (summary[category] || 0) + expense.amount;
});
return summary;
});

function exportReport() {
if (exportFormat === 'csv') {
exportToCSV();
} else {
window.print();
}
}

function exportToCSV() {
let csv = 'Tipo,Tasa,Base Imponible,Impuesto\n';

// Ventas por tasa de IVA
Object.entries(totalTaxByRate).forEach(([rate, totals]) => {
csv += `Venta,${rate}%,${totals.base.toFixed(2)},${totals.tax.toFixed(2)}\n`;
});

// Gastos por categoría NIIF
Object.entries(expensesByNiif).forEach(([category, amount]) => {
csv += `Gasto NIIF,${category},,${amount.toFixed(2)}\n`;
});

// Totales
csv += `TOTAL,,${grandTotalBase.toFixed(2)},${grandTotalTax.toFixed(2)}\n`;

const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = `reporte_fiscal_${new Date().toISOString().split('T')[0]}.csv`;
link.click();
}

const formatCurrency = (amount: number) => {
return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
};

const getNiifName = (category: string) => {
const names: Record<string, string> = {
'cost_of_sales': 'Costo de Ventas',
'operating_expense': 'Gastos Operativos',
'employee_benefit': 'Beneficios a Empleados',
'depreciation': 'Depreciación',
'financial_expense': 'Gastos Financieros',
'other_expense': 'Otros Gastos',
'non_operating_expense': 'Gastos No Operativos'
};
return names[category] || category;
};
</script>

<svelte:head>
<title>Reporte Fiscal - ContaPOS</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
<!-- Header -->
<header class="mb-8 print:hidden">
<h1 class="text-3xl font-bold text-gray-900 mb-2">📊 Reporte Fiscal NIIF</h1>
<p class="text-gray-600">Resumen de IVA y clasificación NIIF para declaraciones tributarias</p>
</header>

<!-- Controles (ocultos en impresión) -->
<div class="flex flex-wrap gap-4 justify-between items-center mb-6 print:hidden">
<div class="flex gap-4">
<select 
bind:value={selectedPeriod}
class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
>
<option value="current_month">Mes Actual</option>
<option value="last_month">Mes Anterior</option>
<option value="current_quarter">Trimestre Actual</option>
<option value="current_year">Año Actual</option>
</select>

<select 
bind:value={exportFormat}
class="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
>
<option value="csv">Exportar CSV</option>
<option value="pdf">Imprimir PDF</option>
</select>
</div>

<button 
onclick={exportReport}
class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
>
<span>📥</span> Exportar Reporte
</button>
</div>

<!-- Resumen de IVA por Tasa -->
<div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
<h2 class="text-lg font-bold text-gray-900 mb-4">💰 Resumen de IVA por Tasa</h2>

<div class="overflow-x-auto">
<table class="w-full">
<thead class="bg-gray-50 border-b border-gray-200">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasa</th>
<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Imponible</th>
<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impuesto</th>
<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% del Total</th>
</tr>
</thead>
<tbody class="divide-y divide-gray-200">
{#each Object.entries(totalTaxByRate) as [rate, totals]}
<tr class="hover:bg-gray-50">
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 py-1 text-sm font-bold rounded-full 
{rate === '0' ? 'bg-gray-100 text-gray-800' : ''}
{rate === '4' ? 'bg-blue-100 text-blue-800' : ''}
{rate === '8' ? 'bg-yellow-100 text-yellow-800' : ''}
{rate === '13' ? 'bg-green-100 text-green-800' : ''}
">
{rate}%
</span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
{formatCurrency(totals.base)}
</td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
{formatCurrency(totals.tax)}
</td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
{grandTotalTax > 0 ? ((totals.tax / grandTotalTax) * 100).toFixed(1) : 0}%
</td>
</tr>
{/each}

<!-- Total General -->
<tr class="bg-gray-50 font-bold">
<td class="px-6 py-4 text-sm text-gray-900">TOTAL</td>
<td class="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(grandTotalBase)}</td>
<td class="px-6 py-4 text-right text-sm text-orange-600">{formatCurrency(grandTotalTax)}</td>
<td class="px-6 py-4 text-right text-sm text-gray-900">100%</td>
</tr>
</tbody>
</table>
</div>
</div>

<!-- Gastos por Categoría NIIF -->
<div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
<h2 class="text-lg font-bold text-gray-900 mb-4">📋 Gastos por Categoría NIIF</h2>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
{#each Object.entries(expensesByNiif) as [category, amount]}
<div class="border border-gray-200 rounded-lg p-4">
<p class="text-sm text-gray-600 mb-1">{getNiifName(category)}</p>
<p class="text-xl font-bold text-red-600">{formatCurrency(amount)}</p>
</div>
{:else}
<p class="text-gray-500 col-span-full">No hay gastos registrados en este periodo</p>
{/each}
</div>
</div>

<!-- Estadísticas Generales -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
<div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
<p class="text-sm opacity-80 mb-1">Total Ventas</p>
<p class="text-3xl font-bold">{totalSales}</p>
</div>

<div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
<p class="text-sm opacity-80 mb-1">Base Imponible Total</p>
<p class="text-2xl font-bold">{formatCurrency(grandTotalBase)}</p>
</div>

<div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
<p class="text-sm opacity-80 mb-1">IVA Total Recolectado</p>
<p class="text-2xl font-bold">{formatCurrency(grandTotalTax)}</p>
</div>
</div>

<!-- Notas para declaración -->
<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 print:border-none">
<h3 class="font-bold text-yellow-800 mb-2">⚠️ Notas para Declaración Tributaria</h3>
<ul class="text-sm text-yellow-700 space-y-1">
<li>• El IVA recolectado debe declararse en el formulario D-104 de Hacienda</li>
<li>• Los gastos clasificados por NIIF facilitan la conciliación fiscal</li>
<li>• Conserve los comprobantes electrónicos por al menos 5 años</li>
<li>• Este reporte es informativo y no sustituye la asesoría contable profesional</li>
</ul>
</div>
</div>

<!-- Estilos para impresión -->
<style>
@media print {
body { background: white; }
.print\\:hidden { display: none !important; }
.print\\:p-0 { padding: 0 !important; }
.print\\:bg-white { background: white !important; }
.print\\:border-none { border: none !important; }
}
</style>
