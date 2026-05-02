import type { IndustryType } from '../drizzle/schema';

// Tipos para roles (definidos inline ya que no hay un tipo exportado en el schema)
type UserRole = 'owner' | 'admin' | 'cashier' | 'inventory_manager' | 'accountant';

export interface ModulePermission {
  read: boolean;
  write: boolean;
  delete: boolean;
  export: boolean;
}

export interface RoleMatrix {
  [key: string]: {
    [module: string]: ModulePermission;
  };
}

// Matriz de permisos por rol e industria
export const getRoleMatrix = (industry: IndustryType): RoleMatrix => {
  const baseMatrix: RoleMatrix = {
    owner: {
      dashboard: { read: true, write: true, delete: true, export: true },
      pos: { read: true, write: true, delete: true, export: true },
      inventory: { read: true, write: true, delete: true, export: true },
      contacts: { read: true, write: true, delete: true, export: true },
      expenses: { read: true, write: true, delete: true, export: true },
      sales: { read: true, write: true, delete: true, export: true },
      accounting: { read: true, write: true, delete: true, export: true },
      settings: { read: true, write: true, delete: false, export: true },
      users: { read: true, write: true, delete: true, export: true },
    },
    admin: {
      dashboard: { read: true, write: true, delete: true, export: true },
      pos: { read: true, write: true, delete: true, export: true },
      inventory: { read: true, write: true, delete: true, export: true },
      contacts: { read: true, write: true, delete: true, export: true },
      expenses: { read: true, write: true, delete: true, export: true },
      sales: { read: true, write: true, delete: true, export: true },
      accounting: { read: true, write: false, delete: false, export: true },
      settings: { read: true, write: true, delete: false, export: true },
      users: { read: true, write: true, delete: false, export: true },
    },
    cashier: {
      dashboard: { read: true, write: false, delete: false, export: false },
      pos: { read: true, write: true, delete: false, export: false },
      inventory: { read: true, write: false, delete: false, export: false },
      contacts: { read: true, write: false, delete: false, export: false },
      expenses: { read: false, write: false, delete: false, export: false },
      sales: { read: true, write: false, delete: false, export: false },
      accounting: { read: false, write: false, delete: false, export: false },
      settings: { read: false, write: false, delete: false, export: false },
      users: { read: false, write: false, delete: false, export: false },
    },
    accountant: {
      dashboard: { read: true, write: false, delete: false, export: true },
      pos: { read: false, write: false, delete: false, export: false },
      inventory: { read: true, write: false, delete: false, export: true },
      contacts: { read: true, write: false, delete: false, export: true },
      expenses: { read: true, write: false, delete: false, export: true },
      sales: { read: true, write: false, delete: false, export: true },
      accounting: { read: true, write: false, delete: false, export: true },
      settings: { read: true, write: false, delete: false, export: false },
      users: { read: false, write: false, delete: false, export: false },
    },
  };

  // Extensiones específicas por industria
  if (industry === 'restaurant') {
    baseMatrix.owner.tables = { read: true, write: true, delete: true, export: true };
    baseMatrix.admin.tables = { read: true, write: true, delete: true, export: true };
    baseMatrix.cashier.tables = { read: true, write: false, delete: false, export: false };
    baseMatrix.accountant.tables = { read: true, write: false, delete: false, export: true };
    
    // Waiter role específico para restaurantes
    baseMatrix.waiter = {
      dashboard: { read: true, write: false, delete: false, export: false },
      tables: { read: true, write: true, delete: false, export: false },
      pos: { read: true, write: true, delete: false, export: false },
      inventory: { read: false, write: false, delete: false, export: false },
      contacts: { read: false, write: false, delete: false, export: false },
      expenses: { read: false, write: false, delete: false, export: false },
      sales: { read: true, write: false, delete: false, export: false },
      accounting: { read: false, write: false, delete: false, export: false },
      settings: { read: false, write: false, delete: false, export: false },
      users: { read: false, write: false, delete: false, export: false },
    };
  }

  if (industry === 'utility') {
    baseMatrix.owner.meters = { read: true, write: true, delete: true, export: true };
    baseMatrix.admin.meters = { read: true, write: true, delete: true, export: true };
    baseMatrix.cashier.meters = { read: true, write: false, delete: false, export: false };
    baseMatrix.accountant.meters = { read: true, write: false, delete: false, export: true };
    
    // Reader role específico para ASADA
    baseMatrix.reader = {
      dashboard: { read: true, write: false, delete: false, export: false },
      meters: { read: true, write: true, delete: false, export: false },
      readings: { read: true, write: true, delete: false, export: false },
      pos: { read: false, write: false, delete: false, export: false },
      inventory: { read: false, write: false, delete: false, export: false },
      contacts: { read: true, write: false, delete: false, export: false },
      expenses: { read: false, write: false, delete: false, export: false },
      sales: { read: true, write: false, delete: false, export: false },
      accounting: { read: false, write: false, delete: false, export: false },
      settings: { read: false, write: false, delete: false, export: false },
      users: { read: false, write: false, delete: false, export: false },
    };
  }

  if (industry === 'services') {
    baseMatrix.owner.cases = { read: true, write: true, delete: true, export: true };
    baseMatrix.admin.cases = { read: true, write: true, delete: true, export: true };
    baseMatrix.cashier.cases = { read: true, write: false, delete: false, export: false };
    baseMatrix.accountant.cases = { read: true, write: false, delete: false, export: true };
  }

  return baseMatrix;
};

export const canAccessModule = (
  role: UserRole,
  industry: IndustryType,
  module: string,
  action: 'read' | 'write' | 'delete' | 'export'
): boolean => {
  const matrix = getRoleMatrix(industry);
  const rolePermissions = matrix[role];
  
  if (!rolePermissions) return false;
  
  const modulePermissions = rolePermissions[module];
  return modulePermissions ? modulePermissions[action] : false;
};
