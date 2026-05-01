# Guía de Migración a ContaPOS

## Introducción
Esta guía describe el proceso para migrar datos desde sistemas legacy (Siigo, QuickBooks, Excel, otros POS) hacia ContaPOS.

## Estrategia de Migración

### Nivel 1: Importación Manual (CSV/Excel)
Para negocios pequeños sin historial extenso.

**Pasos:**
1. Exportar datos del sistema anterior a CSV
2. Usar nuestro importador inteligente en `/import`
3. Validar datos en modo sandbox
4. Confirmar importación

**Plantillas disponibles:**
- `products_template.csv` - Productos con CABYS
- `contacts_template.csv` - Clientes y proveedores
- `opening_balances.csv` - Saldos iniciales

### Nivel 2: Migración Asistida
Para negocios medianos con histórico de 1-3 años.

**Proceso:**
1. Contacto con equipo de implementación
2. Análisis de estructura de datos origen
3. Mapeo personalizado de campos
4. Ejecución de script ETL customizado
5. Validación paralela (sistema viejo vs nuevo por 1 semana)

### Nivel 3: Migración Enterprise
Para cadenas o negocios con +3 años de histórico.

**Incluye:**
- API dedicada de migración
- Migración incremental en tiempo real
- Capacitación personalizada
- Soporte prioritario 30 días post-migración

## Datos Migrables

### ✅ Migración Automática (100%)
- Catálogo de productos (con códigos de barras)
- Contactos (clientes/proveedores)
- Inventario inicial
- Listas de precios

### ⚠️ Migración Semi-Automática (80%)
- Histórico de ventas (últimos 12 meses recomendado)
- Cuentas por cobrar (fiados activos)
- Cuentas por pagar

### ❌ No Migrable (Recomendado iniciar limpio)
- Transacciones cerradas de años anteriores
- Logs de auditoría antiguos
- Configuraciones obsoletas

## Proceso Paso a Paso

### Fase 1: Preparación (2-3 días antes)
1. **Auditoría de datos**: Limpiar duplicados en sistema origen
2. **Backup completo**: Respaldo total antes de tocar nada
3. **Definir fecha de corte**: Idealmente fin de mes o quincena

### Fase 2: Extracción (Día 1)
```bash
# Ejemplo de exportación desde MySQL (Siigo/otros)
mysqldump -u user -p database_name \
  --tables products contacts sales \
  --result-file=export_legacy.sql
```

### Fase 3: Transformación (Día 2)
Nuestro equipo convierte los datos al formato ContaPOS:
- Normalización de códigos CABYS
- Conversión de impuestos a tasas CR (0%, 4%, 8%, 13%)
- Generación de claves Hacienda para documentos históricos

### Fase 4: Carga (Día 3 - Fin de semana)
1. **Carga masiva inicial**: Productos y contactos
2. **Validación**: Conteo y muestreo aleatorio
3. **Carga transaccional**: Ventas y saldos
4. **Pruebas**: Flujo completo de venta

### Fase 5: Go-Live (Día 4 - Lunes temprano)
1. **Cierre definitivo** en sistema antiguo
2. **Última sincronización** de movimientos del fin de semana
3. **Apertura oficial** en ContaPOS
4. **Soporte in-situ** (opcional)

## Consideraciones Fiscales (Costa Rica)

### Facturación Electrónica
- Las facturas emitidas en el sistema anterior **NO se re-emiten** en ContaPOS
- Se migra el **saldo** de cuentas por cobrar
- Se conserva numeración consecutiva según resolución DGT

### Libros Contables
- Se recomienda cerrar ejercicio fiscal en sistema antiguo
- Iniciar ContaPOS en período fiscal nuevo
- Migrar solo saldos iniciales de balance

## Herramientas Incluidas

### Importador Inteligente
- Detección automática de columnas
- Validación de RUC/Cédulas costarricenses
- Previsualización antes de importar
- Corrección de errores en lote

### Script de Migración SQL
Disponible bajo solicitud para casos especiales:
```bash
npx tsx scripts/migrate-from-[system].ts
```

## Post-Migración

### Semana 1: Monitoreo Intensivo
- Revisión diaria de cuadros de venta
- Verificación de inventarios críticos
- Ajuste de configuraciones según uso real

### Mes 1: Optimización
- Análisis de reportes vs sistema anterior
- Capacitación adicional si necesaria
- Ajuste de feature flags por industria

## Soporte

**Email:** migration@kairux.cr  
**WhatsApp:** +506 XXXX-XXXX  
**Horario:** Lunes a Viernes 8am - 6pm CR

## Casos de Éxito

### Pulpería "El Ahorro" (San José)
- **Sistema anterior:** Excel + Cuaderno
- **Datos migrados:** 450 productos, 120 clientes fiado
- **Tiempo:** 4 horas
- **Resultado:** Operativo mismo día

### Restaurante "La Soda" (Heredia)
- **Sistema anterior:** Siigo Small
- **Datos migrados:** 200 recetas, 3 años de ventas
- **Tiempo:** 2 días
- **Resultado:** Reducción 40% tiempo cierre diario

---

*Última actualización: Mayo 2026*  
*Versión del documento: 1.2*
