# 🇨🇷 Facturación Electrónica 4.4 - Costa Rica (2026)

## ⚠️ Estado Crítico del Proyecto

**Objetivo:** Migrar el sistema de facturación electrónica para cumplir con la versión **4.4** exigida por el Ministerio de Hacienda de Costa Rica en 2026.

**Contexto:** La normativa fiscal costarricense ha evolucionado desde el D-104 hacia el sistema **ATV (Administración Tributaria Virtual)** con validaciones en tiempo real, facturación electrónica 4.4 y contabilidad digital mensual.

---

## 1. Cambios Principales FE 4.4 vs Versiones Anteriores

### 1.1 Nuevos Requisitos Técnicos
- **Esquemas XSD Actualizados:** Estructura XML modificada con nuevos nodos obligatorios
- **Algoritmos de Firma:** Migración a estándares criptográficos más seguros (SHA-256 mínimo)
- **Validación Previa:** Servicios de validación en línea antes del envío final
- **Retenciones Electrónicas:** Nuevo formato para comprobantes de retención
- **Contabilidad Electrónica:** Libros diarios y mayores en formato digital para cruce automático

### 1.2 Campos Nuevos Obligatorios
| Campo | Descripción | Versión Anterior | FE 4.4 |
|-------|-------------|------------------|--------|
| `ActividadEconomica` | Código actualizado según nueva tabla | Opcional | **Obligatorio** |
| `PlazoEntrega` | Detalle de plazos en créditos | No existía | **Obligatorio** |
| `MedioPago` | Medios de pago estandarizados | Básico | **Expandido** |
| `Impuestos` | Desglose detallado por tipo | General | **Específico** |
| `Cabys` | Código único de productos/servicios | Opcional | **Obligatorio** |

---

## 2. Arquitectura de Migración

### 2.1 Estrategia Adapter Pattern
El sistema ya cuenta con la arquitectura necesaria gracias al patrón **Adapter/Facade**:

```typescript
// Estructura actual lista para extensión
src/lib/server/services/billing/
├── types.ts                 // Interfaz base BillingAdapter
├── kairux-adapter.ts        // Motor nativo (a actualizar)
├── generic-api-adapter.ts   // Proveedor externo (puente temporal)
├── orchestrator.ts          // Selector de proveedor
└── hacienda-44-adapter.ts   // ⚠️ PENDIENTE DE CREAR
```

### 2.2 Roadmap de Implementación

#### Fase 1: Investigación y Especificación (SEMANA 1)
- [ ] Descargar especificaciones técnicas oficiales v4.4 del MH
- [ ] Obtener XSDs actualizados del sitio de Hacienda
- [ ] Revisar cambios en tabla de códigos de actividad económica
- [ ] Documentar nuevos requisitos de certificados digitales

#### Fase 2: Desarrollo del Adaptador 4.4 (SEMANA 2-3)
- [ ] Crear `Hacienda44Adapter` que implemente `BillingAdapter`
- [ ] Implementar generador XML según nuevo XSD
- [ ] Integrar librerías de firma digital actualizadas
- [ ] Desarrollar validador de esquemas previo al envío

#### Fase 3: Integración con ATV (SEMANA 4)
- [ ] Conectar con endpoints de validación de Hacienda
- [ ] Implementar manejo de respuestas asíncronas
- [ ] Gestionar estados: "En Proceso", "Validado", "Rechazado"
- [ ] Sistema de reintentos automáticos

#### Fase 4: Pruebas y Certificación (SEMANA 5-6)
- [ ] Pruebas en ambiente sandbox de Hacienda
- [ ] Validación de casos borde (notas crédito, débito, devoluciones)
- [ ] Certificación con secuencia numérica real
- [ ] Documentación de usuario final

---

## 3. Requerimientos Técnicos Detallados

### 3.1 Librerías Necesarias
```json
{
  "dependencies": {
    "xml-crypto": "^6.0.0",      // Firma digital actualizada
    "xmldom": "^0.9.0",          // Parseo XML compatible
    "node-forge": "^2.0.0",      // Criptografía avanzada
    "axios": "^1.6.0"            // HTTP client para ATV
  }
}
```

### 3.2 Certificados Digitales
- **Formato:** PKCS#12 (.p12 o .pfx)
- **Algoritmo:** RSA 2048 mínimo (se recomienda 4096)
- **Vigencia:** Verificar fecha de expiración automáticamente
- **PIN:** Gestión segura mediante variables de entorno encriptadas

