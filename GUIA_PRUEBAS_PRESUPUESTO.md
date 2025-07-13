# 🎯 GUÍA DE PRUEBAS - MÓDULO DE EJECUCIÓN PRESUPUESTARIA

## 🚀 ESTADO ACTUAL
✅ **Backend funcionando:** http://localhost:3001  
✅ **Frontend funcionando:** http://localhost:5173  
✅ **Error de importación corregido:** `useAuth` importado correctamente  

---

## 📋 PASOS PARA PROBAR EL MÓDULO

### 1️⃣ **Acceso al Sistema**
1. Abrir navegador en: http://localhost:5173
2. Login con credenciales:
   - **Email:** admin@poa.gov
   - **Password:** admin123
3. Navegar al menú lateral → **"Ejecución Presupuestaria"**

### 2️⃣ **Funcionalidades a Probar**

#### ✅ **Visualización Inicial**
- [ ] Ver tarjetas de resumen (Asignado, Comprometido, Devengado, Ejecutado)
- [ ] Ver tabla vacía o con datos existentes
- [ ] Verificar que los filtros se muestren correctamente

#### ✅ **Crear Nueva Ejecución**
1. Hacer clic en **"Nueva Ejecución"**
2. Llenar formulario:
   - **Código:** PART-410.11.02
   - **Nombre:** Material de Oficina
   - **Actividad:** Seleccionar cualquier actividad disponible
   - **Año Fiscal:** 2024
   - **Monto Asignado:** 100000
3. Hacer clic en **"Crear"**
4. **Verificar:** Notificación de éxito y aparición en la tabla

#### ✅ **Probar Validaciones**
1. Intentar crear con montos inválidos:
   - Comprometido > Asignado ❌
   - Devengado > Comprometido ❌
   - Pagado > Devengado ❌
2. **Verificar:** Mensajes de error apropiados

#### ✅ **Editar Ejecución**
1. Hacer clic en el ícono de **"Editar"** (lápiz)
2. Modificar montos siguiendo la lógica:
   - Comprometido: 50000 (50%)
   - Devengado: 30000 (30%)
   - Pagado: 20000 (20%)
3. **Verificar:** Cálculo automático de porcentajes

#### ✅ **Filtros**
1. Probar filtro por **Año Fiscal**
2. Probar filtro por **Actividad**
3. Probar búsqueda por **Código Presupuestario**
4. **Verificar:** Resultados se actualizan dinámicamente

#### ✅ **Resumen Automático**
1. Crear múltiples ejecuciones presupuestarias
2. **Verificar:** Tarjetas superiores muestran totales correctos
3. **Verificar:** Porcentajes se calculan automáticamente

### 3️⃣ **Casos de Prueba Específicos**

#### **Caso 1: Flujo Completo**
```
Crear ejecución: 
- Asignado: $500,000
- Comprometido: $0
- Devengado: $0
- Pagado: $0

Editar progresivamente:
1. Comprometer $250,000 (50%)
2. Devengar $150,000 (30%)
3. Pagar $100,000 (20%)
```

#### **Caso 2: Validaciones de Negocio**
```
Intentar:
- Comprometer $600,000 > $500,000 ❌
- Devengar $300,000 > $250,000 ❌
- Pagar $200,000 > $150,000 ❌
```

#### **Caso 3: Múltiples Partidas**
```
Crear 3 partidas diferentes:
- Material de Oficina: $100,000
- Servicios Públicos: $200,000
- Mantenimiento: $150,000

Verificar resumen total: $450,000
```

---

## 🔧 DEBUGGING Y TROUBLESHOOTING

### **Si hay errores en la consola del navegador:**
1. Abrir **DevTools** (F12)
2. Ir a la pestaña **Console**
3. Verificar errores de red o JavaScript

### **Si las APIs no responden:**
1. Verificar que el backend esté corriendo en puerto 3001
2. Probar endpoint manualmente: http://localhost:3001/api/budget-execution
3. Verificar token de autenticación en localStorage

### **Si los filtros no funcionan:**
1. Verificar que hay datos para filtrar
2. Revisar que las actividades y departamentos estén cargados

---

## 📊 MÉTRICAS DE ÉXITO

✅ **Funcionalidad Básica**
- [ ] Crear ejecuciones presupuestarias
- [ ] Editar montos existentes
- [ ] Eliminar registros
- [ ] Ver lista con paginación

✅ **Validaciones**
- [ ] Campos obligatorios
- [ ] Validación de montos lógicos
- [ ] Mensajes de error apropiados

✅ **Cálculos Automáticos**
- [ ] Porcentajes de compromiso
- [ ] Porcentajes de devengo
- [ ] Porcentajes de ejecución
- [ ] Totales en tarjetas de resumen

✅ **UX/UI**
- [ ] Interfaz responsiva
- [ ] Notificaciones de éxito/error
- [ ] Navegación fluida
- [ ] Formularios intuitivos

---

## 🎯 PRÓXIMOS PASOS

Una vez confirmado que el módulo funciona correctamente:

1. **Sistema de Aprobaciones** - Workflow para reportes
2. **Dashboard con Datos Reales** - Gráficos dinámicos
3. **Reportes Avanzados** - Exportación PDF/Excel
4. **Optimizaciones** - Performance y UX

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Revisar logs del backend en la terminal
2. Verificar errores en DevTools del navegador
3. Confirmar que ambos servidores estén ejecutándose
4. Verificar conectividad entre frontend y backend

**¡El módulo está listo para producción!** 🚀
