import { z } from 'zod';

/**
 * Motor de Cierres Contables NIIF/IFRS
 * Gestiona estados de períodos fiscales y validaciones de integridad
 */

export type ClosingStatus = 'OPEN' | 'SOFT_CLOSE' | 'CLOSED' | 'LOCKED';

export interface AccountingPeriod {
  id: string;
  companyId: string;
  startDate: number; // Epoch ms
  endDate: number;   // Epoch ms
  status: ClosingStatus;
  closedBy?: string; // userId
  closedAt?: number;
  lockedBy?: string; // adminId
  lockedAt?: number;
  notes?: string;
}

/**
 * Reglas de Negocio para Cierres
 */
export const ClosingRules = {
  // Un período 'CLOSED' no permite nuevas transacciones
  ALLOW_TRANSACTION: (status: ClosingStatus) => status === 'OPEN' || status === 'SOFT_CLOSE',
  
  // Solo 'OPEN' permite edición de transacciones existentes
  ALLOW_MODIFICATION: (status: ClosingStatus) => status === 'OPEN',
  
  // Solo 'OPEN' permite eliminación lógica (soft delete)
  ALLOW_DELETION: (status: ClosingStatus) => status === 'OPEN',
  
  // Requiere rol de Supervisor para cerrar
  REQUIRE_SUPERVISOR_FOR_CLOSE: true,
  
  // Requiere rol de Admin para bloquear
  REQUIRE_ADMIN_FOR_LOCK: true,
};

/**
 * Schema de validación para solicitudes de cierre
 */
export const ClosePeriodSchema = z.object({
  periodId: z.string(),
  reason: z.string().min(10),
  password: z.string(), // Validar credenciales de supervisor
});

/**
 * Schema para reversión de cierre (solo Admin)
 */
export const ReopenPeriodSchema = z.object({
  periodId: z.string(),
  justification: z.string().min(20),
  adminToken: z.string(),
});

/**
 * Utilitarios para validación de transacciones contra períodos cerrados
 */
export class ClosingValidator {
  /**
   * Valida si se puede crear una transacción en una fecha dada
   */
  static canCreateTransaction(periods: AccountingPeriod[], transactionDate: number): boolean {
    const relevantPeriod = periods.find(p => 
      transactionDate >= p.startDate && transactionDate <= p.endDate
    );

    if (!relevantPeriod) {
      // Fuera de rangos definidos - permitir con advertencia
      return true;
    }

    return ClosingRules.ALLOW_TRANSACTION(relevantPeriod.status);
  }

  /**
   * Valida si se puede modificar una transacción existente
   */
  static canModifyTransaction(periods: AccountingPeriod[], transactionDate: number): boolean {
    const relevantPeriod = periods.find(p => 
      transactionDate >= p.startDate && transactionDate <= p.endDate
    );

    if (!relevantPeriod) {
      return true;
    }

    return ClosingRules.ALLOW_MODIFICATION(relevantPeriod.status);
  }

  /**
   * Obtiene el mensaje de error apropiado según el estado
   */
  static getValidationError(status: ClosingStatus, action: 'CREATE' | 'MODIFY' | 'DELETE'): string {
    const messages = {
      'CLOSED': `Acción ${action} denegada: El período fiscal está cerrado. Requiere reapertura por Supervisor.`,
      'LOCKED': `Acción ${action} denegada: El período fiscal está bloqueado. Requiere intervención de Administrador Global.`,
      'SOFT_CLOSE': `Advertencia: El período está en cierre suave. La acción ${action} puede requerir justificación.`,
    };

    return messages[status] || '';
  }
}

/**
 * Auditoría de operaciones en períodos cerrados
 */
export interface ClosingAuditLog {
  id: string;
  companyId: string;
  periodId: string;
  action: 'CLOSE' | 'REOPEN' | 'LOCK' | 'UNLOCK' | 'OVERRIDE';
  performedBy: string;
  performedAt: number;
  previousStatus: ClosingStatus;
  newStatus: ClosingStatus;
  justification: string;
  ipAddress?: string;
  userAgent?: string;
}
