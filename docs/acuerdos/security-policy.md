# 🔒 Política de Seguridad y Cumplimiento

## 1. Control de Acceso y Roles (RBAC)

### Principio de Menor Privilegio
Cada usuario solo tiene acceso a los módulos estrictamente necesarios para su función.

### Matriz de Roles por Industria
| Rol | Retail | Restaurante | ASADA | Servicios |
|-----|--------|-------------|-------|-----------|
| **Owner** | Acceso Total | Acceso Total | Acceso Total | Acceso Total |
| **Admin** | Inventario, Ventas, Reportes | Mesas, Recetas, Caja | Lecturas, Cortes | Expedientes, Facturación |
| **Cashier** | Solo POS, Mis Ventas | Solo Comandas, Cobro | Solo Cobro | Solo Registro Horas |
| **Waiter** | N/A | Pedidos, Mesas | N/A | N/A |
| **Accountant** | Solo Lectura Financiera | Solo Costos, Recetas | Solo Consumo, Multas | Solo Libros Contables |
| **MeterReader** | N/A | N/A | Solo Lectura Medidores | N/A |

### Implementación Técnica
- **Middleware Server-Side**: `requireRole()` verifica permisos antes de ejecutar cualquier acción.
- **UI Adaptativa**: Los menús y botones se ocultan dinámicamente si el usuario no tiene permiso.
- **Auditoría**: Cada intento de acceso denegado se registra en `audit_logs`.

## 2. Seguridad de Datos

### Encriptación
- **En Tránsito**: TLS 1.3 obligatorio para todas las conexiones (HTTPS).
- **En Reposo**: Base de datos D1 encriptada por defecto en infraestructura de Cloudflare.
- **Contraseñas**: Hashing con Argon2id (si se usan credenciales tradicionales).
- **Tokens de Sesión**: Almacenados en cookies HttpOnly + Secure + SameSite=Strict.

### Aislamiento Multi-Tenant (Scoped)
- **Estrategia**: Single Database, Logical Isolation.
- **Implementación**: Todas las consultas incluyen automáticamente `WHERE organization_id = ?`.
- **Validación**: El middleware `getScope()` asegura que ningún usuario pueda acceder a datos de otra organización mediante manipulación de IDs.

## 3. Cumplimiento Fiscal (Costa Rica)

### Facturación Electrónica
- **Clave Única**: Generación de clave de 50 dígitos conforme a norma técnica de Hacienda.
- **Código CABYS**: Validación estricta de 13 dígitos en todos los productos/servicios.
- **XML**: Estructura base lista para firma digital y envío a MH (Módulo futuro).
- **Retención**: Cálculo automático de retenciones si aplica (régimen simplificado vs ordinario).

### Impuestos (IVA)
- Soporte nativo para tasas: 0%, 4%, 8%, 13%.
- Desglose explícito en tickets y reportes.
- Redondeo correcto según normativa (método de los 5 centavos).

### Libros Contables
- Generación automática de Libro Diario y Mayor basado en transacciones.
- Exportación CSV/PDF para auditoría externa.

## 4. Seguridad Operativa

### Prevención de Fraude Interno
- **Anulaciones**: Solo roles Admin/Owner pueden anular ventas, y deben registrar motivo.
- **Corte de Caja**: Bloqueo de ventas anteriores a la fecha de corte sin autorización.
- **Descuentos**: Límites configurables por rol (ej: Cajero max 5%, Gerente ilimitado).
- **Alertas**: Notificación automática por movimientos inusuales (ej: venta > $500 en efectivo).

### Copias de Seguridad (Backup)
- **Automático**: Cloudflare realiza snapshots diarios de D1.
- **Manual**: Endpoint para exportar backup completo en JSON/SQL (solo Owner).
- **Recuperación**: Procedimiento documentado para restore en caso de desastre.

## 5. Passkeys y Autenticación Moderna

### Estándar WebAuthn
- **Sin Contraseñas**: Uso exclusivo de biometría (FaceID, TouchID, Windows Hello) o claves de seguridad físicas (YubiKey).
- **Phishing-Resistant**: Las passkeys están vinculadas al dominio (`pos.kairux.cr`), imposibilitando ataques de ingeniería social.
- **Sincronización**: Soporte para passkeys sincronizadas en nube (iCloud Keychain, Google Password Manager).

### Proveedor de Identidad (OAuth)
- **Google/Apple**: Integración vía Arctic para login corporativo rápido.
- **MFA Obligatorio**: Para roles Admin y Owner, se requiere segundo factor si no se usa Passkey.

## 6. Respuesta a Incidentes

### Clasificación
- **Crítico**: Fuga de datos, acceso no autorizado a BD.
- **Alto**: Caída del servicio > 1 hora, corrupción de datos financieros.
- **Medio**: Errores de cálculo fiscal, bugs en reporting.
- **Bajo**: Errores cosméticos, lentitud menor.

### Protocolo
1.  **Detección**: Alertas automáticas por monitoreo de errores y logs.
2.  **Contención**: Revocación inmediata de tokens comprometidos.
3.  **Investigación**: Revisión de `audit_logs` para determinar alcance.
4.  **Notificación**: Aviso a clientes afectados si hay fuga de datos personales.
5.  **Remediación**: Parche de seguridad y deploy urgente.

## 7. Auditoría y Logs

### Qué se Registra
- Logins exitosos y fallidos.
- Creación, edición y borrado de registros críticos (ventas, productos, usuarios).
- Cambios de configuración de la organización.
- Intentos de acceso denegado (violaciones de RBAC).
- Exportaciones masivas de datos.

### Retención
- Logs de seguridad: 2 años mínimo.
- Logs transaccionales: Indefinido (requerimiento fiscal).
