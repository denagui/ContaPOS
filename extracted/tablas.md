# Tablas - Documentación Completa de la Aplicación Contabilidad

## Información General de la Aplicación

**Generado el:** 20/4/2026, 3:25:03 p.m.

**Nombre:** Contabilidad

**Descripción corta:** ¡Para saber donde está el dinero!

**Descripción:** Libro contable para registrar transacciones, catalogo de productos y servicios, precios. Para llevar el control de facturas, montos y plazos.

**Versión:** 1.000368

**Carpeta de app por defecto:** /appsheet/data/ModeloLibro_Diario_APELEX_2026-506494870-26-02-06

**Categoría:** Business Solution

**Función:** Administration

**Industria:** Financial Services

**¿Ejecutable?** Yes

**¿Desplegable?** No

**¿Solo uso personal?** No

**URL About:** https://kairux.cr/

---

## Resumen de Datos

- **5 Tablas**
- **87 Columnas**
- **3 Slices**

---

## Tablas

### Tabla: _Per User Settings

**Table name:** _Per User Settings

**Visible?** NEVER

**Shared?** No

**Data locale:** en-US

**Schema:** _Per User Settings_Schema

**Are updates allowed?** UPDATES_ONLY

**Source Path:** _Per User Settings

**Data Source:** native

**Store for image and file capture:** _Default

**Column Order List:** _RowNumber

**Partitioned across many files/sources?** No

**Partitioned across many worksheets?** No

---

### Tabla: Catalogo

**Table name:** Catalogo

**Visible?** ALWAYS

**Shared?** Yes

**Data locale:** en-US

**Schema:** Catalogo_Schema

**Are updates allowed?** ALL_CHANGES

**Source Path:** Modelo Libro_Diario_APELEX_2026

**Worksheet Name/Qualifier:** Catalogo

**Data Source:** google

**Store for image and file capture:** _Default

**Column Order List:** _RowNumber

**Partitioned across many files/sources?** No

**Partitioned across many worksheets?** No

---

### Tabla: Contactos

**Table name:** Contactos

**Visible?** ALWAYS

**Shared?** Yes

**Data locale:** en-US

**Schema:** Contactos_Schema

**Are updates allowed?** ALL_CHANGES

**Source Path:** Modelo Libro_Diario_APELEX_2026

**Worksheet Name/Qualifier:** Contactos

**Data Source:** google

**Store for image and file capture:** _Default

**Column Order List:** _RowNumber

**Partitioned across many files/sources?** No

**Partitioned across many worksheets?** No

---

### Tabla: Transacciones

**Table name:** Transacciones

**Visible?** ALWAYS

**Shared?** Yes

**Data locale:** en-US

**Schema:** Transacciones_Schema

**Are updates allowed?** ALL_CHANGES

**Source Path:** Modelo Libro_Diario_APELEX_2026

**Worksheet Name/Qualifier:** Transacciones

**Data Source:** google

**Store for image and file capture:** _Default

**Column Order List:** _RowNumber

**Partitioned across many files/sources?** No

**Partitioned across many worksheets?** No

---

### Tabla: Abonos

**Table name:** Abonos

**Visible?** ALWAYS

**Shared?** Yes

**Data locale:** en-US

**Schema:** Abonos_Schema

**Are updates allowed?** ALL_CHANGES

**Source Path:** Modelo Libro_Diario_APELEX_2026

**Worksheet Name/Qualifier:** Abonos

**Data Source:** google

**Store for image and file capture:** _Default

**Column Order List:** _RowNumber

**Partitioned across many files/sources?** No

**Partitioned across many worksheets?** No

---

## Slices

### Slice: Contactos Direccion is not blank

**Slice Name:** Contactos Direccion is not blank

**Slice Columns:**
- _RowNumber
- ID_Contacto
- Nombre_Razon_Social
- Cedula_RUC
- Tipo
- Telefono
- Email
- Direccion
- Logo
- Transacciones relacionadas

**Row filter condition:** ISNOTBLANK([Direccion])

**Update mode:** ALL_CHANGES

**Source Table:** Contactos

**Visible?** ALWAYS

**Slice Actions:**
- Delete
- Edit
- Compose Email (Email)
- Add
- Call Phone (Telefono)
- Send SMS (Telefono)

---

### Slice: Cuentas por Cobrar

**Slice Name:** Cuentas por Cobrar

**Slice Columns:**
- _RowNumber
- ID_Transaccion
- Fecha
- Tipo_Movimiento
- Contacto_Ref
- Item_Ref
- Detalle_Adicional
- Numero_Factura
- Clave_Hacienda
- Metodo_Pago
- Estado_Pago
- Cantidad
- Precio_Unitario
- Monto_Descuento
- Porcentaje_Descuento
- Porcentaje_IVA
- Moneda
- Tipo_Cambio
- Foto_Comprobante
- Condicion_Venta
- Plazo_Dias
- Fecha_Vencimiento
- Saldo_Actual
- Related Abonos
- Monto_IVA
- Total_Facturado
- Seccion_Financiera
- Resumen_Principal
- Estado_Real
- Resumen_Financiero
- Resumen_Identidad
- Resumen_Estado_Flujo
- Resumen_Legal
- Separador_General
- Separador_Economico
- Separador_Estado
- Espaciador_2
- corte_seccion3
- Resumen_Tiempos
- Resumen_Gestion_Pago
- Sugerencia_Accion
- corte_seccion1
- Descuento
- Resumen_Saldos
- Resumen_Impuestos_Total
- Resumen_Detalle_Venta

**Row filter condition:** =AND([Tipo_Movimiento] = "Ingreso", [Estado_Pago] = "Pendiente")

**Update mode:** ALL_CHANGES

**Source Table:** Transacciones

**Visible?** ALWAYS

**Slice Actions:** **auto**

---

### Slice: Cuentas por Pagar

**Slice Name:** Cuentas por Pagar

**Slice Columns:**
- _RowNumber
- ID_Transaccion
- Fecha
- Tipo_Movimiento
- Contacto_Ref
- Item_Ref
- Detalle_Adicional
- Numero_Factura
- Clave_Hacienda
- Metodo_Pago
- Estado_Pago
- Cantidad
- Precio_Unitario
- Monto_Descuento
- Porcentaje_Descuento
- Porcentaje_IVA
- Moneda
- Tipo_Cambio
- Foto_Comprobante
- Condicion_Venta
- Plazo_Dias
- Fecha_Vencimiento
- Saldo_Actual
- Related Abonos
- Monto_IVA
- Total_Facturado
- Seccion_Financiera
- Resumen_Principal
- Estado_Real
- Resumen_Financiero
- Resumen_Identidad
- Resumen_Estado_Flujo
- Resumen_Legal
- Separador_General
- Separador_Economico
- Separador_Estado
- Espaciador_2
- corte_seccion3
- Resumen_Tiempos
- Resumen_Gestion_Pago
- Sugerencia_Accion
- corte_seccion1
- Descuento
- Resumen_Saldos
- Resumen_Impuestos_Total
- Resumen_Detalle_Venta

**Row filter condition:** =AND([Tipo_Movimiento] = "Gasto", [Estado_Pago] = "Pendiente")

**Update mode:** ALL_CHANGES

**Source Table:** Transacciones

**Visible?** ALWAYS

**Slice Actions:** **auto**
