# Sistema POA - Gestión y Seguimiento del Plan Operativo Anual

Una aplicación web completa para la gestión y seguimiento del Plan Operativo Anual (POA) orientada al sector público, con sistema de permisos granular basado en roles (RBAC).

## 🚀 Estado Actual - FASE 2 COMPLETADA ✅

**Versión**: v2.0.0  
**Progreso**: 90% del sistema base + 40% planificación POA  
**Estado**: ✅ FASES 1 y 2 completamente funcionales  

### ✅ Funcionalidades Implementadas

#### 🔐 Sistema de Autenticación
- Login funcional con JWT (7 días de expiración)
- Verificación automática de tokens con `/auth/me`
- Tarjetas de login rápido para diferentes roles
- UI responsiva al 100% de ancho
- Middleware de seguridad completo

#### 🏢 Gestión de Departamentos
- CRUD completo con API REST
- Estructura jerárquica (departamentos padre/hijo)
- Interfaz moderna con Material-UI
- 13 departamentos de ejemplo ya creados
- Validaciones robustas frontend y backend

#### 👥 Gestión de Usuarios
- CRUD completo con asignación departamental
- 5 roles predefinidos con 49 permisos granulares
- Búsqueda y filtrado avanzado
- Estados activo/inactivo
- 4 usuarios de prueba con diferentes roles

#### 📊 Base de Datos Completa
- Schema Prisma completamente definido
- SQLite poblada con datos de prueba
- 14 tablas con relaciones completas
- Datos de ejemplo listos para uso

#### 🎯 FASE 2: Planificación POA - COMPLETADA ✅

##### ✅ Ejes Estratégicos (FASE 1)
- **Backend**: API REST completa con CRUD
- **Frontend**: Interfaz completa de gestión
- **Validaciones**: Códigos únicos, años, departamentos
- **Datos**: 5 ejes estratégicos de ejemplo
- **Testing**: Completamente verificado

##### ✅ Objetivos Estratégicos (FASE 2)
- **Backend**: API REST completa `/api/objectives`
- **Frontend**: Componente ObjectiveManagement con Material-UI
- **Relaciones**: Vinculación jerárquica con ejes estratégicos
- **Validaciones**: Códigos únicos por eje, campos requeridos
- **Vista Agrupada**: Acordeones por eje estratégico
- **Filtros**: Por eje estratégico con switch de agrupación
- **Datos**: 15 objetivos distribuidos en 5 ejes (3 por eje)
- **Códigos**: Estructura OBJ-001-01, OBJ-001-02, etc.
- **Testing**: Funcionamiento completo verificado

#### 🔄 PRÓXIMAS FASES

##### 🔄 FASE 3: Productos/Servicios (Próximo)
- Backend: API REST para productos/servicios
- Frontend: Gestión de productos por objetivo
- Relaciones: Productos vinculados a objetivos
- Métricas: Conteo y seguimiento

##### 🔄 FASE 4: Actividades (Pendiente)
- Backend: API REST para actividades
- Frontend: Gestión de actividades por producto
- Calendario: Programación temporal
- Responsables: Asignación de usuarios

##### 🔄 FASE 5: Indicadores (Pendiente)
- Backend: API REST para indicadores
- Frontend: Configuración de métricas
- Dashboard: Visualización de resultados
- Reportes: Exportación de datos

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Backend**: Node.js + Express.js + Prisma ORM
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Frontend**: React 18 + Material-UI + Vite
- **Autenticación**: JWT con middleware personalizado
- **Validación**: Joi/Express-validator
- **Logs**: Winston logger

### Estructura de Directorios
```
dpdPlanner/
├── backend/
│   ├── prisma/           # Schema y migraciones
│   ├── src/
│   │   ├── middleware/   # Auth, errors, validations
│   │   ├── routes/       # API endpoints
│   │   └── utils/        # Helpers y utilidades
│   └── uploads/          # Archivos subidos
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── contexts/     # Context API
│   │   ├── pages/        # Páginas principales
│   │   └── theme/        # Material-UI theme
└── docs/                 # Documentación
```

