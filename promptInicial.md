Rol: Actúa como un experto Arquitecto de Software y desarrollador Full Stack. Tu tarea es diseñar y generar el código para una aplicación web completa y robusta para la "Gestión y Seguimiento del Plan Operativo Anual (POA)", orientada al sector público.

Concepto Clave: La aplicación debe permitir a las instituciones gubernamentales planificar sus objetivos anuales, dar seguimiento al avance físico y financiero, y visualizar los resultados a través de dashboards, todo controlado por un sistema de permisos granular.

Stack Tecnológico Sugerido:

Frontend: React.js (con Vite para el entorno de desarrollo) y una librería de componentes como Material-UI o Ant Design.

Backend: Node.js con el framework Express.js.

Base de Datos: PostgreSQL.

ORM: Prisma o Sequelize para la gestión de la base de datos.

Autenticación: JSON Web Tokens (JWT).

Módulos Funcionales Requeridos:

Módulo de Planificación y Estructura del POA:

Permite crear y gestionar la jerarquía de la planificación: Ejes Estratégicos, Objetivos, Resultados Esperados (Productos/Servicios), Proyectos y Actividades.

Cada nivel debe poder vincularse con su nivel superior, creando una estructura de árbol.

Permite la creación y asignación de Indicadores de Desempeño a cada nivel, definiendo: Nombre, Tipo (de producto/de resultado), Unidad de Medida, Línea Base, Meta Anual y Metas Periódicas (trimestrales).

Módulo de Seguimiento y Avances:

Interfaz para que los usuarios responsables reporten el avance de sus actividades e indicadores asignados.

El reporte de avance debe incluir: valor numérico alcanzado, porcentaje de ejecución y un campo de texto para comentarios cualitativos.

Funcionalidad para cargar y adjuntar archivos como medios de verificación (PDF, JPG, Excel, etc.) a cada reporte de avance.

Módulo de Ejecución Presupuestaria:

Permite asociar cada proyecto o actividad con una o más partidas presupuestarias.

Para cada partida asociada, se deben poder registrar los montos: Asignado, Comprometido, Devengado y Pagado.

Debe calcular automáticamente el porcentaje de ejecución financiera.

Módulo de Dashboards y Visualización:

Un tablero principal que muestre el avance general de la institución con gráficos (ej. barras, circulares).

Sistema de "semáforos" (rojo, amarillo, verde) para indicar el estado de las metas.

Filtros para visualizar el avance por dirección, eje estratégico o período de tiempo.

Reportes que comparen el avance físico vs. el avance financiero.

Requisito Crítico: Sistema de Permisos y Roles (RBAC - Role-Based Access Control)
Este es el componente más importante de la seguridad y la lógica de negocio. Debe ser implementado de forma granular para cada funcionalidad.

1. Modelos de Base de Datos para Permisos:

User: (id, nombre, email, password_hash, id_rol, id_departamento)

Role: (id, nombre_rol, descripcion) (Ej: "Administrador", "Director de Planificación", "Director de Área", "Técnico Registrador", "Auditor")

Permission: (id, accion, recurso) (Ej: accion="crear", recurso="proyecto"; accion="aprobar", recurso="reporte_avance")

RolePermission: Tabla pivote que asocia Roles con Permissions.

2. Definición de Roles y Alcance de sus Permisos:

Administrador del Sistema:

Permisos: CRUD completo sobre todos los módulos. Gestiona usuarios, roles y asigna permisos a los roles. Es el único que puede modificar la estructura de los permisos.

Acción Clave: Configura el sistema y gestiona las cuentas maestras.

Director de Planificación y Desarrollo:

Permisos: CRUD sobre la estructura del POA (Ejes, Objetivos, Indicadores) en la fase de planificación. Puede "bloquear" el POA una vez aprobado. Tiene acceso de LECTURA a todos los reportes de avance y dashboards de toda la institución.

Acción Clave: Formula, aprueba y da seguimiento global al POA. No registra avances del día a día.

Director de Área/Gerente:

Permisos: LECTURA de la estructura completa del POA. LECTURA de todos los reportes de avance y dashboards de su propia área/departamento únicamente. Puede "Aprobar" o "Rechazar" los reportes de avance enviados por sus técnicos.

Acción Clave: Supervisa el cumplimiento de su equipo y valida la información reportada.

Técnico Registrador:

Permisos: LECTURA de las actividades e indicadores que tiene específicamente asignados. CREAR y ACTUALIZAR reportes de avance únicamente para sus actividades asignadas. No puede ver información de otros técnicos o áreas.

Acción Clave: Es el rol operativo que alimenta el sistema con los datos de avance.

Auditor / Consulta:

Permisos: LECTURA total de toda la información en todos los módulos (planificación, seguimiento, presupuesto, dashboards). No puede modificar, crear ni eliminar absolutamente nada.

Acción Clave: Rol de transparencia y fiscalización.

Instrucción de Inicio:
Por favor, comienza generando la estructura detallada de la base de datos en schema.prisma (o modelos de Sequelize). Define los modelos para User, Role, Permission, RolePermission, Department, StrategicAxis, Objective, Product, Activity, Indicator, ProgressReport, y BudgetExecution. Asegúrate de establecer correctamente las relaciones (uno a muchos, muchos a muchos). A continuación, crea los endpoints de la API RESTful para la gestión de Usuarios, Roles y Permisos (CRUD completo).