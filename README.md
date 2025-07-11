# Sistema POA - Gestión y Seguimiento del Plan Operativo Anual

Una aplicación web completa para la gestión y seguimiento del Plan Operativo Anual (POA) orientada al sector público, con sistema de permisos granular basado en roles (RBAC).

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

**Backend:**
- Node.js + Express.js
- PostgreSQL
- Prisma ORM
- JWT para autenticación
- bcryptjs para hash de contraseñas
- Multer para manejo de archivos

**Frontend:**
- React.js 18
- Vite (entorno de desarrollo)
- Material-UI (MUI) para componentes
- React Router para navegación
- React Query para gestión de estado
- Axios para peticiones HTTP

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (versión 18 o superior)
- PostgreSQL (versión 13 o superior)
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd poa-management-system
```

### 2. Configuración del Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

Edita el archivo `.env` con tu configuración:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/poa_management?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH="./uploads"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"
```

### 3. Configuración de la Base de Datos

```bash
# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:push

# Poblar base de datos con datos iniciales
npm run db:seed
```

### 4. Configuración del Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install
```

### 5. Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 👥 Usuarios de Demostración

El sistema viene con usuarios predefinidos para pruebas:

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| Administrador | admin@poa.gov | admin123456 | Acceso completo al sistema |
| Director de Planificación | planificacion@poa.gov | planning123 | Planificación y seguimiento global |
| Director Financiero | finanzas@poa.gov | finance123 | Supervisión de área y aprobaciones |
| Técnico Registrador | tecnico@poa.gov | tecnico123 | Registro de avances asignados |

## 📊 Módulos del Sistema

### 1. Módulo de Autenticación y Autorización
- Sistema RBAC (Role-Based Access Control)
- JWT para sesiones
- Permisos granulares por acción y recurso

### 2. Módulo de Administración
- Gestión de usuarios
- Configuración de roles y permisos
- Estructura de departamentos

### 3. Módulo de Planificación
- Ejes estratégicos
- Objetivos
- Productos/Servicios
- Actividades
- Indicadores de desempeño

### 4. Módulo de Seguimiento
- Reportes de avance
- Carga de archivos adjuntos
- Sistema de aprobación
- Comentarios cualitativos

### 5. Módulo de Ejecución Presupuestaria
- Partidas presupuestarias
- Seguimiento: Asignado, Comprometido, Devengado, Pagado
- Cálculo automático de porcentajes de ejecución

### 6. Módulo de Dashboards
- Visualización de avances
- Gráficos interactivos
- Filtros por departamento, eje, período
- Sistema de semáforos (rojo, amarillo, verde)

## 🔐 Sistema de Permisos

### Roles Predefinidos

**Administrador del Sistema:**
- CRUD completo sobre todos los módulos
- Gestión de usuarios, roles y permisos
- Configuración del sistema

**Director de Planificación:**
- CRUD sobre estructura del POA
- Bloqueo del POA una vez aprobado
- Acceso de lectura a todos los reportes

**Director de Área:**
- Lectura de estructura completa del POA
- Lectura de reportes de su área
- Aprobación/rechazo de reportes de su equipo

**Técnico Registrador:**
- Lectura de actividades asignadas
- Creación/actualización de reportes propios
- Acceso limitado a sus responsabilidades

**Auditor:**
- Lectura total de toda la información
- Sin permisos de modificación

### Estructura de Permisos

Los permisos siguen el formato `acción:recurso`:

- **Acciones:** create, read, update, delete, approve, reject, lock
- **Recursos:** user, role, permission, department, strategic_axis, objective, product, activity, indicator, progress_report, budget, dashboard

## 📁 Estructura del Proyecto

```
poa-management-system/
├── backend/
│   ├── src/
│   │   ├── middleware/      # Autenticación y autorización
│   │   ├── routes/          # Endpoints de la API
│   │   ├── utils/           # Utilidades y validadores
│   │   └── server.js        # Servidor principal
│   ├── prisma/
│   │   ├── schema.prisma    # Esquema de base de datos
│   │   └── seed.js          # Datos iniciales
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── contexts/        # Contextos de React
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── theme/           # Configuración de Material-UI
│   │   └── App.jsx          # Componente principal
│   └── package.json
└── README.md
```

## 🛠️ Scripts Disponibles

### Backend
```bash
npm run dev          # Servidor en modo desarrollo
npm run start        # Servidor en producción
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Aplicar cambios al esquema
npm run db:migrate   # Ejecutar migraciones
npm run db:seed      # Poblar base de datos
```

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter
```

## 📈 Características Principales

### Seguridad
- Autenticación JWT
- Hash de contraseñas con bcrypt
- Rate limiting
- Validación de datos
- Helmet para headers de seguridad
- CORS configurado

### Usabilidad
- Interfaz moderna y responsiva
- Navegación intuitiva
- Feedback visual con notificaciones
- Loading states
- Manejo de errores

### Funcionalidad
- Sistema de permisos granular
- Carga de archivos
- Filtros y búsquedas
- Exportación de reportes
- Dashboards interactivos

## 🚀 Despliegue

### Variables de Entorno para Producción

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/poa_db
JWT_SECRET=your-super-secure-production-secret
CORS_ORIGIN=https://your-production-domain.com
```

### Build de Producción

```bash
# Backend
cd backend
npm run start

# Frontend
cd frontend
npm run build
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contacta al equipo de desarrollo.

---

**Sistema POA** - Modernizando la gestión pública con tecnología 🏛️✨
