# 🚀 Backend - Sistema POA-PACC

Backend API del Sistema de Gestión de Plan Operativo Anual (POA) y Plan Anual de Contrataciones y Compras (PACC).

## ⚡ INSTALACIÓN RÁPIDA

### Para nuevas instalaciones desde repositorio:

```bash
# 1. Clonar e instalar dependencias
git clone [URL_REPOSITORIO]
cd dpdPlanner/backend
npm install

# 2. Configurar base de datos
npx prisma generate
npx prisma db push

# 3. CONFIGURACIÓN AUTOMÁTICA COMPLETA ⭐
npm run setup-complete

# 4. Iniciar servidor
npm start
```

**¡Listo! El sistema estará funcionando con datos de ejemplo en http://localhost:3001**

## 🔐 Credenciales de Acceso

Después de ejecutar `setup-complete`:

```
👨‍💼 Administrador:
   📧 admin@poa.gov
   🔑 admin123

👩‍💼 Director de Planificación:
   📧 director.planificacion@poa.gov
   🔑 director123

👨‍💼 Director de Compras:
   📧 director.compras@poa.gov
   🔑 compras123
```

## 🛠️ Scripts Disponibles

```bash
# Configuración completa automática (RECOMENDADO)
npm run setup-complete

# Configuración rápida básica
npm run setup-quick

# Solo inicializar sistema (si DB ya existe)
npm run system:init

# Resetear completamente el sistema
npm run system:reset

# Desarrollo con auto-reload
npm run dev

# Producción
npm start

# Generar cliente Prisma
npm run db:generate

# Aplicar cambios de esquema
npm run db:push

# Ejecutar migraciones
npm run db:migrate
```

## 🚀 Scripts del Sistema

### Configuración Inicial
```bash
npm run setup-complete    # Instalación completa automática
npm run system:init       # Solo inicializar datos del sistema
npm run system:reset      # Resetear y reinstalar
```

### Utilidades del Sistema
```bash
npm run system:status     # Verificar estado del sistema
npm run system:test       # Probar todos los endpoints
npm run permissions:add   # Agregar permisos faltantes
```

## 📁 Estructura Organizada

```
backend/
├── src/                    # Código fuente principal
│   ├── routes/            # 20 endpoints organizados ✅
│   ├── middleware/        # Middlewares de seguridad ✅
│   ├── utils/            # Utilidades comunes ✅
│   └── server.js         # Servidor principal ✅
├── scripts/              # Scripts organizados (11 archivos)
│   ├── setup.js          # Configuración completa
│   ├── test.js           # Verificación de endpoints
│   ├── system-status-check.js
│   └── [otros scripts útiles]
├── prisma/               # Configuración de base de datos ✅
└── package.json          # Scripts actualizados ✅
```

## ✅ Limpieza Realizada

**Se eliminaron 60+ archivos innecesarios:**
- 40+ archivos `test-*.js` duplicados
- 6+ archivos `setup-*.js` redundantes  
- 14+ archivos `create-*.js` obsoletos
- Scripts de debug temporales
- Archivos de verificación ad-hoc

**Resultado**: Sistema limpio, organizado y mantenible.

## 📊 Endpoints Principales

```
POST /api/auth/login          - Autenticación
GET  /api/users               - Lista de usuarios
GET  /api/departments         - Departamentos
GET  /api/strategic-axes      - Ejes estratégicos  
GET  /api/objectives          - Objetivos
GET  /api/products            - Productos
GET  /api/activities          - Actividades
GET  /api/indicators          - Indicadores
GET  /api/progress-reports    - Reportes de progreso
GET  /api/budget-execution    - Ejecución presupuestaria
GET  /api/pacc/compliance/latest - Cumplimiento PACC
GET  /api/procurement-processes  - Procesos de contratación
```

## 🗄️ Base de Datos

- **Motor**: SQLite (desarrollo) / PostgreSQL (producción)
- **ORM**: Prisma
- **Archivo**: `dev.db`
- **Esquema**: `prisma/schema.prisma`

## 🔧 Variables de Entorno

El script de configuración crea automáticamente `.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dpd-planner-super-secret-jwt-key-2025-v3"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL="http://localhost:5173"
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/         # Controladores de rutas
│   ├── middleware/          # Middleware personalizado
│   ├── routes/              # Definición de rutas
│   ├── services/            # Lógica de negocio
│   ├── utils/               # Utilidades
│   └── server.js            # Servidor principal
├── prisma/
│   ├── schema.prisma        # Esquema de base de datos
│   └── migrations/          # Migraciones
├── setup-system-final.js   # Configuración automática completa
├── quick-setup.js           # Configuración rápida
└── package.json
```

## 🧪 Verificación

Para verificar que todo funciona:

```bash
# Salud del API
curl http://localhost:3001/api/health

# Login de prueba
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@poa.gov","password":"admin123"}'

# Datos PACC
curl http://localhost:3001/api/pacc/compliance/latest
```

## 🚨 Solución de Problemas

### Error de base de datos:
```bash
npm run db:generate
npm run db:push
npm run system:init
```

### Puerto ocupado:
```bash
# Cambiar puerto en .env
PORT=3002
```

### Resetear completamente:
```bash
npm run system:reset
```

### Problemas de permisos:
```bash
# Windows
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Linux/Mac
chmod +x setup-system-final.js
```

## 📈 Características

- ✅ **Autenticación JWT** completa
- ✅ **RBAC** (Control de acceso basado en roles)
- ✅ **Validación de datos** con express-validator
- ✅ **Rate limiting** para seguridad
- ✅ **CORS** configurado
- ✅ **Helmet** para headers de seguridad
- ✅ **Logs estructurados**
- ✅ **Documentación automática** de API
- ✅ **Datos de ejemplo** realistas
- ✅ **Sistema de permisos** granular

## 🎯 Desarrollo

```bash
# Modo desarrollo con auto-reload
npm run dev

# Ejecutar tests
npm test

# Generar nueva migración
npx prisma migrate dev --name descripcion

# Ver base de datos
npx prisma studio
```

## 📊 Monitoreo

- **Logs**: Console y archivo (si configurado)
- **Health check**: `GET /api/health`
- **Métricas**: Disponibles en endpoints específicos

---

## 🎉 ¡Sistema Listo!

Con `npm run setup-complete` tendrás un sistema completamente funcional con:
- 🏢 Estructura organizacional completa
- 👥 Usuarios con roles y permisos
- 📋 Datos de planificación POA
- 📊 Módulo PACC operativo
- 💰 Sistema presupuestario
- 📈 Dashboards con datos

**El backend estará listo para conectar con el frontend y usar en producción.**
