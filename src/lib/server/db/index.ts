// Re-export de Drizzle ORM para uso en la aplicación
export { drizzle } from 'drizzle-orm/d1';
export type { DrizzleD1Database } from 'drizzle-orm/d1';

// Exportar esquema completo
export * from '../../drizzle/schema';

// Exportar funciones de conexión
export { createDb, getDb } from '../../drizzle/db';
export type { Database } from '../../drizzle/db';

// Export default db instance for services that expect it
// This will be initialized at runtime with the proper D1 database
export const db: any = null; // Placeholder - actual db instance comes from platform context

/**
 * Helper para obtener el scope (organización y sucursal) del contexto
 * Esto garantiza el aislamiento multi-tenant a nivel de aplicación
 */
export function getScope(context: any) {
  const organizationId = context.user?.organization_id;
  const branchId = context.user?.branch_id || context.user?.default_branch_id;
  
  if (!organizationId) {
    throw new Error('No organization context found');
  }

  return { organizationId, branchId };
}

/**
 * Middleware para filtrar consultas por organización
 * Uso: db.select().from(table).where(eq(table.organizationId, scope.organizationId))
 */
export function applyScope<T extends { organization_id: string | number }>(
  query: any,
  scope: { organizationId: string | number },
  field: string = 'organization_id'
) {
  return query.where((c: any) => c[field] === scope.organizationId);
}
