# Perfiles de Industria y Roles Dinámicos

## Visión General
El sistema ContaPOS es multi-industria. La interfaz y los permisos se adaptan dinámicamente según el tipo de negocio configurado en `organization_settings`.

## Matriz de Industrias Soportadas

### 1. Retail (Pulperías, Supermercados, Tiendas)
- **Enfoque**: Venta rápida, control de stock unitario, códigos de barra.
- **Módulos Activos**: POS, Inventario, Compras, CRM, Caja.
- **Roles Típicos**:
  - `owner`: Acceso total.
  - `cashier`: Solo POS y cierre de caja propio.
  - `inventory_manager`: Compras y ajuste de stock.
  - `accountant`: Reportes fiscales y libros.

### 2. Gastronomía (Restaurantes, Bares, Sodas)
- **Enfoque**: Mesas, comandas, recetas (escandallos), propinas.
- **Módulos Activos**: POS (con mesas), Recetas, Inventarios fraccionados (ml/gr), Comandas.
- **Roles Típicos**:
  - `waiter`: Tomar pedidos, ver estado de mesas (solo lectura de caja).
  - `bartender`: Gestión de bar, salida de botellas.
  - `cashier`: Cobro y división de cuentas.
  - `manager`: Menú, precios, escandallos.

### 3. Servicios (Bufetes, Consultorios, Talleres)
- **Enfoque**: Citas, horas facturables, expedientes, proyectos.
- **Módulos Activos**: Agenda, Expedientes, Facturación recurrente, Proyectos.
- **Roles Típicos**:
  - `professional`: Ver sus propios clientes y agenda.
  - `secretary`: Agendar citas, facturar.
  - `owner`: Rentabilidad por profesional/proyecto.

### 4. Utilities (ASADAs, Cooperativas)
- **Enfoque**: Medidores, lecturas mensuales, cortes, reconexiones.
- **Módulos Activos**: Medidores, Lecturas, Facturación Masiva, Cortes.
- **Roles Típicos**:
  - `reader`: Registrar lecturas (mobile first).
  - `operator`: Procesar cortes/reconexiones.
  - `admin`: Tarifas, reportes de morosidad.

## Implementación Técnica
- La tabla `organizations` tiene un campo `industry_type`.
- El middleware `roles-matrix.ts` filtra las rutas disponibles.
- El frontend (`+layout.svelte`) oculta/muestra enlaces del menú según esta matriz.
