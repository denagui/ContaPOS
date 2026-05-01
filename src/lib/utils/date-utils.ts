// src/lib/utils/date-utils.ts

/**
 * Utilidades para manejo de fechas conforme a estándares ISO 8601 y NIIF
 * 
 * - Almacenamiento: Epoch 13 (milisegundos)
 * - Intercambio: number (Epoch 13)
 * - Visualización: Formato humano localizado
 */

/**
 * Obtiene el timestamp actual en milisegundos (Epoch 13)
 */
export function now(): number {
  return Date.now();
}

/**
 * Convierte Epoch 13 a objeto Date
 */
export function toDate(epochMs: number): Date {
  return new Date(epochMs);
}

/**
 * Convierte Epoch 13 a string ISO 8601
 */
export function toISOString(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

/**
 * Formatea Epoch 13 para visualización humana
 * @param epochMs - Timestamp en milisegundos
 * @param locale - Código de localidad (ej: 'es-CR')
 * @param options - Opciones de formato
 */
export function formatHuman(
  epochMs: number,
  locale: string = 'es-CR',
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  
  return new Intl.DateTimeFormat(locale, options || defaultOptions)
    .format(new Date(epochMs));
}

/**
 * Formatea solo la fecha (sin hora)
 */
export function formatDate(epochMs: number, locale: string = 'es-CR'): string {
  return formatHuman(epochMs, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formatea solo la hora
 */
export function formatTime(epochMs: number, locale: string = 'es-CR'): string {
  return formatHuman(epochMs, locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Formatea fecha con nombre del mes
 * Ej: "15 de enero de 2024"
 */
export function formatDateLong(epochMs: number, locale: string = 'es-CR'): string {
  return formatHuman(epochMs, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatea fecha y hora compacto
 * Ej: "15/01/2024 14:30"
 */
export function formatDateTimeCompact(epochMs: number, locale: string = 'es-CR'): string {
  return formatHuman(epochMs, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Formatea fecha relativa (hace X tiempo)
 */
export function formatRelative(epochMs: number, locale: string = 'es-CR'): string {
  const now = Date.now();
  const diff = now - epochMs;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
  }
  if (months > 0) {
    return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  if (days > 0) {
    return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  }
  if (hours > 0) {
    return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  if (minutes > 0) {
    return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  return 'ahora mismo';
}

/**
 * Convierte fecha humana a Epoch 13
 * @param dateString - Fecha en formato YYYY-MM-DD, DD/MM/YYYY, o cualquier formato válido
 */
export function fromDateString(dateString: string): number {
  // Intentar parsear directamente
  let date = new Date(dateString);
  
  // Si falla, intentar formato DD/MM/YYYY
  if (isNaN(date.getTime())) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(p => parseInt(p, 10));
      date = new Date(year, month - 1, day);
    }
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha inválida: ${dateString}`);
  }
  
  return date.getTime();
}

/**
 * Convierte input de datetime-local a Epoch 13
 * @param dateTimeString - Formato YYYY-MM-DDTHH:mm
 */
export function fromDateTimeLocal(dateTimeString: string): number {
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    throw new Error(`Fecha/hora inválida: ${dateTimeString}`);
  }
  return date.getTime();
}

/**
 * Obtiene el inicio del día en Epoch 13
 */
export function startOfDay(epochMs: number): number {
  const date = new Date(epochMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Obtiene el fin del día en Epoch 13
 */
export function endOfDay(epochMs: number): number {
  const date = new Date(epochMs);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Obtiene el inicio de la semana (lunes)
 */
export function startOfWeek(epochMs: number): number {
  const date = new Date(epochMs);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea 1
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Obtiene el inicio del mes
 */
export function startOfMonth(epochMs: number): number {
  const date = new Date(epochMs);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Obtiene el fin del mes
 */
export function endOfMonth(epochMs: number): number {
  const date = new Date(epochMs);
  date.setMonth(date.getMonth() + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Suma días a una fecha Epoch 13
 */
export function addDays(epochMs: number, days: number): number {
  const date = new Date(epochMs);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

/**
 * Suma meses a una fecha Epoch 13
 */
export function addMonths(epochMs: number, months: number): number {
  const date = new Date(epochMs);
  date.setMonth(date.getMonth() + months);
  return date.getTime();
}

/**
 * Suma años a una fecha Epoch 13
 */
export function addYears(epochMs: number, years: number): number {
  const date = new Date(epochMs);
  date.setFullYear(date.getFullYear() + years);
  return date.getTime();
}

/**
 * Calcula diferencia en días entre dos fechas
 */
export function diffInDays(epochMs1: number, epochMs2: number): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((epochMs2 - epochMs1) / msPerDay);
}

/**
 * Calcula diferencia en meses entre dos fechas
 */
export function diffInMonths(epochMs1: number, epochMs2: number): number {
  const date1 = new Date(epochMs1);
  const date2 = new Date(epochMs2);
  return (date2.getFullYear() - date1.getFullYear()) * 12 + 
         (date2.getMonth() - date1.getMonth());
}

/**
 * Valida que un número sea un Epoch 13 válido
 */
export function isValidEpoch(epochMs: unknown): boolean {
  if (typeof epochMs !== 'number') return false;
  if (epochMs < 0) return false;
  if (!Number.isInteger(epochMs)) return false;
  
  // Rango razonable: 2000-01-01 hasta 2100-12-31
  const minEpoch = new Date('2000-01-01').getTime();
  const maxEpoch = new Date('2100-12-31').getTime();
  
  return epochMs >= minEpoch && epochMs <= maxEpoch;
}

/**
 * Valida que una fecha no sea futura
 */
export function isNotFuture(epochMs: number): boolean {
  return epochMs <= Date.now();
}

/**
 * Valida que una fecha no sea pasada
 */
export function isNotPast(epochMs: number): boolean {
  return epochMs >= Date.now();
}

/**
 * Compara dos fechas (ignora hora)
 * @returns -1 si date1 < date2, 0 si son iguales, 1 si date1 > date2
 */
export function compareDates(epochMs1: number, epochMs2: number): number {
  const d1 = startOfDay(epochMs1);
  const d2 = startOfDay(epochMs2);
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * Verifica si una fecha está en el rango especificado
 */
export function isInRange(epochMs: number, start: number, end: number): boolean {
  return epochMs >= start && epochMs <= end;
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(epochMs: number): boolean {
  return startOfDay(epochMs) === startOfDay(Date.now());
}

/**
 * Verifica si una fecha es ayer
 */
export function isYesterday(epochMs: number): boolean {
  return startOfDay(epochMs) === startOfDay(addDays(Date.now(), -1));
}

/**
 * Obtiene el número de semana del año (ISO 8601)
 */
export function getWeekNumber(epochMs: number): number {
  const date = new Date(epochMs);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Obtiene el trimestre del año
 */
export function getQuarter(epochMs: number): number {
  const date = new Date(epochMs);
  return Math.floor(date.getMonth() / 3) + 1;
}

/**
 * Formatea un rango de fechas
 * Ej: "01/01/2024 - 31/01/2024"
 */
export function formatDateRange(start: number, end: number, locale: string = 'es-CR'): string {
  return `${formatDate(start, locale)} - ${formatDate(end, locale)}`;
}

/**
 * Genera un ID único basado en timestamp
 * Formato: YYYYMMDDHHmmss-XXXXX
 */
export function generateTimestampId(prefix: string = ''): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7);
  
  return `${prefix}${year}${month}${day}${hours}${minutes}${seconds}-${random}`;
}
