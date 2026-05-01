# Especificación Schema Hacienda 2026 - ContaPOS

## Resumen Ejecutivo

Este documento define los cambios necesarios en el schema de base de datos para cumplir con la normativa de Facturación Electrónica 4.4 de Hacienda Costa Rica (2026).

** Alcance:** Estructura de datos únicamente. El módulo de envío XML/API a Hacienda es un componente separado.

---

## 1. Cambios al Schema Existente

### 1.1 Tabla `contacts` (Receptores/Emisores)

```typescript
export const contacts = sqliteTable('contacts', {
  // ... campos existentes ...
  
  // NUEVO: Código de actividad económica (Hacienda)
  // Catálogo de actividades económicas del Ministerio de Hacienda
  // Ejemplo: "011101" = Cultivo de palma de aceite
  activityCode: text('activity_code'),
  
  // NUEVO: Múltiples correos electrónicos (JSON array)
  // Hasta 4 correos permitidos por Hacienda 4.4
  emails: text('emails'), // JSON: ["email1@empresa.com", "email2@empresa.com"]
  
  // ACTUALIZAR: Tipos de identificación (Anexo 4.4)
  documentType: text('document_type', { 
    enum: [
      'cedula_fisica',           // Física nacional
      'cedula_juridica',         // Jurídica nacional
      'dimex',                   // DIMEX (extranjero residente)
      'nite',                    // NITE (extranjero no residente)
      'pasaporte',               // Pasaporte
      'extranjero_no_domiciliado', // NUEVO 4.4
      'no_contribuyente'         // NUEVO 4.4
    ] 
  }).default('cedula_fisica'),
  
  // NUEVO: Provincia (código Hacienda 1-7)
  // 1=San José, 2=Cartago, 3=Heredia, 4=Alajuela, 5=Guanacaste, 6=Puntarenas, 7=Limón
  provinceCode: text('province_code', { enum: ['1', '2', '3', '4', '5', '6', '7'] }),
  
  // NUEVO: Cantón (3 dígitos)
  cantonCode: text('canton_code'),
  
  // NUEVO: Distrito (3 dígitos)
  districtCode: text('district_code'),
  
  // NUEVO: Barrio/otras señas
  neighborhood: text('neighborhood'),
});
```

**Índices adicionales:**
```typescript
index('idx_contacts_activity').on(table.activityCode),
index('idx_contacts_document_type').on(table.documentType),
```

---

### 1.2 Tabla `companies` (Organizaciones/Emisores)

```typescript
export const companies = sqliteTable('companies', {
  // ... campos existentes ...
  
  // NUEVO: Número de identificación tributaria (NIT completo)
  // Formato: 3-XXX-XXXXXX (provincia-tipo-número-dv)
  nit: text('nit').notNull(),
  
  // NUEVO: Sucursal/Taller/Punto de venta (3 dígitos)
  // Usado en la clave de comprobante
  branchCode: text('branch_code').default('001'),
  
  // NUEVO: Terminal/Punto de facturación (5 dígitos)
  terminalCode: text('terminal_code').default('00001'),
  
  // NUEVO: Actividad económica principal
  mainActivityCode: text('main_activity_code'),
  
  // NUEVO: Actividades económicas secundarias (JSON array)
  secondaryActivityCodes: text('secondary_activity_codes'), // ["523202", "471101"]
  
  // NUEVO: Franquicia/contribuyente ordinario/gran contribuyente
  taxpayerType: text('taxpayer_type', { 
    enum: ['ordinary', 'large', 'special', 'franchise'] 
  }).default('ordinary'),
  
  // NUEVO: Régimen de IVA
  ivaRegime: text('iva_regime', { 
    enum: ['general', 'simplified', 'exempt', 'special'] 
  }).default('general'),
});
```

---

### 1.3 Tabla `sales` (Comprobantes Electrónicos)

