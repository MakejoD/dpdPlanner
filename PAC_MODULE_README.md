# Módulo PAC (Plan Anual de Compras) - Integración Completa

## 📋 Descripción General

El módulo PAC (Plan Anual de Compras) es una extensión integral del sistema POA que permite la gestión completa de procesos de compras y contrataciones, con vinculación bidireccional al Plan Operativo Anual y cumplimiento de las normativas de la DGCP (Dirección General de Contrataciones Públicas) de República Dominicana.

## 🎯 Características Principales

### ✅ Gestión de Procesos de Compra
- **CRUD completo** de procesos de compra
- **Códigos CUCI** únicos para cada proceso
- **Métodos de contratación** según normativa DGCP
- **Fuentes de financiamiento** diversificadas
- **Estados de proceso** con flujo de trabajo definido
- **Cronogramas** de ejecución con fechas planificadas

### ✅ Vinculación POA-PAC
- **Vinculación bidireccional** entre actividades POA y procesos PAC
- **Validación presupuestaria** en tiempo real
- **Alertas de inconsistencia** automáticas
- **Análisis de dependencias** entre actividades y compras
- **Clasificación de vínculos** (esenciales/no esenciales)

### ✅ Control Presupuestario
- **Verificación automática** de disponibilidad presupuestaria
- **Alertas de sobrecosto** por actividad
- **Análisis comparativo** POA vs PAC
- **Reportes de consistencia** presupuestaria
- **Tracking de ejecución** financiera

### ✅ Roles y Permisos Especializados
- **Director de Compras y Contrataciones**: Control total del módulo
- **Analista de Compras**: Gestión de procesos específicos
- **Coordinador PAC**: Coordinación y supervisión
- **14 permisos específicos** para funciones detalladas

### ✅ Reportes y Análisis Avanzados
- **Dashboard ejecutivo** con métricas clave
- **Reportes de cumplimiento** normativo
- **Análisis presupuestario** comparativo
- **Cronogramas de ejecución** por período
- **Exportación** de datos en múltiples formatos

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + Express + Prisma)

#### Modelos de Base de Datos
```prisma
model ProcurementProcess {
  id                  String   @id @default(uuid())
  cuciCode           String   @unique
  description        String
  procurementMethod  String
  fundingSource      String
  totalCost          Float
  plannedStartDate   DateTime
  plannedEndDate     DateTime?
  actualStartDate    DateTime?
  actualEndDate      DateTime?
  status             String   @default("PLANIFICADO")
  fiscalYear         Int
  department         Department @relation(fields: [departmentId], references: [id])
  departmentId       String
  createdBy          User     @relation(fields: [createdById], references: [id])
  createdById        String
  activityLinks      ActivityProcurementLink[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model ActivityProcurementLink {
  id                   String   @id @default(uuid())
  activity             Activity @relation(fields: [activityId], references: [id])
  activityId           String
  procurementProcess   ProcurementProcess @relation(fields: [procurementProcessId], references: [id])
  procurementProcessId String
  linkReason          String?
  isEssential         Boolean  @default(true)
  linkedBy            User     @relation(fields: [linkedById], references: [id])
  linkedById          String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@unique([activityId, procurementProcessId])
}
```

#### APIs Principales
- **`/api/procurement-processes`**: CRUD completo de procesos
- **`/api/activity-procurement-links`**: Gestión de vinculaciones
- **`/api/procurement-processes/reports`**: Reportes y análisis

### Frontend (React + Material-UI)

#### Componentes Principales
- **`ProcurementManagement.jsx`**: Gestión principal de procesos
- **`POAPACLinking.jsx`**: Vinculación POA-PAC
- **`PACReports.jsx`**: Reportes y análisis

## 🚀 Instalación y Configuración

### 1. Configuración de Base de Datos
```bash
# Aplicar migraciones de Prisma
cd backend
npx prisma db push
```

### 2. Configuración del Módulo PAC
```bash
# Ejecutar script de configuración completa
node setup-pac-complete.js
```

### 3. Verificación de la Instalación
```bash
# Ejecutar tests del módulo
node test-pac-module.js
```

## 📊 Uso del Sistema

### Gestión de Procesos de Compra

1. **Crear Proceso**:
   - Definir código CUCI único
   - Seleccionar método de contratación
   - Establecer cronograma y presupuesto
   - Asignar departamento responsable

2. **Seguimiento**:
   - Actualizar estados del proceso
   - Registrar fechas reales de ejecución
   - Documentar observaciones y cambios

### Vinculación POA-PAC