## 🚀 Instalación y Uso

### Prerequisitos
- Node.js 18+
- npm o yarn
- Git

### Backend Setup
```bash
cd backend
npm install
npm run setup      # Configura BD y datos iniciales
npm run dev        # Servidor en puerto 3001
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Servidor en puerto 5173
```

### Datos de Prueba
```bash
# Usuarios predefinidos:
admin@poa.gov / admin123          # Administrador
planificacion@poa.gov / 123456    # Director de Planificación  
tecnico@poa.gov / 123456          # Técnico Registrador
```

## 📊 Estructura POA Implementada

### Jerarquía de Planificación
```
📈 Ejes Estratégicos (5)
  └── 🎯 Objetivos (15 - 3 por eje)
      └── 🎁 Productos/Servicios (Próximo)
          └── ⚙️ Actividades (Pendiente)
              └── 📊 Indicadores (Pendiente)
```

### Datos Actuales
- **5 Ejes Estratégicos**: Modernización, Talento Humano, Gestión Financiera, Planificación, Atención Ciudadana
- **15 Objetivos**: Distribuidos equitativamente (3 por eje)
- **13 Departamentos**: Estructura organizacional completa
- **4 Usuarios**: Diferentes roles y permisos
- **49 Permisos**: Sistema granular de acceso

## 📱 Capturas de Pantalla

### Dashboard Principal
- Vista general del sistema POA
- Métricas y indicadores clave
- Navegación intuitiva

### Gestión de Objetivos
- Lista agrupada por eje estratégico
- Formularios de creación/edición
- Filtros y búsquedas avanzadas

### Sistema de Permisos
- Roles predefinidos
- Permisos granulares por recurso
- Asignación departamental

## 🔧 APIs Disponibles

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Renovar token

### Gestión POA
- `GET|POST|PUT|DELETE /api/strategic-axes` - Ejes estratégicos
- `GET|POST|PUT|DELETE /api/objectives` - Objetivos
- Filtros: `?year=2025&department=abc&active=true`

### Administración
- `GET|POST|PUT|DELETE /api/users` - Usuarios
- `GET|POST|PUT|DELETE /api/roles` - Roles
- `GET|POST|PUT|DELETE /api/departments` - Departamentos

## 🧪 Testing

### Backend
```bash
npm test           # Pruebas unitarias
npm run test:api   # Pruebas de API
npm run test:coverage  # Cobertura de código
```

### Frontend
```bash
npm test           # Jest + React Testing Library
npm run test:e2e   # Cypress E2E (en desarrollo)
```

## 📈 Progreso del Proyecto

| Módulo | Backend | Frontend | Testing | Estado |
|--------|---------|----------|---------|--------|
| Autenticación | ✅ | ✅ | ✅ | Completo |
| Usuarios | ✅ | ✅ | ✅ | Completo |
| Departamentos | ✅ | ✅ | ✅ | Completo |
| Ejes Estratégicos | ✅ | ✅ | ✅ | Completo |
| Objetivos | ✅ | ✅ | ✅ | Completo |
| Productos | 🔄 | 🔄 | ❌ | En progreso |
| Actividades | ❌ | ❌ | ❌ | Pendiente |
| Indicadores | ❌ | ❌ | ❌ | Pendiente |
| Reportes | ❌ | ❌ | ❌ | Pendiente |

## 🤝 Contribución

### Flujo de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commits descriptivos con emojis
4. Pull request con descripción detallada

### Convenciones
- **Commits**: Usar emojis descriptivos (✨ feat, 🐛 fix, 📚 docs)
- **Código**: ESLint + Prettier configurados
- **Testing**: Coverage mínimo del 80%

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🏛️ Créditos

Desarrollado para el sector público con fines de mejorar la gestión y seguimiento del Plan Operativo Anual (POA).

---

**Estado del Sistema**: ✅ Funcionando en desarrollo  
**Última Actualización**: Diciembre 2024  
**Versión**: v2.0.0 - FASE 2 Completada
