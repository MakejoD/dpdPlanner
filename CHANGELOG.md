# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Pendiente
- Implementación completa del CRUD de estructura POA (Ejes, Objetivos, Productos, Actividades, Indicadores)
- Módulo de seguimiento y avances con carga de archivos
- Módulo de ejecución presupuestaria
- Dashboards y visualización de datos
- Sistema de notificaciones
- Exportación de reportes
- Tests unitarios y de integración

## [1.0.0] - 2024-01-XX

### Añadido
- Estructura inicial del proyecto con backend (Node.js/Express) y frontend (React/Vite)
- Sistema de autenticación con JWT
- Sistema RBAC (Role-Based Access Control) completo
- Base de datos PostgreSQL con Prisma ORM
- Schema completo para gestión de POA
- Middleware de autenticación y autorización
- Rutas RESTful para usuarios, roles, permisos y departamentos
- Sistema de logging con Winston
- Validaciones de entrada con Joi
- Interfaz de usuario con Material-UI
- Contexto de autenticación en React
- Páginas base para todos los módulos principales
- Sistema de enrutamiento con React Router
- Configuración de desarrollo con variables de entorno
- Documentación completa de instalación y uso
- Archivos .gitignore apropiados
- Script de seed para datos iniciales

### Estructura de módulos
- **Autenticación**: Login, logout, gestión de tokens
- **Administración**: Gestión de usuarios, roles y departamentos
- **Planificación**: Base para gestión de estructura POA
- **Seguimiento**: Base para reportes de avance
- **Presupuesto**: Base para ejecución presupuestaria
- **Reportes**: Base para dashboards y exportaciones
- **Perfil**: Gestión de perfil de usuario

### Tecnologías utilizadas
- **Backend**: Node.js, Express.js, Prisma ORM, PostgreSQL, JWT, bcrypt, Winston
- **Frontend**: React.js, Vite, Material-UI, React Router, React Query, Axios
- **Base de datos**: PostgreSQL con schema optimizado para POA
- **Herramientas**: ESLint, Prettier, Nodemon