```typescript
export const sales = sqliteTable('sales', {
  // ... campos existentes (céntimos, haciendaKey, etc.) ...
  
  // NUEVO: Tipo de comprobante (Hacienda)
  documentType: text('document_type', {
    enum: [
      '01', // Factura electrónica
      '02', // Nota de débito
      '03', // Nota de crédito
      '04', // Tiquete electrónico
      '05', // Confirmación de aceptación
      '06', // Confirmación de rechazo
      '07', // Nota de remisión
      '08', // Factura electrónica de compra
      '09'  // Factura electrónica de exportación
    ]
  }).default('01'),
  
  // NUEVO: Condición de venta
  saleCondition: text('sale_condition', {
    enum: ['01', '02', '03'] // 01=Contado, 02=Crédito, 03=Consignación
  }).default('01'),
  
  // NUEVO: Plazo de crédito en días (si es crédito)
  creditTermDays: integer('credit_term_days').default(0),
  
  // NUEVO: Medio de pago (código Hacienda)
  paymentMethodCode: text('payment_method_code', {
    enum: [
      '01', // Efectivo
      '02', // Tarjeta
      '03', // Cheque
      '04', // Transferencia
      '05', // Recaudado por terceros
      '06', // SINPE móvil (NUEVO 4.4)
      '07', // Plataformas digitales/PayPal (NUEVO 4.4)
      '08'  // Depósito
    ]
  }).default('01'),
  
  // NUEVO: Referencia a documento original (para ND/NC)
  referenceDocKey: text('reference_doc_key'), // Clave Hacienda doc referenciado
  referenceDocDate: text('reference_doc_date'),
  referenceDocType: text('reference_doc_type'),
  
  // NUEVO: Número consecutivo interno (separado de la clave)
  consecutiveNumber: text('consecutive_number'),
  
  // NUEVO: CAE (Código de Autorización Especial) si aplica
  cae: text('cae'),
  caeExpiration: text('cae_expiration'),
});
```

---

### 1.4 Tabla `sale_items` (Líneas de comprobante)

```typescript
export const saleItems = sqliteTable('sale_items', {
  // ... campos existentes ...
  
  // NUEVO: Código CABYS del producto (copia en el momento de la venta)
  cabysCode: text('cabys_code'),
  
  // NUEVO: Tipo de IVA aplicado
  taxType: text('tax_type', { 
    enum: ['01', '02', '03', '04', '05', '06', '07', '08'] 
  }),
  // 01=General 13%, 02=Reducido 4%, 03=Reducido 8%, 
  // 04=Exento, 05=Transitorio 0%, 06=Transitorio 4%, 
  // 07=Transitorio 8%, 08=Transitorio 13%
  
  // NUEVO: Tarifa específica aplicada
  taxRate: real('tax_rate'),
  
  // NUEVO: Monto de IVA en céntimos (separado del total)
  taxAmountCents: integer('tax_amount_cents').default(0),
  
  // NUEVO: Unidad de medida (código Hacienda)
  unitCode: text('unit_code', {
    enum: ['Unid', 'kg', 'g', 'L', 'ml', 'm', 'cm', 'm2', 'm3', 'Otros']
  }).default('Unid'),
  
  // NUEVO: Precio unitario sin IVA (céntimos)
  unitPriceWithoutTaxCents: integer('unit_price_without_tax_cents'),
  
  // NUEVO: Descuento aplicado (monto en céntimos)
  discountAmountCents: integer('discount_amount_cents').default(0),
  
  // NUEVO: Motivo de descuento
  discountReason: text('discount_reason'),
});
```

---

## 2. Tablas Nuevas

### 2.1 Tabla `tax_exemptions` (Exoneraciones Fiscales)

```typescript
export const taxExemptions = sqliteTable('tax_exemptions', {
  id: text('id').primaryKey(),
  
  // Referencia al comprobante
  saleId: text('sale_id').references(() => sales.id),
  
  // Institución que otorga la exoneración
  // Ejemplo: " Ministerio de Salud", "CONICIT", "MINAE"
  institutionCode: text('institution_code').notNull(),
  institutionName: text('institution_name').notNull(),
  
  // Porcentaje de exoneración (0-100)
  exemptionPercentage: real('exemption_percentage').notNull(),
  
  // Artículo legal que respalda
  // Ejemplo: "Art. 11 Ley 6826", "Art. 2 Decreto 38072-H"
  legalArticle: text('legal_article').notNull(),
  
  // Número de autorización de exoneración
  authorizationNumber: text('authorization_number'),
  
  // Fecha de autorización
  authorizationDate: text('authorization_date'),
  
  // Monto exonerado (céntimos)
  exemptedAmountCents: integer('exempted_amount_cents').notNull(),
  
  createdAt: text('created_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_exemptions_sale').on(table.saleId),
  index('idx_exemptions_institution').on(table.institutionCode),
]);
```

---

### 2.2 Tabla `hacienda_api_log` (Log de comunicación)

