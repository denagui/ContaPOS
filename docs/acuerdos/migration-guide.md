# 📥 Guía de Migración e Importación de Datos

## Visión General
El sistema ContaPOS incluye un motor de importación inteligente ("Smart Import Engine") diseñado para facilitar la migración desde sistemas legacy, Excel o CSV sin pérdida de datos ni integridad.

## 1. Preparación de Datos

### Formatos Soportados
- **CSV**: Separado por comas o punto y coma.
- **Excel (.xlsx)**: Plantillas estructuradas.
- **JSON**: Para migraciones programáticas.

### Plantillas Oficiales
El sistema proporciona plantillas descargables con las columnas exactas requeridas:
- `template_products.csv`: Código, Nombre, CABYS, Precio, Impuesto, Stock.
- `template_contacts.csv`: Nombre, Tipo (Cliente/Proveedor), RUC/DNI, Teléfono.
- `template_expenses.csv`: Fecha, Proveedor, Monto, Impuesto, Categoría.

## 2. Proceso de Importación (Wizard de 3 Pasos)

### Paso 1: Carga y Mapeo
- El usuario sube el archivo.
- El sistema detecta automáticamente las columnas (ej: "Nombre" → `name`, "Precio" → `unitPrice`).
- Si hay ambigüedad, el usuario asigna manualmente la columna de origen al campo de destino.

### Paso 2: Validación y Limpieza
- **Validación de Tipos**: Verifica que los precios sean números, las fechas válidas, etc.
- **Validación Fiscal**: Comprueba que los códigos CABYS tengan 13 dígitos y los RUCs sean válidos.
- **Detección de Duplicados**: Identifica productos o clientes existentes por código o nombre.
- **Reporte de Errores**: Muestra una tabla con filas erróneas y la razón exacta (ej: "Fila 4: CABYS inválido").

### Paso 3: Sandbox y Confirmación
- **Modo Sandbox**: Simula la importación sin escribir en la base de datos.
- **Previsualización**: Muestra cómo quedarán los registros (ej: "Se crearán 150 productos, se actualizarán 5").
- **Ejecución Atómica**: Si todo es correcto, se ejecuta la transacción. Si falla una fila crítica, se revierte todo.

## 3. Migración desde Sistemas Específicos

### Desde Siigo / Contabilidad Tradicional
1.  Exportar "Listado de Terceros" y "Listado de Ítems" a Excel.
2.  Usar nuestra herramienta de conversión (script Python/Node) para mapear columnas de Siigo a nuestro schema.
3.  Importar el resultado mediante el Wizard.

### Desde AppSheet / No-Code
1.  Descargar datos en CSV desde la vista de AppSheet.
2.  Limpiar columnas calculadas (fórmulas) que no son necesarias.
3.  Importar directamente.

## 4. Consideraciones Técnicas

### Transaccionalidad
- Todas las importaciones masivas se ejecutan dentro de una transacción de base de datos.
- **Rollback automático** si ocurre cualquier error durante el proceso.

### Rendimiento
- Límite de 10,000 registros por lote para evitar timeouts.
- Procesamiento en segundo plano (Job Queue) para archivos muy grandes (>50MB).

### Seguridad
- Validación estricta de tipos para prevenir inyección SQL.
- Los archivos subidos se eliminan inmediatamente después del procesamiento.

## 5. Post-Migración
- **Auditoría**: El sistema registra quién importó qué y cuándo en la tabla `audit_logs`.
- **Verificación**: Se recomienda realizar un conteo manual de registros críticos (Caja, Inventario) tras la migración.