### 3.3 Endpoints ATV (Por Confirmar)
```typescript
const ATV_ENDPOINTS = {
  SANDBOX: 'https://atv-sandbox.hacienda.go.cr',
  PRODUCTION: 'https://atv.hacienda.go.cr',
  VALIDATE: '/api/v1/validate',
  SEND: '/api/v1/comprobante',
  STATUS: '/api/v1/estado/:clave'
};
```

---

## 4. Consideraciones de Negocio

### 4.1 Impacto en Usuarios Existentes
- **Migración Transparente:** El sistema manejará ambas versiones durante periodo de transición
- **Actualización Automática:** Los nuevos comprobantes usarán 4.4 automáticamente
- **Histórico:** Los comprobantes antiguos permanecen válidos en su versión original

### 4.2 Competencia Directa
| Proveedor | Estado FE 4.4 | Ventaja ContaPOS |
|-----------|---------------|------------------|
| Alegra | En desarrollo | **Primero en mercado** |
| Nubox | Beta cerrado | **Código abierto** |
| QuickBooks | No disponible | **Local expertise** |
| FacturateCR | Disponible | **Mejor UX** |

### 4.3 Estrategia de Lanzamiento
1. **Beta Cerrado:** 10 clientes piloto (panaderías, retail pequeño)
2. **Lanzamiento Gradual:** 50 clientes en primer mes
3. **Masivo:** Todos los clientes tras 30 días sin errores críticos

---

## 5. Riesgos y Mitigación

### 5.1 Riesgos Técnicos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Cambios últimos minuto en XSD | Alta | Alto | Mantener `GenericApiAdapter` como fallback |
| Inestabilidad endpoints ATV | Media | Medio | Sistema de colas y reintentos exponenciales |
| Certificados expirados | Baja | Crítico | Alertas automáticas 30 días antes |

### 5.2 Riesgos Normativos
- **Fecha Límite:** Confirmar fecha oficial de obligatoriedad
- **Multas:** Establecer seguro de responsabilidad por errores fiscales
- **Soporte:** Capacitar equipo de soporte en nueva normativa

---

## 6. Checklist de Implementación

### Backend
- [ ] `Hacienda44Adapter.ts` - Generador XML 4.4
- [ ] `AtvClient.ts` - Cliente HTTP para ATV
- [ ] `CertificateManager.ts` - Gestión de certificados
- [ ] `XmlValidator.ts` - Validador contra XSD
- [ ] `DigitalSignature.ts` - Firma digital actualizada
- [ ] `ResponseHandler.ts` - Procesamiento de respuestas

### Frontend
- [ ] UI de configuración de certificados
- [ ] Indicador visual de versión FE (4.3 vs 4.4)
- [ ] Historial de envíos con estados detallados
- [ ] Notificaciones de rechazo con motivos
- [ ] Exportador de respaldos XML/PDF

### DevOps
- [ ] Variables de entorno para endpoints ATV
- [ ] Secrets management para certificados
- [ ] Monitoreo de tasa de éxito de envíos
- [ ] Alertas de fallos masivos

---

## 7. Recursos Oficiales

### Enlaces Clave
- **Ministerio de Hacienda:** https://www.hacienda.go.cr
- **ATV (Administración Tributaria Virtual):** https://atv.hacienda.go.cr
- **Especificaciones Técnicas:** [Pendiente de publicación oficial]
- **XSDs Oficiales:** [Pendiente de descarga]

### Contactos de Soporte
- **Mesa de Ayuda Hacienda:** 2549-6000
- **Email Soporte Técnico:** soporte.atv@hacienda.go.cr

---

## 8. Notas Importantes

> **⚠️ ADVERTENCIA CRÍTICA:** 
> No iniciar implementación de código hasta tener documentación oficial v4.4 del MH.
> Usar `GenericApiAdapter` con proveedor externo mientras se desarrolla adaptador nativo.

> **💡 RECOMENDACIÓN:** 
> Mantener compatibilidad hacia atrás con FE 4.3 durante 6 meses post-lanzamiento
> para permitir migración gradual de clientes con sistemas legacy.

---

**Última Actualización:** Enero 2026  
**Responsable:** Equipo de Desarrollo ContaPOS/Kairux  
**Estado:** 🟡 EN ESPERA DE ESPECIFICACIONES OFICIALES
