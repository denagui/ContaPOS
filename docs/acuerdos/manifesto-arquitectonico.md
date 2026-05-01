# 🏛️ Manifiesto Arquitectónico ContaPOS

## Identidad del Producto
**ContaPOS** es un ERP SaaS Multi-Tenant diseñado para ser el sistema operativo de pequeños y medianos negocios en Costa Rica y Latinoamérica.

**Dominio**: `pos.kairux.cr`  
**Stack Tecnológico 2026**: SvelteKit 2, Svelte 5 (Runes), Tailwind CSS v4, Cloudflare Workers, D1, KV, R2.

---

## 📜 Principios Arquitectónicos Fundamentales

### 1. Server-First Architecture
- **Regla de Oro**: Toda lógica de negocio crítica, validación fiscal y acceso a datos ocurre EXCLUSIVAMENTE en el servidor (`+page.server.ts`, servicios).
- **Cliente Ligero**: El frontend (Svelte) es solo una capa de presentación reactiva. No hay lógica de negocio ni cálculos fiscales en el navegador.
- **Seguridad**: El cliente nunca tiene acceso directo a la base de datos.

### 2. Multi-Tenant Scoped (Kairux Style)
- **Base de Datos Única**: Todas las organizaciones comparten las mismas tablas en D1.
- **Aislamiento Lógico**: Cada tabla crítica tiene `organization_id`.
- **Middleware de Seguridad**: Cada consulta SQL está automáticamente filtrada por el `organization_id` del usuario autenticado mediante `getScope()` y `applyScope()`.
- **Sin "Tenant por Empresa"**: Evita la complejidad de gestionar miles de bases de datos.

### 3. Multi-Industry Adaptive (Feature Flags)
- **Núcleo Común**: Ventas, Gastos, Contactos, Inventario son universales.
- **Módulos Activables**: La configuración de industria (`organization_settings`) activa/desactiva funcionalidades:
  - **Retail/Pulpería**: Inventario avanzado, Código de Barras.
  - **Restaurante/Bar**: Mesas, Recetas/Escandallos, Unidades Fraccionadas (ml/gr).
  - **Servicios**: Expedientes, Facturación por Horas, Citas.
  - **Utilities (ASADA)**: Medidores, Lecturas, Cortes/Reconexiones, Multas.
- **UI Dinámica**: El menú y las vistas se adaptan automáticamente según la industria configurada.

### 4. IA Determinista (No Generativa)
- **Cero Alucinaciones**: El sistema no "inventa" datos. Usa reglas de negocio predefinidas.
- **Motor de Sugerencias**: Analiza saldos, vencimientos y patrones históricos para sugerir la "Siguiente Mejor Acción" (ej: "Llamar urgente", "Ofrecer descuento").
- **Detección de Anomalías**: Alertas automáticas por precios fuera de rango o duplicidad de facturas.
- **Proyecciones**: Cálculo de flujo de caja basado en cuentas por cobrar/pagar reales.

### 5. Fiscalidad Costarricense Nativa
- **Clave Hacienda**: Generación automática de claves de 50 dígitos para comprobantes electrónicos.
- **Código CABYS**: Validación estricta de códigos de 13 dígitos en productos/servicios.
- **IVA Flexible**: Soporte nativo para tasas del 0%, 4%, 8% y 13%.
- **Reportes**: Libros diarios, mayores y balances listos para auditoría.

### 6. Airdev / Atomic Design
- **Componentes Reutilizables**: Sistema de diseño basado en átomos, moléculas y organismos.
- **Consistencia Visual**: Estilo "Apple Modern 2026" (Glassmorphism sutil, tipografía grande, bordes redondeados, modo oscuro).
- **Mobile First**: La interfaz está diseñada primero para táctil/móvil, luego escala a escritorio.

### 7. Data Integrity & No Hardcode
- **Cero Mocks en Producción**: El código nunca contiene datos ficticios hardcodeados.
- **Seed Scripts**: Los datos de prueba se inyectan exclusivamente mediante scripts (`seed.ts`) en entornos de desarrollo.
- **Tipado Estricto**: Todo el flujo de datos está tipado con TypeScript y Drizzle ORM. Si el schema cambia, el compilador falla.

### 8. Offline-First PWA
- **Resiliencia**: La aplicación funciona sin internet (lectura de caché, cola de ventas pendientes).
- **Sincronización**: Al recuperar conexión, las operaciones pendientes se sincronizan automáticamente con el servidor.

---

## 🚫 Anti-Patrones Prohibidos
1.  **Hardcodeo de Datos**: Nunca escribir IDs, nombres de empresas o valores fijos en el código.
2.  **Lógica en el Cliente**: Nunca calcular impuestos, totales o validar stock en el navegador.
3.  **Consultas Sin Scope**: Nunca ejecutar una query SQL sin aplicar el filtro de `organization_id`.
4.  **Dependencias Pesadas**: Evitar librerías gigantes; preferir soluciones nativas o ligeras (Cloudflare Workers tiene límites de tamaño).
5.  **Passwords Tradicionales**: El futuro es Passkeys (Oslo Auth) y Social Login (Arctic).

---

## 📅 Roadmap de Fases
- **Fase 1 (Actual)**: Núcleo Operativo (POS, Inventario, Gastos, Roles, Settings).
- **Fase 2**: Autenticación Real (Oslo + Arctic), Migración de Datos, Impresión Tickets.
- **Fase 3**: Facturación Electrónica Full (XML, Envío a Hacienda), App Móvil Nativa.
- **Fase 4**: Marketplace, Integraciones Bancarias, API Pública.

*Documento creado: Mayo 2026 - Equipo Kairux*
