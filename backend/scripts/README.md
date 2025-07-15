# 📁 Scripts del Backend

Esta carpeta contiene todos los scripts organizados del sistema POA-PACC.

## 🚀 Scripts Principales

### `setup.js`
**Propósito**: Configuración completa y automática del sistema
**Uso**: `npm run system:init` o `node scripts/setup.js`
**Descripción**: Crea toda la estructura de datos, usuarios, permisos y configuración inicial

### `test.js`
**Propósito**: Verificación completa de endpoints y funcionalidad
**Uso**: `npm run system:test` o `node scripts/test.js`
**Descripción**: Prueba todos los endpoints críticos del sistema

### `system-status-check.js`
**Propósito**: Verificación del estado del sistema
**Uso**: `npm run system:status` o `node scripts/system-status-check.js`
**Descripción**: Revisa el estado actual de la base de datos y configuración

## 🔧 Scripts de Utilidades

### `add-missing-permissions.js`
**Propósito**: Agregar permisos faltantes al sistema
**Uso**: `npm run permissions:add` o `node scripts/add-missing-permissions.js`
**Descripción**: Añade permisos que puedan faltar en el sistema

### `add-procurement-permissions.js`
**Propósito**: Agregar permisos específicos de contrataciones
**Uso**: `node scripts/add-procurement-permissions.js`
**Descripción**: Permisos específicos para el módulo de contrataciones

## 📊 Scripts de Datos de Ejemplo

### `create-indicators-examples.js`
**Propósito**: Crear indicadores de ejemplo
**Descripción**: Genera indicadores de prueba para el sistema

### `create-pacc-poa-budget-integration.js`
**Propósito**: Integración PACC-POA-Presupuesto
**Descripción**: Crea datos de integración entre módulos

### `create-pacc-schedule-compliance.js`
**Propósito**: Cumplimiento de cronograma PACC
**Descripción**: Datos de ejemplo para seguimiento de cronogramas

### `create-progress-tracking-examples.js`
**Propósito**: Seguimiento de avances
**Descripción**: Ejemplos de reportes de avance

### `create-simple-progress-examples.js`
**Propósito**: Avances simples
**Descripción**: Ejemplos básicos de reportes

## ⚙️ Scripts de Sistema

### `initialize-system.js`
**Propósito**: Inicialización alternativa del sistema
**Descripción**: Método alternativo de configuración inicial

## 🎯 Uso Recomendado

1. **Instalación inicial**: `npm run setup-complete`
2. **Verificar sistema**: `npm run system:status`
3. **Probar endpoints**: `npm run system:test`
4. **Agregar permisos**: `npm run permissions:add`

## ✅ Scripts Eliminados en la Limpieza

- 40+ archivos `test-*.js` duplicados
- 6+ archivos `setup-*.js` redundantes
- 14+ archivos `create-*.js` obsoletos
- Archivos de debug y verificación temporales
- Scripts de demostración innecesarios

La limpieza redujo **60+ archivos innecesarios** a **11 scripts organizados y funcionales**.
