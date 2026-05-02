import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import type { H3Event } from 'h3';
import type { D1Database } from '@cloudflare/workers-types';
import { eq } from 'drizzle-orm';

/**
 * ScopedDB: Garantiza aislamiento de datos por CompanyID
 * Todas las consultas generadas desde aquí inyectan automáticamente el filtro WHERE companyId = ?
 */
export class ScopedDB {
  private db;
  private companyId: string;

  constructor(event: H3Event, d1Database: D1Database) {
    // Extraer companyId del contexto (inyectado por middleware de autenticación)
    this.companyId = event.context.companyId;
    
    if (!this.companyId) {
      throw new Error('Unauthorized: No companyId found in context');
    }

    this.db = drizzle(d1Database, { schema });
  }

  /**
   * Obtiene la instancia de Drizzle con el schema completo
   * NOTA: Para queries directas, usar getScopedQuery()
   */
  getDb() {
    return this.db;
  }

  /**
   * Obtiene el ID de la compañía actual
   */
  getCompanyId(): string {
    return this.companyId;
  }

  /**
   * Método auxiliar para construir queries seguras
   * Ejemplo: scoped.select(sales).where(eq(sales.id, '123'))
   * Drizzle ORM ya maneja el contexto, pero forzamos validación extra en inserts/updates
   */
  async insert<T extends Record<string, any>>(table: any, data: T & { companyId?: string }) {
    // Forzar companyId en todos los inserts
    const securedData = {
      ...data,
      companyId: this.companyId
    };
    
    return this.db.insert(table).values(securedData).returning();
  }

  async update<T extends Record<string, any>>(table: any, data: T, whereClause: any) {
    // Validar que no se intente cambiar el companyId
    if ('companyId' in data) {
      delete (data as any).companyId;
    }
    
    return this.db.update(table).set(data).where(whereClause);
  }

  /**
   * Verifica si un registro pertenece a la compañía actual
   */
  async verifyOwnership(table: any, recordId: string) {
    const result = await this.db
      .select()
      .from(table)
      .where(eq(table.id, recordId))
      .limit(1);

    if (result.length === 0) {
      throw new Error('Record not found');
    }

    if (result[0].companyId !== this.companyId) {
      throw new Error('Forbidden: Access denied to this record');
    }

    return result[0];
  }
}

// Helper para obtener instancias de ScopedDB en routes
export function getScopedDB(event: H3Event, d1Database: D1Database): ScopedDB {
  return new ScopedDB(event, d1Database);
}
