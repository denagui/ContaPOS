/**
 * Generador de Clave de Comprobante Electrónico para Costa Rica
 * Norma Técnica de Facturación Electrónica v4.3+
 */

export interface HaciendaKeyParams {
  timestamp: Date;
  sucursal: string; // 3 dígitos
  terminal: string; // 5 dígitos
  tipoComprobante: '01' | '02' | '03' | '04' | '05';
  consecutivo: number; // 8 dígitos
  cedulaEmisor: string; // 9, 10 o 12 dígitos
}

export function generateHaciendaKey(params: HaciendaKeyParams): string {
  const date = params.timestamp;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const provincia = Math.floor(Math.random() * 7) + 1;
  const sucursal = params.sucursal.padStart(3, '0');
  const terminal = params.terminal.padStart(5, '0').substring(0, 5);
  const terminalRelleno = terminal.padEnd(7, '0');
  const consecutivo = String(params.consecutivo).padStart(10, '0');
  const cedula = params.cedulaEmisor.padStart(12, '0').substring(0, 12);
  
  const claveSinDV = `${year}${month}${day}${provincia}${sucursal}${terminalRelleno}${consecutivo}${cedula}`;
  const dv = calcularDigitoVerificador(claveSinDV);
  
  return claveSinDV + dv;
}

function calcularDigitoVerificador(clave: string): string {
  let suma = 0;
  let multiplicador = 1;
  for (let i = clave.length - 1; i >= 0; i--) {
    const digito = parseInt(clave[i]);
    suma += digito * multiplicador;
    multiplicador = multiplicador === 1 ? 2 : 1;
  }
  const residuo = suma % 10;
  const dv = residuo === 0 ? 0 : 10 - residuo;
  return String(dv);
}

export function validateCABYS(code: string): boolean {
  if (!code || code.length !== 13) return false;
  return /^\d{13}$/.test(code);
}

export function validateHaciendaKey(key: string): boolean {
  if (!key || key.length !== 50) return false;
  return /^\d{50}$/.test(key);
}
