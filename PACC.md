**Rol:** Actúa como un experto Arquitecto de Software y desarrollador Full Stack, especializado en sistemas de gestión para el sector público. Tu tarea es **extender la aplicación de gestión de POA existente** para incorporar un módulo completo de Plan Anual de Compras (PAC), asegurando una integración profunda y lógica entre la planificación operativa y los procesos de adquisición.

**Concepto Clave:** La ejecución de muchas actividades del POA depende directamente de un proceso de compra. Esta extensión debe permitir a los usuarios vincular las actividades operativas con sus requerimientos de compra, monitorear el estado de los procesos de contratación desde el POA y asegurar la consistencia entre la planificación y la ejecución de las compras. El sistema debe reflejar las normativas de la Dirección General de Contrataciones Públicas (DGCP) de la República Dominicana.

**Stack Tecnológico:** Mantener el stack existente (React.js, Node.js, PostgreSQL, Prisma/Sequelize, JWT).

### **Nuevos Módulos y Funcionalidades Requeridas**

**1. Módulo de Gestión del Plan Anual de Compras (PAC):**
* **Creación de Procesos de Compra:** Permitir el registro de cada ítem del PAC con los siguientes campos, alineados a la DGCP:
    * **Código CUCI:** Campo de texto para el Código Único de Clasificación de Ítems.
    * **Descripción del Bien/Servicio:** Detalle del requerimiento.
    * **Unidad de Medida:** (Ej: Unidad, Servicio, Global, Quintal).
    * **Cantidad:** Número de unidades requeridas.
    * **Costo Unitario Estimado (RD$).**
    * **Costo Total Estimado (RD$):** (Calculado automáticamente).
    * **Modalidad de Compra:** (Dropdown: Licitación Pública, Comparación de Precios, Compras Menores, Sorteo de Obras, etc.).
    * **Fuente de Financiamiento:** (Ej: Fondos Propios, Préstamo Externo).
    * **Cronograma de Fechas:** Campos de fecha para "Fecha Prevista de Inicio del Proceso" y "Fecha Prevista de Adjudicación".
    * **Estado del Proceso:** (Dropdown: "Planificado", "En Proceso", "Adjudicado", "Desierto", "Cancelado").

**2. Funcionalidad Crítica de Integración POA-PAC:**
* **Vinculación Directa:**
    * En la vista de una **Actividad del POA**, debe existir un botón o una sección llamada **"Vincular Proceso de Compra"**.
    * Al hacer clic, se abrirá un modal que permitirá al usuario buscar y seleccionar uno o varios ítems del PAC para asociarlos a esa actividad.
    * A la inversa, al crear o editar un ítem en el **módulo del PAC**, debe haber un campo opcional para **"Vincular a Actividad del POA"**.
* **Sincronización de Estado y Alertas:**
    * En la vista del POA, las actividades que tengan procesos de compra vinculados deben mostrar un **ícono que indique el estado agregado de dichos procesos**.
    * **Ejemplo:** Si una actividad del POA necesita 3 compras y una de ellas pasa a estado "Cancelado" o está retrasada según su cronograma, el ícono de la actividad en el POA debe cambiar a una **alerta visual (amarilla o roja)**.
* **Consistencia Presupuestaria:**
    * El sistema debe comparar el presupuesto asignado a una actividad en el POA con la suma de los "Costos Totales Estimados" de todos los ítems del PAC vinculados a ella.
    * Si el costo de las compras supera el presupuesto de la actividad, se debe generar una alerta visible para el Director de Planificación y el Director de Área.

### **Actualización del Sistema de Permisos y Roles (RBAC)**

Introduce nuevos roles y amplía los permisos de los roles existentes para gestionar la interacción entre POA y PAC.

**1. Nuevos Roles:**

* **Director de Compras y Contrataciones:**
    * **Permisos:** CRUD completo sobre el módulo del PAC. Puede crear, modificar, aprobar y cambiar el estado de todos los procesos de compra. Tiene acceso de LECTURA a todo el POA para entender el contexto de los requerimientos.
    * **Acción Clave:** Responsable de la formulación y gestión del PAC institucional.

* **Analista de Compras:**
    * **Permisos:** Puede CREAR y ACTUALIZAR borradores de procesos de compra en el PAC. No puede aprobarlos ni publicarlos. Puede vincular los procesos que crea a las actividades del POA.
    * **Acción Clave:** El rol operativo que carga y prepara los expedientes de compra en el sistema.

**2. Modificación de Roles Existentes:**

* **Director de Área/Gerente:**
    * **Permisos Adicionales:** Puede **solicitar la creación** de un proceso de compra vinculado a una de sus actividades. Tiene acceso de LECTURA al estado detallado de los procesos de compra que afectan a su área.
    * **Acción Clave:** Monitorea que las compras necesarias para sus operaciones se estén gestionando a tiempo.

* **Director de Planificación y Desarrollo:**
    * **Permisos Adicionales:** Acceso de LECTURA completo a todo el módulo del PAC. Puede ver los vínculos y las alertas de inconsistencia presupuestaria entre POA y PAC.
    * **Acción Clave:** Supervisa la coherencia estratégica y financiera entre lo planificado y lo que se está comprando.

**Instrucción de Inicio para la IA:**
Por favor, comienza actualizando el esquema de la base de datos. Introduce las nuevas tablas: `ProcurementProcess` (con todos los campos del PAC), y una tabla pivote `ActivityProcurementLink` para gestionar la relación muchos a muchos entre las tablas `Activity` (del POA) y `ProcurementProcess`. Luego, desarrolla la API RESTful para el CRUD completo del módulo PAC. Finalmente, implementa la lógica de negocio para la vinculación y las alertas de sincronización entre ambos módulos, asegurando que el sistema de permisos (RBAC) se aplique rigurosamente a cada endpoint.