1. **Crear Vínculos**:
   - Seleccionar actividad del POA
   - Asociar con proceso de compra
   - Justificar la vinculación
   - Clasificar como esencial/no esencial

2. **Análisis de Consistencia**:
   - Verificar coherencia presupuestaria
   - Revisar alertas automáticas
   - Resolver inconsistencias detectadas

### Reportes y Análisis

1. **Dashboard Ejecutivo**:
   - Métricas generales del PAC
   - Estado de procesos por departamento
   - Ejecución presupuestaria

2. **Análisis Presupuestario**:
   - Comparación POA vs PAC
   - Alertas de inconsistencia
   - Recomendaciones de ajuste

## 🔒 Seguridad y Permisos

### Matriz de Permisos PAC

| Rol | Crear | Leer | Actualizar | Eliminar | Aprobar | Reportes |
|-----|-------|------|------------|----------|---------|----------|
| Director Compras | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analista Compras | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Coordinador PAC | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |

### Controles de Acceso
- **Filtrado por departamento**: Los usuarios solo ven procesos de su departamento
- **Validación de roles**: Verificación automática de permisos
- **Auditoría completa**: Registro de todas las acciones

## 📈 Métricas y KPIs

### Indicadores Principales
- **Procesos planificados vs ejecutados**
- **Cumplimiento de cronogramas**
- **Ejecución presupuestaria**
- **Eficiencia por departamento**
- **Cumplimiento normativo**

### Alertas Automáticas
- **Sobrecostos detectados**
- **Inconsistencias presupuestarias**
- **Retrasos en cronogramas**
- **Procesos sin vinculación POA**

## 🛠️ Desarrollo y Mantenimiento

### Scripts de Utilidad
- **`setup-pac-complete.js`**: Configuración inicial completa
- **`test-pac-module.js`**: Batería de tests del módulo
- **`create-sample-data.js`**: Datos de ejemplo para desarrollo

### Endpoints de Testing
- **`GET /api/procurement-processes/health`**: Estado del módulo
- **`POST /api/procurement-processes/validate`**: Validación de datos
- **`GET /api/activity-procurement-links/stats`**: Estadísticas de vinculación

## 🔄 Integración con POA

### Puntos de Integración
1. **Actividades**: Vinculación directa con procesos de compra
2. **Presupuesto**: Validación cruzada de montos
3. **Departamentos**: Gestión por unidad organizacional
4. **Usuarios**: Sistema de permisos unificado
5. **Reportes**: Análisis conjunto POA-PAC

### Flujo de Datos
```
POA Activity → Budget Validation → PAC Process → Execution Tracking → Consolidated Reports
```

## 📋 Cumplimiento Normativo

### Normativas DGCP Implementadas
- **Código CUCI obligatorio**
- **Métodos de contratación según ley**
- **Documentación de procesos**
- **Transparencia en reportes**
- **Auditoría de procesos**

### Documentación Requerida
- **Plan Anual de Compras formal**
- **Justificación de vinculaciones POA**
- **Reportes de ejecución mensual**
- **Análisis de desviaciones**

## 🚨 Solución de Problemas

### Problemas Comunes

1. **Error de permisos PAC**:
   ```bash
   # Re-ejecutar configuración de roles
   node setup-pac-complete.js
   ```

2. **Inconsistencias presupuestarias**:
   - Verificar montos en actividades POA
   - Revisar costos de procesos PAC
   - Ejecutar validación automática

3. **Procesos sin vinculación**:
   - Utilizar interfaz de vinculación POA-PAC
   - Verificar permisos de vinculación
   - Revisar disponibilidad de actividades

## 📞 Soporte y Contacto

Para soporte técnico del módulo PAC:
- **Email**: soporte@dpdplanner.gov.do
- **Documentación**: Ver carpeta `/docs/pac/`
- **Issues**: Utilizar sistema de tickets interno

---

## 🎉 Estado de Implementación

### ✅ Completado
- [x] Modelo de base de datos PAC
- [x] APIs backend completas
- [x] Sistema de permisos y roles
- [x] Interfaces React frontend
- [x] Vinculación POA-PAC
- [x] Reportes y análisis
- [x] Scripts de configuración
- [x] Documentación completa

### 🔄 En Desarrollo
- [ ] Módulo de exportación avanzada
- [ ] Integración con sistemas externos DGCP
- [ ] Dashboard ejecutivo avanzado
- [ ] Módulo de auditoría detallada

El módulo PAC está **completamente funcional** e integrado con el sistema POA existente. Proporciona una solución integral para la gestión de compras públicas con cumplimiento normativo completo.
