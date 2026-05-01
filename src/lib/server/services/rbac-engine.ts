import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import type { H3Event } from 'h3';

/**
 * RBAC Engine: Motor de control de acceso basado en roles
 * Verifica permisos antes de ejecutar acciones críticas
 */
export class RBACEngine {
  private db;
  private companyId: string;
  private userId: string;

  constructor(event: H3Event, d1Database: D1Database) {
    this.companyId = event.context.companyId;
    this.userId = event.context.userId;
    
    if (!this.companyId || !this.userId) {
      throw new Error('Unauthorized: Missing companyId or userId in context');
    }

    this.db = drizzle(d1Database, { schema });
  }

  /**
   * Obtiene todos los roles de un usuario
   */
  async getUserRoles(userId: string = this.userId) {
    const userRoles = await this.db
      .select({
        roleId: schema.userRoles.roleId,
        roleName: schema.roles.name,
        roleDescription: schema.roles.description,
      })
      .from(schema.userRoles)
      .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.roles.companyId, this.companyId),
          // Verificar que el rol no haya expirado
          eq(schema.userRoles.expiresAt, null) // Sin expiración o verificar fecha
        )
      );

    return userRoles.map(ur => ({
      id: ur.roleId,
      name: ur.roleName,
      description: ur.roleDescription,
    }));
  }

  /**
   * Obtiene todos los permisos de un usuario (a través de sus roles)
   */
  async getUserPermissions(userId: string = this.userId) {
    const permissions = await this.db
      .selectDistinct({
        permissionId: schema.permissions.id,
        permissionName: schema.permissions.name,
        permissionCategory: schema.permissions.category,
        permissionDescription: schema.permissions.description,
      })
      .from(schema.userRoles)
      .innerJoin(schema.rolePermissions, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.expiresAt, null)
        )
      );

    return permissions.map(p => ({
      id: p.permissionId,
      name: p.permissionName,
      category: p.permissionCategory,
      description: p.permissionDescription,
    }));
  }

  /**
   * Verifica si un usuario tiene un permiso específico
   * @param permission Nombre del permiso (ej: 'sales.create', 'inventory.delete')
   */
  async hasPermission(permission: string, userId: string = this.userId): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.name === permission);
  }

  /**
   * Verifica si un usuario tiene algún permiso de una lista
   * @param permissions Lista de nombres de permisos
   * @param requireAll Si true, debe tener TODOS los permisos; si false, basta con uno
   */
  async hasAnyPermission(
    permissions: string[], 
    userId: string = this.userId,
    requireAll: boolean = false
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    const userPermNames = userPermissions.map(p => p.name);

    if (requireAll) {
      return permissions.every(p => userPermNames.includes(p));
    } else {
      return permissions.some(p => userPermNames.includes(p));
    }
  }

  /**
   * Middleware/Helper para proteger rutas
   * Lanza error si no tiene el permiso requerido
   */
  async requirePermission(permission: string, userId: string = this.userId) {
    const hasPerm = await this.hasPermission(permission, userId);
    if (!hasPerm) {
      throw new Error(`Forbidden: User lacks required permission '${permission}'`);
    }
  }

  /**
   * Asigna un rol a un usuario
   */
  async assignRole(userId: string, roleId: string, assignedBy: string) {
    // Verificar que el rol pertenece a la misma compañía
    const role = await this.db
      .select()
      .from(schema.roles)
      .where(and(eq(schema.roles.id, roleId), eq(schema.roles.companyId, this.companyId)))
      .limit(1);

    if (role.length === 0) {
      throw new Error('Role not found or does not belong to this company');
    }

    // Insertar asignación
    await this.db.insert(schema.userRoles).values({
      userId,
      roleId,
      assignedBy,
    });

    return { success: true };
  }

  /**
   * Remueve un rol de un usuario
   */
  async removeRole(userId: string, roleId: string) {
    await this.db
      .delete(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.roleId, roleId)
        )
      );

    return { success: true };
  }

  /**
   * Crea un rol predeterminado para una compañía nueva
   */
  async createDefaultRoles(companyId: string) {
    const defaultRoles = [
      { name: 'admin', description: 'Administrador completo del sistema', isSystem: 1 },
      { name: 'manager', description: 'Gerente con acceso a reportes y aprobaciones', isSystem: 1 },
      { name: 'cashier', description: 'Cajero con acceso limitado a ventas', isSystem: 1 },
      { name: 'accountant', description: 'Contador con acceso a contabilidad y reportes fiscales', isSystem: 1 },
    ];

    for (const role of defaultRoles) {
      const existing = await this.db
        .select()
        .from(schema.roles)
        .where(and(eq(schema.roles.name, role.name), eq(schema.roles.companyId, companyId)))
        .limit(1);

      if (existing.length === 0) {
        await this.db.insert(schema.roles).values({
          ...role,
          companyId,
        });
      }
    }
  }

  /**
   * Crea permisos predeterminados del sistema
   */
  async createDefaultPermissions() {
    const defaultPermissions = [
      // VENTAS
      { name: 'sales.view', category: 'sales', description: 'Ver ventas' },
      { name: 'sales.create', category: 'sales', description: 'Crear ventas' },
      { name: 'sales.edit', category: 'sales', description: 'Editar ventas' },
      { name: 'sales.delete', category: 'sales', description: 'Eliminar ventas' },
      { name: 'sales.refund', category: 'sales', description: 'Realizar devoluciones' },
      
      // INVENTARIO
      { name: 'inventory.view', category: 'inventory', description: 'Ver inventario' },
      { name: 'inventory.create', category: 'inventory', description: 'Crear productos' },
      { name: 'inventory.edit', category: 'inventory', description: 'Editar productos' },
      { name: 'inventory.delete', category: 'inventory', description: 'Eliminar productos' },
      { name: 'inventory.adjust', category: 'inventory', description: 'Ajustar stock' },
      
      // CONTACTOS
      { name: 'contacts.view', category: 'contacts', description: 'Ver contactos' },
      { name: 'contacts.create', category: 'contacts', description: 'Crear contactos' },
      { name: 'contacts.edit', category: 'contacts', description: 'Editar contactos' },
      { name: 'contacts.delete', category: 'contacts', description: 'Eliminar contactos' },
      
      // GASTOS
      { name: 'expenses.view', category: 'expenses', description: 'Ver gastos' },
      { name: 'expenses.create', category: 'expenses', description: 'Crear gastos' },
      { name: 'expenses.edit', category: 'expenses', description: 'Editar gastos' },
      { name: 'expenses.delete', category: 'expenses', description: 'Eliminar gastos' },
      
      // CONTABILIDAD
      { name: 'accounting.view', category: 'accounting', description: 'Ver contabilidad' },
      { name: 'accounting.close_period', category: 'accounting', description: 'Cerrar período contable' },
      { name: 'accounting.export', category: 'accounting', description: 'Exportar reportes contables' },
      
      // REPORTES
      { name: 'reports.view', category: 'reports', description: 'Ver reportes' },
      { name: 'reports.export', category: 'reports', description: 'Exportar reportes' },
      { name: 'reports.fiscal', category: 'reports', description: 'Ver reportes fiscales' },
      
      // CONFIGURACIÓN
      { name: 'settings.view', category: 'settings', description: 'Ver configuración' },
      { name: 'settings.edit', category: 'settings', description: 'Editar configuración' },
      { name: 'settings.billing', category: 'settings', description: 'Configurar facturación electrónica' },
      
      // USUARIOS Y ROLES
      { name: 'users.view', category: 'users', description: 'Ver usuarios' },
      { name: 'users.create', category: 'users', description: 'Crear usuarios' },
      { name: 'users.edit', category: 'users', description: 'Editar usuarios' },
      { name: 'users.delete', category: 'users', description: 'Eliminar usuarios' },
      { name: 'roles.manage', category: 'users', description: 'Gestionar roles y permisos' },
    ];

    for (const perm of defaultPermissions) {
      const existing = await this.db
        .select()
        .from(schema.permissions)
        .where(eq(schema.permissions.name, perm.name))
        .limit(1);

      if (existing.length === 0) {
        await this.db.insert(schema.permissions).values(perm);
      }
    }
  }

  /**
   * Asigna permisos predeterminados a roles del sistema
   */
  async assignDefaultPermissionsToRoles() {
    // Mapeo de roles a permisos
    const rolePermissionsMap: Record<string, string[]> = {
      admin: ['*'], // Todos los permisos
      manager: [
        'sales.view', 'sales.create', 'sales.edit',
        'inventory.view', 'inventory.create', 'inventory.edit',
        'contacts.view', 'contacts.create', 'contacts.edit',
        'expenses.view', 'expenses.create', 'expenses.edit',
        'reports.view', 'reports.export',
        'users.view',
      ],
      cashier: [
        'sales.view', 'sales.create',
        'inventory.view',
        'contacts.view',
        'expenses.view',
      ],
      accountant: [
        'sales.view',
        'inventory.view',
        'contacts.view',
        'expenses.view',
        'accounting.view', 'accounting.export',
        'reports.view', 'reports.export', 'reports.fiscal',
      ],
    };

    const allPermissions = await this.db.select().from(schema.permissions);
    const permMap = new Map(allPermissions.map(p => [p.name, p.id]));

    for (const [roleName, permNames] of Object.entries(rolePermissionsMap)) {
      const role = await this.db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, roleName))
        .limit(1);

      if (role.length === 0) continue;

      const roleId = role[0].id;

      for (const permName of permNames) {
        if (permName === '*') {
          // Asignar todos los permisos
          for (const [name, permId] of permMap.entries()) {
            await this.db.insert(schema.rolePermissions).values({
              roleId,
              permissionId: permId,
            }).onConflictDoNothing();
          }
        } else {
          const permId = permMap.get(permName);
          if (permId) {
            await this.db.insert(schema.rolePermissions).values({
              roleId,
              permissionId: permId,
            }).onConflictDoNothing();
          }
        }
      }
    }
  }
}

/**
 * Helper para obtener instancia de RBACEngine
 */
export function getRBACEngine(event: H3Event, d1Database: D1Database): RBACEngine {
  return new RBACEngine(event, d1Database);
}
