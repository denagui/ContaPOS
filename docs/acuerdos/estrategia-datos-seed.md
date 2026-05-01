# 🌱 Estrategia de Datos y Seed Scripts

## Principio Fundamental: Cero Hardcodeo
En ContaPOS, **está estrictamente prohibido** hardcodear datos de negocio (nombres de empresas, IDs de usuarios, listas de productos) en el código fuente.

- ❌ **MAL**: `const user = { name: "Pulpería María" }`
- ✅ **BIEN**: `const user = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })`

La única excepción son los **Scripts de Seed**, que se ejecutan exclusivamente en entornos de desarrollo o inicialización.

---

## Arquitectura de Datos Multi-Tenant

### 1. Aislamiento Lógico (Scoped)
Todas las tablas de negocio incluyen la columna `organization_id`.
- Las consultas nunca se hacen "globales".
- El middleware `applyScope()` inyecta automáticamente el filtro `WHERE organization_id = ?` en cada query.

### 2. Tablas Globales vs. Scoped
| Tipo | Ejemplos | ¿Tiene `organization_id`? |
|------|----------|---------------------------|
| **Globales** | `users`, `organizations` | ❌ No (son compartidas) |
| **Scoped** | `products`, `sales`, `contacts`, `expenses` | ✅ Sí (aisladas por empresa) |
| **Configuración** | `organization_settings` | ✅ Sí (una por empresa) |

---

## Script de Seed (`scripts/seed.ts`)

El script de seed es la **fuente única de verdad** para datos de prueba. Debe ser idempotente (puede ejecutarse múltiples veces sin duplicar datos).

### Estructura del Seed
El script debe crear:
1.  **Organizaciones de Prueba**: Una por cada tipo de industria (Retail, Restaurante, ASADA, Servicios).
2.  **Usuarios Multi-Rol**: Para cada organización, crear usuarios con roles distintos (Dueño, Cajero, Contador).
3.  **Datos Específicos por Industria**:
    - *Retail*: Productos con código de barras, clientes frecuentes.
    - *Restaurante*: Recetas (Cócteles), ingredientes, mesas.
    - *ASADA*: Suscriptores, medidores, lecturas históricas.
    - *Servicios*: Expedientes, horas registradas.
4.  **Transacciones Históricas**: Ventas y gastos de los últimos 30 días para probar gráficas y alertas de IA.

### Ejemplo de Flujo (Pseudocódigo)
```typescript
async function seed() {
  // 1. Crear Organizaciones
  const retailOrg = await createOrg("Pulpería Doña María", "retail");
  const restOrg = await createOrg("Bar El Tono", "restaurant");
  
  // 2. Crear Usuarios
  await createUser(retailOrg.id, "admin@retail.com", "owner");
  await createUser(retailOrg.id, "cajero@retail.com", "cashier");
  
  // 3. Poblar Datos Específicos
  if (org.type === 'restaurant') {
    await createRecipe(restOrg.id, "Cuba Libre", [
      { item: "Ron", qty: 50, unit: "ml" },
      { item: "Coca Cola", qty: 200, unit: "ml" }
    ]);
  }
  
  // 4. Generar Ventas Aleatorias (para gráficas)
  await generateRandomSales(retailOrg.id, 50); 
}
```

---

## Migraciones de Datos (Importación)

Para clientes que vienen de otros sistemas (Excel, Siigo, AppSheet), usamos el **Kairux Smart Import Engine** (`/import`).

### Niveles de Importación
1.  **Nivel 1 (CSV/Excel)**: 
    - El usuario sube un archivo.
    - El sistema detecta columnas automáticamente (ej: "Nombre" -> `contact_name`).
    - Vista previa de errores antes de confirmar.
2.  **Nivel 2 (Conectores)**: 
    - Scripts específicos para APIs de sistemas comunes.
3.  **Nivel 3 (Manual Asistido)**: 
    - Para grandes volúmenes, el equipo de Kairux realiza la migración directa en BD.

### Reglas de Integridad
- **Validación Fiscal**: Al importar productos, se valida que el CABYS tenga 13 dígitos.
- **Unicidad**: Si existe un producto con el mismo nombre/código, se pregunta si actualizar o saltar.
- **Transaccionalidad**: La importación es "todo o nada". Si falla una fila crítica, se revierte todo.

---

## Backup y Restauración

- **Backup Automático**: Cloudflare D1 realiza backups diarios automáticos.
- **Exportación Manual**: Cualquier usuario con rol `owner` o `accountant` puede exportar toda su data a CSV/JSON desde `/settings/data`.
- **Restauración**: Solo disponible vía soporte técnico de Kairux (para evitar sobrescrituras accidentales).

*Documento creado: Mayo 2026 - Equipo Kairux*
