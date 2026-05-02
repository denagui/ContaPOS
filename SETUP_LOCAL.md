# 🛠️ Guía de Configuración Local - ContaPOS

## Requisitos Previos

- Node.js 20+ 
- npm 10+
- Wrangler CLI (`npm install -g wrangler`)

## Pasos para Ejecutar en Local

### 1. Instalar Dependencias

```bash
cd /Users/den/Documents/ContaPOS
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores (opcional para desarrollo básico)
```

### 3. Opciones de Ejecución Local

#### Opción A: Solo Frontend (Sin Backend/DB)
```bash
# Solo ver la UI, sin funcionalidad de backend
npm run dev
```
Acceso: http://localhost:5173

#### Opción B: Con Wrangler (Simulación Cloudflare)
```bash
# Simula el entorno de Cloudflare Workers localmente
wrangler dev
```
Acceso: http://localhost:8787

#### Opción C: Preview (Build local)
```bash
# Compilar y ver el build local
npm run build
npm run preview
```
Acceso: http://localhost:4173

### 4. Verificar Tipos y Lint

```bash
npm run check
```

### 5. Base de Datos Local (Opcional)

Para usar la base de datos D1 en local, necesitas:

```bash
# Crear base de datos D1 (requiere cuenta Cloudflare)
wrangler login
wrangler d1 create pos-database

# Actualizar wrangler.toml con el database_id generado
# Luego aplicar migraciones
wrangler d1 migrations apply pos-database --local
```

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server con Vite (solo frontend) |
| `wrangler dev` | Dev server con Cloudflare Workers |
| `npm run build` | Compilar para producción |
| `npm run preview` | Ver build local |
| `npm run check` | Verificar tipos TypeScript |

## URLs de Desarrollo

| Modo | URL | Descripción |
|------|-----|-------------|
| Vite Dev | http://localhost:5173 | Solo frontend, sin Workers |
| Wrangler | http://localhost:8787 | Con Workers, simula Cloudflare |
| Preview | http://localhost:4173 | Build de producción local |

## Solución de Problemas

### Error: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Error: "Wrangler not found"
```bash
npm install -g wrangler
```

### Error: "database_id is empty"
Esta advertencia es normal en desarrollo local sin D1 configurado.

## Notas

- En desarrollo local sin Cloudflare, algunas funciones (DB, KV, R2) estarán limitadas
- La UI y componentes funcionarán normalmente
- Para funcionalidad completa, se necesita configurar Cloudflare D1
