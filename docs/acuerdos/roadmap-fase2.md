# 🗺️ Roadmap Fase 2: Autenticación, Despliegue y Migración

## 1. Autenticación Moderna (Stack 2026)
Reemplazo del login mock por implementación real con **Oslo Auth** y **Arctic**.

### Tecnologías
- **Oslo Auth**: Gestión de sesiones seguras, soporte nativo para Passkeys (WebAuthn).
- **Arctic**: Integración OAuth 2.0 para Google, Apple y Microsoft.
- **Base de Datos**: Tablas `user`, `session`, `account`, `passkey_credential` en D1.

### Flujo de Implementación
1. Instalación de dependencias: `npm install oslo arctic`.
2. Creación de rutas `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`.
3. Implementación de middleware de protección en `hooks.server.ts`.
4. Migración de usuarios mock a usuarios reales mediante script de transición.

## 2. Despliegue en Cloudflare (Producción)
Configuración final para llevar el sistema a `pos.kairux.cr`.

### Infraestructura
- **Cloudflare Pages**: Hosting del frontend SvelteKit (adaptador `cloudflare-pages`).
- **Cloudflare Workers**: Ejecución del backend serverless.
- **D1 Database**: Base de datos SQL global (`kairux_pos_prod`).
- **KV Namespace**: Almacenamiento de sesiones y caché de configuración.
- **R2 Bucket**: Almacenamiento de logos, fotos de productos y tickets PDF.

### Pasos de Deploy
1. Crear recursos en Dashboard de Cloudflare (D1, KV, R2).
2. Configurar `wrangler.toml` con bindings de producción.
3. Ejecutar migraciones en D1 remoto: `wrangler d1 execute kairux_pos_prod --remote`.
4. Conectar repositorio a Cloudflare Pages para CI/CD automático.

## 3. Estrategia de Migración de Datos
Proceso para traer clientes desde sistemas legacy (Excel, Siigo, AppSheet).

### Herramienta: Kairux Smart Import
- **Nivel 1 (CSV/Excel)**: Plantillas predefinidas con mapeo inteligente de columnas.
- **Nivel 2 (API)**: Conectores específicos para ERPs comunes en Costa Rica.
- **Validación**: Sandbox de previsualización antes de confirmar la importación masiva.

### Cronograma Estimado
- **Semana 1**: Implementación de Oslo Auth + Login Google.
- **Semana 2**: Configuración de entorno Productivo en Cloudflare.
- **Semana 3**: Lanzamiento del módulo "Smart Import" para migración asistida.
