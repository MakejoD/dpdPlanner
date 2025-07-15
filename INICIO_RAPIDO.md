# 🚀 GUÍA DE INICIO RÁPIDO - Sistema POA-PACC-Presupuesto

## ⚡ Inicio Rápido

### Opción 1: Scripts Automáticos (Recomendado)

1. **Iniciar Backend:**
   ```
   Haga doble clic en: start-backend.bat
   ```

2. **Iniciar Frontend:** (en otra ventana)
   ```
   Haga doble clic en: start-frontend.bat
   ```

3. **Acceder al Sistema:**
   ```
   Abra: http://localhost:5173
   ```

### Opción 2: Manual

1. **Backend:**
   ```bash
   cd backend
   npm install
   node src/server.js
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔐 Credenciales de Prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@gobierno.do | admin123 | Administrador |
| Roberto | roberto.herrera@compras.gov.do | password123 | Director Compras |
| Ana | ana.gonzalez@map.gov.do | password123 | Directora Planificación |

## 🏗️ Estructura del Sistema

```
📁 dpdPlanner/
├── 📁 backend/          # API Node.js + Express + Prisma
├── 📁 frontend/         # React + Material-UI
├── 🚀 start-backend.bat # Iniciar servidor
└── 🚀 start-frontend.bat# Iniciar frontend
```

## 🔧 Solución de Problemas

### ❌ Error de Conexión
- **Síntoma:** "No se puede conectar al servidor"
- **Solución:** Verificar que `start-backend.bat` esté ejecutándose

### ❌ Puerto Ocupado
- **Síntoma:** "EADDRINUSE: address already in use"
- **Solución:** Cerrar otros procesos en puertos 3001 (backend) o 5173 (frontend)

### ❌ Dependencias Faltantes
- **Síntoma:** "Cannot find module"
- **Solución:** Ejecutar `npm install` en las carpetas backend y frontend

## 🎯 Funcionalidades Principales

### 📊 POA (Plan Operativo Anual)
- ✅ Ejes Estratégicos
- ✅ Objetivos y Productos
- ✅ Actividades e Indicadores
- ✅ Seguimiento de Avances

### 💰 Presupuesto
- ✅ Ejecución Presupuestaria
- ✅ Correlación POA-Presupuesto
- ✅ Reportes Financieros

### 🛒 PACC (Plan Anual de Compras)
- ✅ Cronogramas de Contratación
- ✅ Alertas Inteligentes
- ✅ Dashboard Ejecutivo
- ✅ Evaluaciones de Cumplimiento
- ✅ Reportes PACC

## 🌐 URLs del Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Interfaz de usuario |
| Backend API | http://localhost:3001/api | API REST |
| Health Check | http://localhost:3001/api/health | Estado del servidor |

## 📱 Navegación Principal

1. **Dashboard** - Resumen ejecutivo
2. **Administración** - Usuarios, roles, departamentos
3. **Planificación** - POA completo
4. **PACC** - Gestión de contrataciones
5. **Seguimiento** - Avances e indicadores
6. **Presupuesto** - Ejecución financiera
7. **Reportes** - Informes y análisis

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ Autorización por roles
- ✅ Rate limiting
- ✅ Validación de datos
- ✅ Logs de auditoría

## 📞 Soporte

Si encuentra problemas:

1. Verificar que ambos servidores estén ejecutándose
2. Revisar la consola del navegador (F12)
3. Verificar logs del backend
4. Consultar la documentación técnica

---

**🎉 ¡Sistema listo para usar!** El Sistema POA-PACC-Presupuesto incluye datos de ejemplo para explorar todas las funcionalidades.
