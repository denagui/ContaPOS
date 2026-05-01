import { z } from 'zod';

/**
 * Sistema de Auditoría Blockchain-style para ContaPOS
 * Cada log incluye hash del anterior para crear cadena inmutable
 */

export interface AuditLogEntry {
  id: string;
  companyId: string;
  timestamp: number;
  
  // Actor
  userId: string;
  userEmail: string;
  userRole: string;
  
  // Acción
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'CLOSE_PERIOD' | 'OVERRIDE';
  entityType: string; // 'sale', 'expense', 'journal_entry', etc.
  entityId: string;
  
  // Datos
  previousHash: string; // Hash del log anterior (cadena)
  currentHash: string;  // Hash de este registro
  payload?: Record<string, any>; // Datos cambiados (solo diffs)
  
  // Contexto
  ipAddress: string;
  userAgent: string;
  reason?: string; // Justificación para acciones críticas
}

/**
 * Generador de hashes simples para cadena de auditoría
 * En producción usar crypto.subtle.digest('SHA-256', ...)
 */
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Web Crypto API (disponible en Cloudflare Workers)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Crea un nuevo entry de auditoría con hash encadenado
 */
export async function createAuditLog(
  params: Omit<AuditLogEntry, 'currentHash' | 'previousHash'>,
  lastHash: string | null
): Promise<AuditLogEntry> {
  const previousHash = lastHash || 'GENESIS_BLOCK';
  
  // Stringificar datos para hashing
  const contentString = JSON.stringify({
    ...params,
    previousHash,
    timestamp: params.timestamp
  });
  
  const currentHash = await generateHash(contentString);
  
  return {
    ...params,
    previousHash,
    currentHash
  };
}

/**
 * Valida la integridad de la cadena de auditoría
 * Retorna true si todos los hashes son consistentes
 */
export async function verifyAuditChain(logs: AuditLogEntry[]): Promise<boolean> {
  if (logs.length === 0) return true;
  
  // Verificar primer entry
  if (logs[0].previousHash !== 'GENESIS_BLOCK') {
    console.error('Invalid genesis block');
    return false;
  }
  
  // Verificar cadena
  for (let i = 1; i < logs.length; i++) {
    const prevLog = logs[i - 1];
    const currentLog = logs[i];
    
    // El previousHash del actual debe coincidir con el currentHash del anterior
    if (currentLog.previousHash !== prevLog.currentHash) {
      console.error(`Chain broken at index ${i}`);
      return false;
    }
    
    // Recalcular hash del log actual para verificar integridad
    const contentString = JSON.stringify({
      ...currentLog,
      previousHash: currentLog.previousHash,
      timestamp: currentLog.timestamp
    });
    
    const expectedHash = await generateHash(contentString);
    if (currentLog.currentHash !== expectedHash) {
      console.error(`Hash mismatch at index ${i}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Schema para crear logs de auditoría
 */
export const AuditLogSchema = z.object({
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'CLOSE_PERIOD', 'OVERRIDE']),
  entityType: z.string(),
  entityId: z.string(),
  payload: z.record(z.any()).optional(),
  reason: z.string().optional(),
});

/**
 * Middleware simulado para inyectar auditoría en operaciones CRUD
 */
export class AuditMiddleware {
  private static instance: AuditMiddleware | null = null;
  
  static getInstance(): AuditMiddleware {
    if (!this.instance) {
      this.instance = new AuditMiddleware();
    }
    return this.instance;
  }
  
  /**
   * Registra una operación crítica que requiere justificación
   */
  requireJustification(action: string, entityType: string): boolean {
    const criticalActions = ['DELETE', 'CLOSE_PERIOD', 'OVERRIDE'];
    const criticalEntities = ['journal_entry', 'accounting_period', 'tax_return'];
    
    return criticalActions.includes(action) || criticalEntities.includes(entityType);
  }
  
  /**
   * Determina si una operación debe ser bloqueada por período cerrado
   */
  isOperationBlocked(entityType: string, action: string, periodStatus: string): boolean {
    if (periodStatus === 'LOCKED') {
      return true; // Siempre bloqueado
    }
    
    if (periodStatus === 'CLOSED' && ['DELETE', 'UPDATE'].includes(action)) {
      return true; // No modificar/cerrar en período cerrado
    }
    
    return false;
  }
}
