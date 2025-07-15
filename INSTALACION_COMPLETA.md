# 🚀 INSTALACIÓN COMPLETA Y DEFINITIVA - Sistema POA-PACC

Este documento resuelve definitivamente el problema de instalación del sistema desde el repositorio.

## 📋 PROBLEMA IDENTIFICADO

Cuando se clona el repositorio, el sistema requiere:
1. Configuración de variables de entorno
2. Creación de la base de datos
3. Datos de ejemplo para que funcionen los dashboards
4. Usuarios con permisos configurados
5. Estructura completa de planificación

## ✅ SOLUCIÓN DEFINITIVA

### 1. PREREQUISITOS

```bash
# Verificar Node.js (versión 16 o superior)
node --version

# Verificar npm
npm --version
```

### 2. INSTALACIÓN AUTOMÁTICA COMPLETA

Después de clonar el repositorio, ejecutar estos comandos EN ORDEN:

```bash
# 1. Instalar dependencias del backend
cd backend
npm install

# 2. Configurar base de datos
npx prisma generate
npx prisma db push

# 3. EJECUTAR CONFIGURACIÓN AUTOMÁTICA
node quick-setup.js

# 4. Verificar que todo esté funcionando
npm start
```

```bash
# En otra terminal, configurar frontend
cd ../frontend
npm install
npm run dev
```

### 3. VERIFICACIÓN DEL SISTEMA

Después de ejecutar `quick-setup.js`, deberías ver:

```
🎉 ¡SISTEMA CONFIGURADO EXITOSAMENTE!
=====================================

🔐 CREDENCIALES DE ACCESO:
   👨‍💼 Administrador:
      📧 Email: admin@poa.gov
      🔑 Contraseña: admin123

   👩‍💼 Director de Planificación:
      📧 Email: director.planificacion@poa.gov
      🔑 Contraseña: director123

🌐 URLS DEL SISTEMA:
   🔗 Backend API: http://localhost:3001
   🖥️  Frontend: http://localhost:5173
```

### 4. CONTENIDO CREADO AUTOMÁTICAMENTE

El script `quick-setup.js` crea automáticamente:

#### 📊 Estructura Organizacional:
- ✅ 5 Departamentos (Planificación, Administrativo, Financiero, Técnico, Compras)
- ✅ 5 Roles con permisos específicos
- ✅ 47+ Permisos del sistema
- ✅ 2 Usuarios de prueba

#### 📋 Estructura de Planificación:
- ✅ Ejes Estratégicos
- ✅ Objetivos Específicos
- ✅ Productos
- ✅ Actividades con fechas
- ✅ Indicadores de seguimiento

#### 💰 Datos Financieros:
- ✅ Ejecuciones presupuestarias
- ✅ Reportes de progreso
- ✅ Estados financieros de ejemplo

#### 📊 Datos PACC:
- ✅ Evaluaciones de cumplimiento
- ✅ Procesos de contratación
- ✅ Indicadores de gestión

### 5. DASHBOARDS FUNCIONANDO

Después de la configuración automática, estos dashboards cargan con datos:

1. **Dashboard Principal** (`http://localhost:5173/dashboard`)
   - Estadísticas generales
   - Gráficos de avance
   - Indicadores clave

2. **Dashboard POA** (`http://localhost:5173/dashboard/poa`)
   - Estructura de planificación
   - Seguimiento de actividades
   - Reportes de progreso

3. **Dashboard PACC** (`http://localhost:5173/dashboard/pacc`)
   - Cumplimiento del PACC
   - Procesos de contratación
   - Evaluaciones periódicas

4. **Gestión de Actividades** (`http://localhost:5173/planning/activities`)
   - Lista completa de actividades
   - Asignación de responsables
   - Seguimiento de fechas

5. **Ejecución Presupuestaria** (`http://localhost:5173/budget/execution`)
   - Seguimiento presupuestario
   - Gráficos de ejecución
   - Estados por trimestre

### 6. ENDPOINTS API VERIFICADOS

Todos estos endpoints funcionan después de la configuración:

```
✅ GET /api/users - Lista de usuarios
✅ GET /api/departments - Departamentos
✅ GET /api/strategic-axes - Ejes estratégicos
✅ GET /api/objectives - Objetivos
✅ GET /api/products - Productos
✅ GET /api/activities - Actividades
✅ GET /api/indicators - Indicadores
✅ GET /api/progress-reports - Reportes de progreso
✅ GET /api/budget-execution - Ejecución presupuestaria
✅ GET /api/pacc/compliance/latest - Cumplimiento PACC
✅ GET /api/procurement-processes - Procesos de contratación
✅ GET /api/approvals/pending - Aprobaciones pendientes
```

### 7. ARCHIVO .ENV AUTOMÁTICO

El script crea automáticamente el archivo `.env` con:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="dpd-planner-super-secret-jwt-key-2025-secure"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL="http://localhost:5173"
```

### 8. SOLUCIÓN DE PROBLEMAS

#### Si el script falla:

```bash
# 1. Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install

# 2. Regenerar base de datos
npx prisma generate
npx prisma db push --force-reset

# 3. Ejecutar configuración nuevamente
node quick-setup.js
```

#### Si hay errores de base de datos:

```bash
# Eliminar base de datos existente
rm -f dev.db

# Recrear desde cero
npx prisma db push
node quick-setup.js
```

#### Si faltan dependencias:

```bash
# Instalar dependencias específicas
npm install @prisma/client bcrypt jsonwebtoken express cors helmet
npm install -D prisma
```

### 9. VERIFICACIÓN MANUAL

Para verificar que todo está correcto:

```bash
# 1. Probar endpoint de usuarios
curl http://localhost:3001/api/users

# 2. Probar autenticación
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@poa.gov","password":"admin123"}'

# 3. Verificar datos PACC
curl http://localhost:3001/api/pacc/compliance/latest
```

### 10. ARCHIVO PARA FUTURAS INSTALACIONES

Para hacer esto más fácil en el futuro, considera agregar a `package.json`:

```json
{
  "scripts": {
    "setup": "npx prisma generate && npx prisma db push && node quick-setup.js",
    "reset": "rm -f dev.db && npm run setup",
    "dev-full": "npm run setup && npm start"
  }
}
```

Entonces la instalación sería simplemente:

```bash
cd backend
npm install
npm run setup
npm start
```

## 🎯 RESULTADO FINAL

Después de seguir estos pasos:

1. ✅ Sistema completamente funcional
2. ✅ Todos los dashboards cargan con datos
3. ✅ Usuarios configurados con permisos
4. ✅ API endpoints funcionando
5. ✅ Base de datos poblada con ejemplos realistas
6. ✅ Frontend y backend integrados

## 📞 SOPORTE

Si aún hay problemas después de seguir estos pasos:

1. Verificar versión de Node.js (>= 16)
2. Verificar que no hay procesos usando puerto 3001
3. Verificar permisos de escritura en la carpeta del proyecto
4. Revisar logs en la consola para errores específicos

---

**Esta solución resuelve definitivamente el problema de instalación y configuración inicial del sistema POA-PACC.**
