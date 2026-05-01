import { error, type RequestEvent } from '@sveltejs/kit';
import { getRoleMatrix, canAccessModule } from '../config/roles-matrix';
import type { UserRole, IndustryType } from '../db/schema';

/**
 * Middleware para proteger rutas basado en rol e industria
 * Uso: load: async (event) => { protectRoute(event, 'pos', 'read'); ... }
 */
export async function protectRoute(
  event: RequestEvent,
  module: string,
  action: 'read' | 'write' | 'delete' | 'export' = 'read'
) {
  const session = event.locals.session;
  
  if (!session || !session.user) {
    throw error(401, 'No autorizado');
  }

  const { role, organization } = session.user;
  
  if (!organization) {
    throw error(403, 'Usuario sin organización asignada');
  }

  const industry = organization.industryType as IndustryType;
  
  // Verificar permisos usando la matriz
  const hasPermission = canAccessModule(role as UserRole, industry, module, action);
  
  if (!hasPermission) {
    throw error(403, `Acceso denegado: No tienes permisos de ${action} para el módulo ${module}`);
  }

  return true;
}

/**
 * Helper para verificar permisos sin lanzar error (para UI condicional)
 */
export function checkPermission(
  session: any,
  module: string,
  action: 'read' | 'write' | 'delete' | 'export' = 'read'
): boolean {
  if (!session || !session.user) return false;
  
  const { role, organization } = session.user;
  if (!organization) return false;

  const industry = organization.industryType as IndustryType;
  return canAccessModule(role as UserRole, industry, module, action);
}
