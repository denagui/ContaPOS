# RBAC Security Model - ContaPOS/Kairux

## 📋 Overview

Sistema de **Role-Based Access Control (RBAC)** enterprise-grade para gestión granular de permisos en entorno multi-tenant.

---

## 🏗️ Arquitectura

### Tablas del Schema

```sql
users → userRoles → roles → rolePermissions → permissions
```

#### 1. **users** (Usuarios)
- `id`, `companyId`, `username`, `email`, `passwordHash`
- `active`, `createdAt`, `updatedAt`, `lastLoginAt`
- ❌ **REMOVIDO**: Campo `role` (ahora usa sistema de roles múltiple)

#### 2. **roles** (Roles)
- `id`, `companyId`, `name`, `description`
- `isSystem` (roles del sistema no borrables)
- Ejemplos: `admin`, `manager`, `cashier`, `accountant`

#### 3. **permissions** (Permisos)
- `id`, `name` (único), `category`, `description`
- Formato: `{recurso}.{acción}` (ej: `sales.create`)
- Categorías: `sales`, `inventory`, `contacts`, `expenses`, `accounting`, `reports`, `settings`, `users`

#### 4. **rolePermissions** (Asignación Rol→Permiso)
- `roleId`, `permissionId`, `grantedBy`, `createdAt`
- Relación muchos-a-muchos

#### 5. **userRoles** (Asignación Usuario→Rol)
- `userId`, `roleId`, `assignedBy`, `createdAt`, `expiresAt`
- Soporte para roles temporales con expiración

---

## 🔐 Roles Predeterminados

| Rol | Descripción | Permisos Clave |
|-----|-------------|----------------|
| **admin** | Administrador completo | Todos los permisos (`*`) |
| **manager** | Gerente operativo | Ventas, inventario, reportes, aprobación de gastos |
| **cashier** | Cajero | Solo ventas y consulta de inventario |
| **accountant** | Contador | Contabilidad, reportes fiscales, exportación |

---

## 📜 Lista de Permisos (30+)

### Ventas (`sales.*`)
- `sales.view` - Ver ventas
- `sales.create` - Crear ventas
- `sales.edit` - Editar ventas
- `sales.delete` - Eliminar ventas
- `sales.refund` - Realizar devoluciones

### Inventario (`inventory.*`)
- `inventory.view` - Ver inventario
- `inventory.create` - Crear productos
- `inventory.edit` - Editar productos
- `inventory.delete` - Eliminar productos
- `inventory.adjust` - Ajustar stock

### Contactos (`contacts.*`)
- `contacts.view`, `contacts.create`, `contacts.edit`, `contacts.delete`

### Gastos (`expenses.*`)
- `expenses.view`, `expenses.create`, `expenses.edit`, `expenses.delete`

### Contabilidad (`accounting.*`)
- `accounting.view` - Ver contabilidad
- `accounting.close_period` - Cerrar período contable
- `accounting.export` - Exportar reportes

### Reportes (`reports.*`)
- `reports.view` - Ver reportes
- `reports.export` - Exportar reportes
- `reports.fiscal` - Reportes fiscales (Hacienda)

### Configuración (`settings.*`)
- `settings.view`, `settings.edit`, `settings.billing`

### Usuarios (`users.*`)
- `users.view`, `users.create`, `users.edit`, `users.delete`
- `roles.manage` - Gestionar roles y permisos

---

## 🚀 Uso del Motor RBAC

### Inicialización

```typescript
import { getRBACEngine } from '$lib/server/services/rbac-engine';

const rbac = getRBACEngine(event, d1Database);
```

### Verificar Permisos

```typescript
// Verificar un permiso específico
const canDelete = await rbac.hasPermission('sales.delete');

// Verificar múltiples permisos (basta con uno)
const canManage = await rbac.hasAnyPermission(['sales.edit', 'sales.delete']);

// Verificar múltiples permisos (requiere todos)
const canFullAccess = await rbac.hasAnyPermission(
  ['sales.view', 'sales.edit', 'sales.delete'],
  undefined,
  true // requireAll
);

// Lanzar error si no tiene permiso
await rbac.requirePermission('accounting.close_period');
// → Lanza: "Forbidden: User lacks required permission 'accounting.close_period'"
```

### Obtener Roles y Permisos de Usuario

```typescript
const roles = await rbac.getUserRoles(userId);
// → [{ id, name, description }, ...]

const permissions = await rbac.getUserPermissions(userId);
// → [{ id, name, category, description }, ...]
```

### Asignar/Remover Roles

