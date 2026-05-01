# Guía de Migración a ContaPOS

Esta guía describe cómo migrar datos desde sistemas legacy (Siigo, Contpaqi, Excel) hacia ContaPOS.

## 📋 Estrategia de Migración

### Nivel 1: Importación Manual (CSV/Excel)
Para negocios pequeños sin historial extenso.

1. **Preparar Plantillas**: Descargar las plantillas oficiales desde `/import`
2. **Mapeo de Columnas**: 
   - Productos: Nombre, Código, Precio, IVA, CABYS
   - Contactos: Nombre, Tipo (Cliente/Proveedor), RUC, Teléfono
3. **Validación**: El sistema validará formatos antes de importar
4. **Importación**: Usar el wizard de importación en `/import`

### Nivel 2: Migración Asistida (API)
Para negocios con historial en otros sistemas.

```bash
# Ejemplo de script de migración desde CSV
npx tsx scripts/migrate-from-csv.ts --type products --file productos_old.csv
```

### Nivel 3: Conectores Específicos
Conectores desarrollados para sistemas populares:

- **Siigo**: Exportar XML → Transformar → Importar
- **Contpaqi**: Exportar TXT → Mapear → Importar
- **Excel Genérico**: Plantilla estándar

## 🔄 Proceso de Migración Típico

1. **Backup**: Realizar backup del sistema anterior
2. **Extracción**: Exportar datos en formato compatible
3. **Limpieza**: Eliminar datos duplicados o corruptos
4. **Prueba**: Importar en entorno de pruebas (sandbox)
5. **Validación**: Verificar saldos, inventarios y contactos
6. **Producción**: Importar en entorno productivo
7. **Corte**: Definir fecha de corte entre sistemas

## ⚠️ Consideraciones Importantes

- **Saldos Iniciales**: Migrar solo saldos actuales, no todo el histórico
- **Facturación Electrónica**: Los documentos anteriores se mantienen en el sistema original como consulta
- **Inventario**: Realizar conteo físico antes de migrar
- **Clientes**: Validar correos y teléfonos para notificaciones

## 📞 Soporte de Migración

Para migraciones complejas (>10,000 registros), contactar a soporte Kairux para asistencia personalizada.
