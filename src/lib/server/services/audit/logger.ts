/**
 * AuditLogger - Sistema de Auditoría Inmutable (ISO 27001)
 * 
 * Registra todas las acciones del sistema con hash criptográfico
 * para garantizar integridad y trazabilidad completa.
 * 
 * Cumple con:
 * - ISO 27001: Seguridad de la información
 * - ISO 27701: Privacidad de datos
 * - NIIF: Trazabilidad de transacciones financieras
 */

import { db } from '$lib/server/db';
import { auditLogsEnhanced, type NewAuditLogEnhanced } from '$lib/server/db/schema';
import { createHash } from 'crypto';

// ============================================
// TIPOS
// ============================================

export type SecurityLevel = 'info' | 'warning' | 'critical' | 'audit';
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT';

export interface AuditLogData {
  organizationId: string;
  userId?: string;
  action: ActionType;
  resourceType: string; // 'sale', 'product', 'contact', 'user', etc.
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  securityLevel?: SecurityLevel;
  isAutomated?: boolean;
  aiDecisionId?: string;
}

// ============================================
// SERVICIO DE AUDITORÍA
// ============================================

export class AuditLogger {
  
  private static lastHash: Map<string, string> = new Map();
  
  /**
   * Registra una acción en el log de auditoría
   */
  static async log(data: AuditLogData): Promise<string> {
    const timestamp = Date.now();
    
    // Determinar nivel de seguridad según la acción
    const securityLevel = this.determineSecurityLevel(data.action, data.resourceType);
    
    // Crear hash del registro para integridad
    const hashInput = JSON.stringify({
      timestamp,
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      oldValue: data.oldValue,
      newValue: data.newValue,
    });
    
    const hash = this.createHash(hashInput);
    
    // Obtener hash anterior para encadenamiento (blockchain-like)
    const previousHash = await this.getLastHash(data.organizationId);
    
    // Insertar registro
    const newLog: NewAuditLogEnhanced = {
      id: crypto.randomUUID(),
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
      newValue: data.newValue ? JSON.stringify(data.newValue) : null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      sessionId: data.sessionId || null,
      securityLevel: securityLevel,
      isAutomated: data.isAutomated ? 1 : 0,
      aiDecisionId: data.aiDecisionId || null,
      hash: hash,
      previousHash: previousHash,
      createdAt: timestamp,
    };
    
    const [log] = await db.insert(auditLogsEnhanced).values(newLog).returning();
    
    // Actualizar último hash
    this.lastHash.set(data.organizationId, hash);
    
    return log.id;
  }
  
  /**
   * Registra creación de recurso
   */
  static async logCreate(
    organizationId: string,
    resourceType: string,
    resourceId: string,
    newValue: Record<string, unknown>,
    userId?: string,
    ipAddress?: string
  ): Promise<string> {
    return this.log({
      organizationId,
      userId,
      action: 'CREATE',
      resourceType,
      resourceId,
      newValue,
      ipAddress,
      securityLevel: 'info',
    });
  }
  
  /**
   * Registra actualización de recurso
   */
  static async logUpdate(
    organizationId: string,
    resourceType: string,
    resourceId: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    userId?: string,
    ipAddress?: string
  ): Promise<string> {
    // Determinar si es cambio crítico
    const criticalFields = ['totalAmount', 'status', 'paymentStatus', 'haciendaKey'];
    const hasCriticalChange = Object.keys(newValue).some(key => 
      criticalFields.includes(key) && oldValue[key] !== newValue[key]
    );
    
    return this.log({
      organizationId,
      userId,
      action: 'UPDATE',
      resourceType,
      resourceId,
      oldValue,
      newValue,
      ipAddress,
      securityLevel: hasCriticalChange ? 'audit' : 'info',
    });
  }
  
  /**
   * Registra eliminación de recurso (soft delete)
   */
  static async logDelete(
    organizationId: string,
    resourceType: string,
    resourceId: string,
    oldValue: Record<string, unknown>,
    userId?: string,
    ipAddress?: string
  ): Promise<string> {
    return this.log({
      organizationId,
      userId,
      action: 'DELETE',
      resourceType,
      resourceId,
      oldValue,
      ipAddress,
      securityLevel: 'warning',
    });
  }
  
  /**
   * Registra inicio de sesión
   */
  static async logLogin(
    organizationId: string,
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.log({
      organizationId,
      userId,
      action: success ? 'LOGIN' : 'REJECT',
      resourceType: 'user',
      resourceId: userId,
      newValue: { success, timestamp: Date.now() },
      ipAddress,
      userAgent,
      securityLevel: success ? 'info' : 'warning',
    });
  }
  
  /**
   * Registra decisión de IA (ISO 42001)
   */
  static async logAIDecision(
    organizationId: string,
    aiDecisionId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    userId?: string
  ): Promise<string> {
    return this.log({
      organizationId,
      userId,
      action: action as ActionType,
      resourceType,
      resourceId,
      isAutomated: true,
      aiDecisionId,
      securityLevel: 'audit',
    });
  }
  