```typescript
export const haciendaApiLog = sqliteTable('hacienda_api_log', {
  id: text('id').primaryKey(),
  
  // Referencia
  saleId: text('sale_id').references(() => sales.id),
  
  // Tipo de operación
  operationType: text('operation_type', {
    enum: ['send', 'query', 'cancel', 'accept', 'reject']
  }),
  
  // Estado de la respuesta
  status: text('status', {
    enum: ['pending', 'processing', 'accepted', 'rejected', 'error']
  }),
  
  // Clave del comprobante
  documentKey: text('document_key'),
  
  // XML enviado (opcional, puede ser muy grande)
  requestXml: text('request_xml'),
  
  // Respuesta de Hacienda
  responseXml: text('response_xml'),
  responseCode: text('response_code'),
  responseMessage: text('response_message'),
  
  // Detalles de error si aplica
  errorDetails: text('error_details'),
  
  // Fechas
  sentAt: text('sent_at'),
  respondedAt: text('responded_at'),
  createdAt: text('created_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_api_log_sale').on(table.saleId),
  index('idx_api_log_key').on(table.documentKey),
  index('idx_api_log_status').on(table.status),
]);
```

---

### 2.3 Tabla `cae_authorizations` (Autorizaciones Especiales)

```typescript
export const caeAuthorizations = sqliteTable('cae_authorizations', {
  id: text('id').primaryKey(),
  
  companyId: text('company_id').references(() => companies.id),
  
  // Número de CAE
  caeNumber: text('cae_number').notNull().unique(),
  
  // Tipo de documento que autoriza
  documentType: text('document_type', {
    enum: ['01', '02', '03', '04', '08', '09']
  }),
  
  // Rango de numeración autorizado
  startNumber: text('start_number').notNull(),
  endNumber: text('end_number').notNull(),
  
  // Fechas de vigencia
  startDate: text('start_date').notNull(),
  expirationDate: text('expiration_date').notNull(),
  
  // Estado
  status: text('status', {
    enum: ['active', 'expired', 'cancelled', 'suspended']
  }).default('active'),
  
  // Último número usado
  lastUsedNumber: text('last_used_number'),
  
  createdAt: text('created_at').defaultCurrentTimestamp(),
}, (table) => [
  index('idx_cae_company').on(table.companyId),
  index('idx_cae_number').on(table.caeNumber),
  index('idx_cae_status').on(table.status, table.expirationDate),
]);
```

---

## 3. Catálogos de Referencia

### 3.1 Tabla `activity_codes` (Códigos de Actividad Económica)

```typescript
export const activityCodes = sqliteTable('activity_codes', {
  code: text('code').primaryKey(), // 6 dígitos
  description: text('description').notNull(),
  section: text('section'), // Sección del CIIU
  division: text('division'),
  group: text('group'),
  class: text('class'),
  isActive: integer('is_active').default(1),
});
```

**Datos de seed:** Catálogo completo de Hacienda (se carga con migration)

---

### 3.2 Tabla `institution_codes` (Instituciones Exoneradoras)

```typescript
export const institutionCodes = sqliteTable('institution_codes', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['ministry', 'autonomous', 'municipality', 'other']
  }),
  isActive: integer('is_active').default(1),
});
```

---

## 4. Validaciones de Integridad

### 4.1 Constraints Importantes

```typescript
// En contacts:
// - Si documentType = 'extranjero_no_domiciliado' o 'no_contribuyente'
//   entonces documentNumber puede no ser numérico

// En sales:
// - Si documentType = '02' o '03' (ND/NC), referenceDocKey es obligatorio
// - Si saleCondition = '02' (Crédito), creditTermDays > 0

// En taxExemptions:
// - exemptionPercentage entre 0 y 100
// - exemptedAmountCents calculado sobre el monto base
```

---

## 5. Migraciones Requeridas

### Orden de ejecución:

```sql
-- 1. Crear tablas nuevas
CREATE TABLE activity_codes (...);
CREATE TABLE institution_codes (...);
CREATE TABLE tax_exemptions (...);
CREATE TABLE hacienda_api_log (...);
CREATE TABLE cae_authorizations (...);

-- 2. Agregar columnas a tablas existentes
ALTER TABLE contacts ADD COLUMN activity_code TEXT;
ALTER TABLE contacts ADD COLUMN emails TEXT;
ALTER TABLE contacts ADD COLUMN province_code TEXT;
ALTER TABLE contacts ADD COLUMN canton_code TEXT;
ALTER TABLE contacts ADD COLUMN district_code TEXT;
ALTER TABLE contacts ADD COLUMN neighborhood TEXT;

ALTER TABLE companies ADD COLUMN nit TEXT;
ALTER TABLE companies ADD COLUMN branch_code TEXT DEFAULT '001';
ALTER TABLE companies ADD COLUMN terminal_code TEXT DEFAULT '00001';
ALTER TABLE companies ADD COLUMN main_activity_code TEXT;
ALTER TABLE companies ADD COLUMN secondary_activity_codes TEXT;
ALTER TABLE companies ADD COLUMN taxpayer_type TEXT DEFAULT 'ordinary';
ALTER TABLE companies ADD COLUMN iva_regime TEXT DEFAULT 'general';

ALTER TABLE sales ADD COLUMN document_type TEXT DEFAULT '01';
ALTER TABLE sales ADD COLUMN sale_condition TEXT DEFAULT '01';
ALTER TABLE sales ADD COLUMN credit_term_days INTEGER DEFAULT 0;
ALTER TABLE sales ADD COLUMN payment_method_code TEXT DEFAULT '01';
ALTER TABLE sales ADD COLUMN reference_doc_key TEXT;
ALTER TABLE sales ADD COLUMN reference_doc_date TEXT;
ALTER TABLE sales ADD COLUMN reference_doc_type TEXT;
ALTER TABLE sales ADD COLUMN consecutive_number TEXT;
ALTER TABLE sales ADD COLUMN cae TEXT;
ALTER TABLE sales ADD COLUMN cae_expiration TEXT;

ALTER TABLE sale_items ADD COLUMN cabys_code TEXT;
ALTER TABLE sale_items ADD COLUMN tax_type TEXT;
ALTER TABLE sale_items ADD COLUMN tax_rate REAL;
ALTER TABLE sale_items ADD COLUMN tax_amount_cents INTEGER DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN unit_code TEXT DEFAULT 'Unid';
ALTER TABLE sale_items ADD COLUMN unit_price_without_tax_cents INTEGER;
ALTER TABLE sale_items ADD COLUMN discount_amount_cents INTEGER DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN discount_reason TEXT;

-- 3. Actualizar enums (Drizzle maneja esto en el código)
-- Los nuevos valores de enum se agregan en el código TypeScript

-- 4. Seed de catálogos
INSERT INTO activity_codes (code, description, section) VALUES (...);
INSERT INTO institution_codes (code, name, type) VALUES (...);
```

---

## 6. Notas de Implementación

### 6.1 Para el Módulo de Facturación Electrónica (Futuro)

El schema prepara todos los campos necesarios, pero el módulo de envío a Hacienda debe:

1. **Generar XML** según Anexo 4.4 usando estos campos
2. **Firmar digitalmente** con certificado del contribuyente
3. **Enviar a API** de Hacienda (https://api.hacienda.go.cr)
4. **Actualizar estados** en `sales.hacienda_status` y `hacienda_api_log`

### 6.2 Compatibilidad Retroactiva

- Los campos nuevos tienen defaults para no romper datos existentes
- `haciendaKey` ya existe y funciona con el generador actual
- Los tipos de documento nuevos se agregan como opciones adicionales

### 6.3 Rendimiento

- Índices adicionales en campos de búsqueda frecuente (documentKey, activityCode)
- JSON columns (emails, secondaryActivityCodes) para evitar tablas de relación

---

## 7. Checklist de Implementación

- [ ] Crear migration con nuevas tablas
- [ ] Crear migration con columnas adicionales
- [ ] Seed de activity_codes (catálogo Hacienda)
- [ ] Seed de institution_codes (instituciones exoneradoras)
- [ ] Actualizar tipos TypeScript
- [ ] Actualizar Zod schemas de validación
- [ ] Actualizar UI de contacts (nuevos campos)
- [ ] Actualizar UI de companies (config Hacienda)
- [ ] Actualizar lógica de generación de clave (usar branchCode/terminalCode)
- [ ] Tests de integridad de datos

---

## Referencias

- [Anexo Técnico 4.4 Hacienda CR](https://www.hacienda.go.cr)
- [CRLibre/API_Hacienda](https://github.com/CRLibre/API_Hacienda)
- [Catálogo Actividades Económicas](https://www.hacienda.go.cr)
- [Circular CCPA NIIF](https://ccpa.or.cr)

---

**Documento v1.0 - Mayo 2026**
**ContaPOS - Sistema ERP para Costa Rica**
