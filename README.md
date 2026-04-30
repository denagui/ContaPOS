# Contabilidad App - Documentación Técnica

> Documentación completa para replicar la aplicación de contabilidad usando el stack Kairux.

## 📋 Descripción

Este repositorio contiene la documentación técnica completa para construir una aplicación de gestión contable y financiera diseñada para PYMEs y profesionales independientes en Costa Rica.

### Características principales:
- **Libro Diario Digital** - Registro de transacciones (ingresos/gastos)
- **Catálogo de Productos/Servicios** con códigos CABYS
- **Gestión de Contactos** (clientes/proveedores)
- **Seguimiento de Facturas** y plazos de pago
- **Reportes financieros** (Balance, CxC, CxP)
- **Soporte para Facturación Electrónica** de Costa Rica

---

## 📁 Estructura del Repositorio

```
.
├── README.md                          # Este archivo
├── docs/                              # Documentación general
│   ├── resumen.md                     # Modelo de negocio y arquitectura
│   └── SKELETON.md                    # Stack tecnológico Kairux
│
├── source/                            # Fuente original
│   └── contabilidad_Application Documentation.pdf
│
├── extracted/                         # Datos extraídos del PDF
│   ├── tablas.md                      # Definición de tablas
│   ├── columnas.md                    # Definición de 87 columnas
│   ├── vistas.md                      # Configuración de 29 vistas
│   ├── reglas.md                      # 14 reglas de formato
│   └── acciones.md                    # 23 acciones
│
└── specs/                             # Especificaciones Kairux (para implementación)
    ├── 01_SCHEMA_SPECIFICATION.md      # Drizzle ORM schemas
    ├── 02_COMMAND_REGISTRY_SPEC.md     # Comandos HF/HO
    ├── 03_BUSINESS_MODULES_SPEC.md     # Estructura de módulos
    ├── 04_FORMULAS_CALCULATIONS_SPEC.md # Fórmulas y cálculos
    ├── 05_UI_COMPONENTS_SPEC.md        # Componentes Svelte
    └── SPEC_KAIRUX_MAPPING.md          # Documento maestro de mapeo
```

---

## 🚀 Stack Tecnológico (Kairux)

| Capa | Tecnología |
|------|-----------|
| **Backend** | Cloudflare Workers + D1 (SQLite) + Drizzle ORM |
| **Storage** | Cloudflare R2 (documentos) + KV (configuración) |
| **Frontend** | Svelte 5 (Runes) + Tailwind CSS v4 |
| **Routing** | SvelteKit |
| **Comandos** | Polygraph (HF/HO) |

---

## 📊 Entidades Principales

1. **Contactos** - Directorio CRM (Clientes, Proveedores, Ambos)
2. **Catálogo** - Productos, servicios y gastos fijos
3. **Transacciones** - Registro financiero maestro (facturas, gastos)
4. **Abonos** - Pagos parciales sobre transacciones a crédito

---

## 🛠️ Cómo usar esta documentación

### Para entender el negocio:
1. Lee `docs/resumen.md`

### Para implementar el backend:
1. Revisa `specs/01_SCHEMA_SPECIFICATION.md` - Crea las tablas en D1
2. Implementa `specs/02_COMMAND_REGISTRY_SPEC.md` - Crea los comandos HF

### Para implementar el frontend:
1. Usa `specs/03_BUSINESS_MODULES_SPEC.md` - Estructura las rutas
2. Implementa `specs/04_FORMULAS_CALCULATIONS_SPEC.md` - Lógica de cálculos
3. Usa `specs/05_UI_COMPONENTS_SPEC.md` - Crea los componentes visuales

---

## 📝 Notas

- **87 columnas** documentadas en `extracted/columnas.md`
- **29 vistas** configuradas en `extracted/vistas.md`
- **14 reglas de formato** en `extracted/reglas.md`
- **23 acciones** definidas en `extracted/acciones.md`

---

**Versión:** 1.0  
**Última actualización:** Abril 2026  
**Autor:** denagui