  /**
   * Obtiene logs de auditoría filtrados
   */
  static async getLogs(filters: {
    organizationId: string;
    fromDate?: number;
    toDate?: number;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    action?: ActionType;
    securityLevel?: SecurityLevel;
    limit?: number;
    offset?: number;
  }) {
    const { and, eq, gte, lte } = require('drizzle-orm');
    
    const conditions = [eq(auditLogsEnhanced.organizationId, filters.organizationId)];
    
    if (filters.fromDate) {
      conditions.push(gte(auditLogsEnhanced.createdAt, filters.fromDate));
    }
    
    if (filters.toDate) {
      conditions.push(lte(auditLogsEnhanced.createdAt, filters.toDate));
    }
    
    if (filters.userId) {
      conditions.push(eq(auditLogsEnhanced.userId, filters.userId));
    }
    
    if (filters.resourceType) {
      conditions.push(eq(auditLogsEnhanced.resourceType, filters.resourceType));
    }
    
    if (filters.resourceId) {
      conditions.push(eq(auditLogsEnhanced.resourceId, filters.resourceId));
    }
    
    if (filters.action) {
      conditions.push(eq(auditLogsEnhanced.action, filters.action));
    }
    
    if (filters.securityLevel) {
      conditions.push(eq(auditLogsEnhanced.securityLevel, filters.securityLevel));
    }
    
    const logs = await db.query.auditLogsEnhanced.findMany({
      where: and(...conditions),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    });
    
    return logs;
  }
  
  /**
   * Verifica integridad de un registro
   */
  static async verifyIntegrity(logId: string): Promise<{ valid: boolean; message: string }> {
    const log = await db.query.auditLogsEnhanced.findFirst({
      where: eq(auditLogsEnhanced.id, logId),
    });
    
    if (!log) {
      return { valid: false, message: 'Registro no encontrado' };
    }
    
    // Recrear hash y comparar
    const hashInput = JSON.stringify({
      timestamp: log.createdAt,
      organizationId: log.organizationId,
      userId: log.userId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : undefined,
      newValue: log.newValue ? JSON.parse(log.newValue) : undefined,
    });
    
    const expectedHash = this.createHash(hashInput);
    
    if (log.hash !== expectedHash) {
      return { valid: false, message: 'Hash inválido - Registro pudo ser alterado' };
    }
    
    // Verificar cadena de hashes
    if (log.previousHash) {
      const previousLog = await db.query.auditLogsEnhanced.findFirst({
        where: eq(auditLogsEnhanced.organizationId, log.organizationId),
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        offset: 1, // El anterior en la cadena
      });
      
      if (previousLog && previousLog.hash !== log.previousHash) {
        return { valid: false, message: 'Cadena de hashes rota' };
      }
    }
    
    return { valid: true, message: 'Registro íntegro' };
  }
  
  /**
   * Determina nivel de seguridad según acción
   */
  private static determineSecurityLevel(action: ActionType, resourceType: string): SecurityLevel {
    // Acciones críticas
    if (['DELETE', 'REJECT'].includes(action)) {
      return 'warning';
    }
    
    // Recursos financieros son críticos
    if (['sale', 'expense', 'payment', 'journal_entry'].includes(resourceType)) {
      if (['CREATE', 'UPDATE', 'APPROVE'].includes(action)) {
        return 'audit';
      }
    }
    
    // Login fallido
    if (action === 'REJECT' && resourceType === 'user') {
      return 'warning';
    }
    
    // Exportación de datos sensibles
    if (action === 'EXPORT') {
      return 'audit';
    }
    
    return 'info';
  }
  
  /**
   * Crea hash SHA-256
   */
  private static createHash(data: string): string {
    // Nota: En Cloudflare Workers, usamos Web Crypto API
    // Esta es una implementación simplificada
    return createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Obtiene último hash de la organización
   */
  private static async getLastHash(organizationId: string): Promise<string | null> {
    // Intentar obtener de cache
    if (this.lastHash.has(organizationId)) {
      return this.lastHash.get(organizationId)!;
    }
    
    // Obtener de DB
    const lastLog = await db.query.auditLogsEnhanced.findFirst({
      where: eq(auditLogsEnhanced.organizationId, organizationId),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });
    
    return lastLog?.hash || null;
  }
  
  /**
   * Exporta reporte de auditoría (para externos)
   */
  static async exportAuditReport(
    organizationId: string,
    fromDate: number,
    toDate: number,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs = await this.getLogs({
      organizationId,
      fromDate,
      toDate,
      limit: 10000,
    });
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    
    // CSV
    const headers = ['Fecha', 'Usuario', 'Acción', 'Recurso', 'ID Recurso', 'Nivel Seguridad', 'IP'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.userId || 'Sistema',
      log.action,
      log.resourceType,
      log.resourceId || '-',
      log.securityLevel,
      log.ipAddress || '-',
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export default AuditLogger;