```typescript
// Asignar rol
await rbac.assignRole(userId, roleId, currentUserId);

// Remover rol
await rbac.removeRole(userId, roleId);
```

### Inicializar Sistema

```typescript
// Para nueva compañía
await rbac.createDefaultRoles(companyId);
await rbac.createDefaultPermissions();
await rbac.assignDefaultPermissionsToRoles();
```

---

## 🔒 Seguridad Multi-Tenant

### ScopedDB Integration

Todas las consultas de RBAC están protegidas por `companyId`:

```typescript
// El constructor valida automáticamente
constructor(event: H3Event, d1Database: D1Database) {
  this.companyId = event.context.companyId;
  this.userId = event.context.userId;
  
  if (!this.companyId || !this.userId) {
    throw new Error('Unauthorized: Missing companyId or userId');
  }
}
```

### Aislamiento de Datos

- Los roles son específicos por compañía (`companyId`)
- Un usuario puede tener roles diferentes en compañías distintas
- Los permisos no se cruzan entre tenants

---

## 📊 Casos de Uso

### 1. Proteger Ruta de Eliminación

```typescript
// src/routes/api/sales/[id]/+server.ts
export async function DELETE({ params, locals, event }) {
  const rbac = getRBACEngine(event, locals.db);
  
  // Verificar permiso antes de ejecutar
  await rbac.requirePermission('sales.delete');
  
  // Proceder con eliminación...
}
```

### 2. UI Condicional

```svelte
<script lang="ts">
  let canEditSales = false;
  
  onMount(async () => {
    const rbac = getRBACEngine(event, db);
    canEditSales = await rbac.hasPermission('sales.edit');
  });
</script>

{#if canEditSales}
  <button>Edit Sale</button>
{/if}
```

### 3. Roles Temporales

```typescript
// Asignar rol con expiración (ej: auditor temporal)
await db.insert(schema.userRoles).values({
  userId,
  roleId,
  assignedBy: adminId,
  expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 días
});
```

---

## 🔄 Migración desde Sistema Anterior

### Antes (Campo Único)

```typescript
// Schema antiguo
users.role: 'admin' | 'manager' | 'cashier'
```

### Después (Múltiples Roles)

```typescript
// Nuevo schema
userRoles: [
  { userId, roleId: 'admin', expiresAt: null },
  { userId, roleId: 'accountant', expiresAt: null }
]
```

### Script de Migración

```sql
-- Migrar usuarios existentes a nuevo sistema
INSERT INTO user_roles (user_id, role_id, assigned_by, created_at)
SELECT 
  u.id,
  r.id,
  u.id,
  u.created_at
FROM users u
JOIN roles r ON r.name = u.old_role_column
WHERE u.old_role_column IS NOT NULL;
```

---

## 🎯 Mejores Prácticas

### 1. Principio de Menor Privilegio
- Asignar solo los permisos necesarios
- Usar roles específicos en lugar de `admin` por defecto

### 2. Auditoría
- Registrar quién asignó cada rol (`assignedBy`)
- Revisar periódicamente asignaciones de roles

### 3. Roles Temporales
- Usar `expiresAt` para accesos temporales
- Automatizar limpieza de roles expirados

### 4. Validación en Backend
- **Nunca** confiar solo en validación frontend
- Siempre verificar permisos en cada endpoint

### 5. Cache de Permisos
```typescript
// Opcional: Cachear permisos por 5 minutos
const cacheKey = `permissions:${userId}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const permissions = await getUserPermissions(userId);
await cache.set(cacheKey, permissions, 300);
```

---

## 📈 Roadmap

### Fase 1 (✅ Completado)
- [x] Schema de tablas RBAC
- [x] Motor RBACEngine básico
- [x] Roles y permisos predeterminados
- [x] Integración con ScopedDB

### Fase 2 (Pendiente)
- [ ] UI de gestión de roles (`/settings/roles`)
- [ ] UI de asignación de roles (`/settings/users`)
- [ ] Middleware global para proteger rutas
- [ ] Logs de auditoría para cambios de permisos

### Fase 3 (Futuro)
- [ ] Roles jerárquicos (herencia de permisos)
- [ ] Permisos condicionales (por sucursal, monto, etc.)
- [ ] Aprobación de dos factores para acciones críticas
- [ ] Integración con SSO/LDAP

---

## 🔍 Referencias

- **ISO 27001**: Control de acceso lógico
- **OWASP**: Authorization Cheat Sheet
- **NIST**: Role Based Access Control (RBAC) Standard

---

**Estado**: ✅ Implementado y en producción  
**Última actualización**: 2025-01-01  
**Versión**: 1.0.0
