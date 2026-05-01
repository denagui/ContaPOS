/**
 * MoneyUtils - Utilitarios para precisión monetaria (Céntimos)
 * 
 * Estándar: Usamos INTEGER para almacenar céntimos y evitar errores de punto flotante.
 * Esto garantiza precisión exacta en cálculos de impuestos, totales y reportes NIIF.
 * 
 * Ejemplo: $10.50 USD = 1050 cents
 */

/**
 * Convierte de dólares/colones a céntimos (INTEGER)
 * @param amount - Cantidad en moneda decimal (ej: 10.50)
 * @returns Cantidad en céntimos (ej: 1050)
 */
export function toCents(amount: number): number {
  // Redondeo preciso para evitar errores de punto flotante
  return Math.round(amount * 100);
}

/**
 * Convierte de céntimos a dólares/colones (decimal)
 * @param cents - Cantidad en céntimos (ej: 1050)
 * @returns Cantidad en moneda decimal (ej: 10.50)
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Formatea cantidad en céntimos a string legible
 * @param cents - Cantidad en céntimos
 * @param currency - Código de moneda (USD, CRC, etc.)
 * @param locale - Locale para formateo (ej: 'en-US', 'es-CR')
 * @returns String formateado (ej: "$10.50")
 */
export function formatMoney(cents: number, currency: string = 'USD', locale: string = 'en-US'): string {
  const amount = fromCents(cents);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calcula impuesto sobre cantidad en céntimos
 * @param amountCents - Cantidad base en céntimos
 * @param taxRate - Tasa de impuesto (ej: 0.13 para 13%)
 * @returns Impuesto en céntimos (redondeado)
 */
export function calculateTaxCents(amountCents: number, taxRate: number): number {
  return Math.round(amountCents * taxRate);
}

/**
 * Calcula subtotal desde total con impuesto incluido
 * @param totalCents - Total con impuesto en céntimos
 * @param taxRate - Tasa de impuesto (ej: 0.13 para 13%)
 * @returns Subtotal en céntimos
 */
export function extractSubtotalCents(totalCents: number, taxRate: number): number {
  return Math.round(totalCents / (1 + taxRate));
}

/**
 * Suma múltiples cantidades en céntimos
 * @param amounts - Array de cantidades en céntimos
 * @returns Suma total en céntimos
 */
export function sumCents(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Valida que una cantidad en céntimos sea válida
 * @param cents - Cantidad a validar
 * @returns true si es válido
 */
export function isValidCents(cents: number): boolean {
  return Number.isInteger(cents) && cents >= 0;
}

/**
 * Convierte string de moneda a céntimos
 * @param currencyString - String de moneda (ej: "$10.50", "₡1,000.00")
 * @returns Cantidad en céntimos
 */
export function parseCurrencyToCents(currencyString: string): number {
  // Eliminar símbolos de moneda y espacios
  const cleaned = currencyString.replace(/[^0-9.,-]/g, '');
  
  // Detectar si usa coma como decimal
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Formato europeo: 1.000,50
    const normalized = cleaned.replace('.', '').replace(',', '.');
    return toCents(parseFloat(normalized));
  } else if (cleaned.includes('.') && cleaned.includes(',')) {
    // Formato mixto: determinar cuál es decimal
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Coma es decimal: 1.000,50
      const normalized = cleaned.replace('.', '').replace(',', '.');
      return toCents(parseFloat(normalized));
    } else {
      // Punto es decimal: 1,000.50
      const normalized = cleaned.replace(/,/g, '');
      return toCents(parseFloat(normalized));
    }
  } else {
    // Solo punto o nada: 1000.50 o 1000
    const normalized = cleaned.replace(/,/g, '');
    return toCents(parseFloat(normalized));
  }
}

/**
 * Divide una cantidad en céntimos proporcionalmente
 * Útil para dividir impuestos o descuentos entre múltiples items
 * @param totalCents - Cantidad total a dividir
 * @param ratios - Array de proporciones (ej: [0.3, 0.7])
 * @returns Array de cantidades divididas en céntimos
 */
export function splitCentsProportionally(totalCents: number, ratios: number[]): number[] {
  const result: number[] = [];
  let remaining = totalCents;
  
  for (let i = 0; i < ratios.length - 1; i++) {
    const amount = Math.round(totalCents * ratios[i]);
    result.push(amount);
    remaining -= amount;
  }
  
  // El último elemento recibe el remanente para evitar errores de redondeo
  result.push(remaining);
  
  return result;
}

/**
 * Aplica descuento a cantidad en céntimos
 * @param amountCents - Cantidad original en céntimos
 * @param discountPercent - Porcentaje de descuento (0-100)
 * @returns Cantidad con descuento aplicado en céntimos
 */
export function applyDiscountCents(amountCents: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be between 0 and 100');
  }
  return Math.round(amountCents * (1 - discountPercent / 100));
}

/**
 * Exportación de utilidades
 */
export const MoneyUtils = {
  toCents,
  fromCents,
  formatMoney,
  calculateTaxCents,
  extractSubtotalCents,
  sumCents,
  isValidCents,
  parseCurrencyToCents,
  splitCentsProportionally,
  applyDiscountCents,
};

export default MoneyUtils;
