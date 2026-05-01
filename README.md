# 🏪 POS Moderno para Pulperías y Sodas

Sistema de Punto de Venta (POS) moderno, rápido y offline-first construido con el stack más actualizado para 2026.

## 🚀 Stack Tecnológico

- **Frontend**: SvelteKit 2 + Svelte 5 (Runes)
- **Estilos**: Tailwind CSS v4 con diseño Liquid Glass
- **Backend**: Cloudflare Workers
- **Base de Datos**: Cloudflare D1 (SQLite)
- **Cache/Sesiones**: Cloudflare KV
- **Archivos**: Cloudflare R2 (imágenes de productos)
- **Auth**: Lucia Auth
- **Validación**: Zod
- **ORM**: Drizzle ORM

## ✨ Características Principales

### 🛒 Punto de Venta (POS)
- Interfaz rápida y responsiva (mobile-first)
- Soporte para lectores de código de barras USB/Bluetooth
- Múltiples métodos de pago: efectivo, tarjeta, transferencia, fiado
- Carrito de compras en tiempo real
- Funcionamiento offline con sincronización automática

### 📦 Inventario
- Gestión de productos con categorías
- Control de stock con alertas de mínimo
- Soporte para códigos de barra
- Alertas de stock bajo en tiempo real
- Valorización del inventario

### 👥 CRM - Clientes
- Base de datos de clientes
- Sistema de fiado con límites de crédito
- Historial de compras
- Gestión de saldos pendientes
- Registro de pagos

### 📊 Reportes
- Ventas del día en tiempo real
- Métricas clave: total, transacciones, ticket promedio
- Desglose por método de pago
- Últimas transacciones
- Cierre de caja

### ⚙️ Configuración
- Datos del negocio personalizables
- Configuración fiscal (impuestos, moneda)
- Gestión de usuarios
- Exportación/importación de datos
- Respaldo completo de la base de datos

## 🎨 Diseño Liquid Glass

Interfaz moderna con efecto glassmorphism:
- Fondos translúcidos con blur
- Bordes sutiles brillantes
- Sombras suaves
- Gradientes modernos
- Totalmente responsive (mobile-first)
- Modo oscuro por defecto

## 📱 Multi-Plataforma

- **Móvil**: App nativa PWA para teléfonos
- **Tablet**: Optimizado para iPad/Android tablets
- **Escritorio**: Web app para computadoras
- **Offline**: Funciona sin conexión a internet

## 🛠️ Instalación y Desarrollo

### Requisitos Previos
- Node.js 20+
- npm o pnpm
- Wrangler CLI (para Cloudflare)

### Pasos de Instalación

```bash
# Instalar dependencias
npm install

# Configurar Cloudflare (crear recursos)
wrangler login

# Crear base de datos D1
wrangler d1 create pos-database

# Actualizar wrangler.toml con el database_id

# Crear KV namespace
wrangler kv:namespace create SESSION_KV

# Crear bucket R2
wrangler r2 bucket create product-images

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview local con emulación de Cloudflare
wrangler pages dev
```

## 📁 Estructura del Proyecto

```
pos-app/
├── src/
│   ├── lib/
│   │   ├── components/     # Componentes reutilizables
│   │   └── server/
│   │       └── database.ts # Esquema D1 y funciones DB
│   ├── routes/
│   │   ├── +page.svelte    # Dashboard principal
│   │   ├── pos/            # Módulo de ventas
│   │   ├── inventory/      # Módulo de inventario
│   │   ├── crm/            # Módulo de clientes
│   │   ├── reports/        # Módulo de reportes
│   │   └── settings/       # Módulo de configuración
│   ├── app.css             # Estilos globales + Tailwind
│   └── app.html            # HTML base
├── static/
│   └── manifest.json       # PWA manifest
├── wrangler.toml           # Configuración Cloudflare
├── svelte.config.js        # Configuración SvelteKit
├── vite.config.ts          # Configuración Vite + Tailwind v4
└── package.json
```

## 🔐 Seguridad

- Autenticación con sesiones seguras en KV
- Protección CSRF
- Validación de datos con Zod
- Roles de usuario (admin, vendedor)
- Encriptación de datos sensibles

## 🌐 Despliegue en Cloudflare

```bash
# Deploy a Cloudflare Pages
npm run build
wrangler pages deploy .svelte-kit/cloudflare

# O usar CI/CD automático conectando GitHub a Cloudflare Pages
```

## 📈 Próximas Mejoras

- [ ] Escaneo de código de barras con cámara del móvil
- [ ] Impresión de tickets térmicos (Bluetooth/USB)
- [ ] Notificaciones push de stock bajo
- [ ] Integración con WhatsApp para enviar recibos
- [ ] Modo multi-sucursal
- [ ] Dashboard analítico avanzado
- [ ] Importación masiva desde Excel/CSV
- [ ] API REST para integraciones externas

## 📄 Licencia

MIT License - Libre uso comercial

---

**Construido con ❤️ usando Svelte 5 + Cloudflare**

*Perfecto para pulperías, sodas, tiendas de barrio y pequeños comercios.*
