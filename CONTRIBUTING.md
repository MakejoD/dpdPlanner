# Guía de Contribución

## Cómo contribuir al proyecto POA Management System

### Configuración del entorno de desarrollo

1. **Clonar el repositorio**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd poa-management-system
   ```

2. **Configurar el backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configurar las variables de entorno
   npx prisma migrate dev
   npx prisma db seed
   ```

3. **Configurar el frontend**
   ```bash
   cd frontend
   npm install
   ```

### Flujo de trabajo

1. **Crear una rama para la nueva funcionalidad**
   ```bash
   git checkout -b feature/nombre-de-la-funcionalidad
   ```

2. **Realizar cambios y commits**
   ```bash
   git add .
   git commit -m "feat: descripción clara del cambio"
   ```

3. **Enviar cambios**
   ```bash
   git push origin feature/nombre-de-la-funcionalidad
   ```

4. **Crear Pull Request** en GitHub

### Convenciones de código

#### Backend
- Usar ES6+ y async/await
- Seguir la estructura de carpetas existente
- Implementar validaciones con Joi o similar
- Añadir logs apropiados
- Incluir tests para nuevas funcionalidades

#### Frontend
- Usar componentes funcionales con hooks
- Seguir la guía de estilo de Material-UI
- Implementar manejo de estados con React Query
- Añadir PropTypes o TypeScript
- Mantener componentes reutilizables

### Tipos de commits

- `feat:` Nueva funcionalidad
- `fix:` Corrección de errores
- `docs:` Documentación
- `style:` Cambios de formato
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Tareas de mantenimiento

### Reportar issues

1. Verificar que el issue no existe ya
2. Usar la plantilla de issue
3. Incluir pasos para reproducir
4. Adjuntar logs si es necesario

### Estructura de Pull Request

1. Título descriptivo
2. Descripción detallada de los cambios
3. Lista de cambios realizados
4. Capturas de pantalla si aplica
5. Tests realizados

### Revisión de código

- Todo PR debe ser revisado por al menos un desarrollador
- Verificar que los tests pasen
- Comprobar que la documentación esté actualizada
- Asegurar que no hay breaking changes sin documentar
