const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createCompleteExampleData() {
  console.log('🚀 CREANDO DATOS DE EJEMPLO COMPLETOS E INTERRELACIONADOS');
  console.log('======================================================\n');

  try {
    // Limpiar datos existentes si los hay
    await cleanExistingData();
    
    // Crear estructura completa de datos
    const createdData = await createFullDataStructure();
    
    // Mostrar resumen
    await showDataSummary(createdData);
    
    console.log('\n✅ DATOS DE EJEMPLO CREADOS EXITOSAMENTE');
    
  } catch (error) {
    console.error('❌ Error creando datos:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanExistingData() {
  console.log('🧹 Limpiando datos existentes...');
  
  // Limpiar en orden de dependencias
  await prisma.notification.deleteMany();
  await prisma.paccAlert.deleteMany();
  await prisma.paccCompliance.deleteMany();
  await prisma.paccSchedule.deleteMany();
  await prisma.activityProcurement.deleteMany();
  await prisma.budgetExecution.deleteMany();
  await prisma.budgetAllocation.deleteMany();
  await prisma.poaPaccBudgetCorrelation.deleteMany();
  await prisma.progressReportAttachment.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.activityAssignment.deleteMany();
  await prisma.indicatorAssignment.deleteMany();
  await prisma.indicator.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.product.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.strategicAxis.deleteMany();
  await prisma.procurementProcess.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.department.deleteMany();
  
  console.log('✅ Datos existentes limpiados');
}

async function createFullDataStructure() {
  console.log('📊 Creando estructura completa de datos...\n');
  
  const data = {};
  
  // 1. ESTRUCTURA ORGANIZACIONAL
  data.departments = await createDepartments();
  data.roles = await createRoles();
  data.permissions = await createPermissions();
  data.rolePermissions = await createRolePermissions(data.roles, data.permissions);
  data.users = await createUsers(data.departments, data.roles);
  
  // 2. ESTRUCTURA POA (PLANIFICACIÓN)
  data.strategicAxes = await createStrategicAxes(data.departments);
  data.objectives = await createObjectives(data.strategicAxes);
  data.products = await createProducts(data.objectives);
  data.activities = await createActivities(data.products);
  
  // 3. INDICADORES Y SEGUIMIENTO
  data.indicators = await createIndicators(data.strategicAxes, data.objectives, data.products, data.activities);
  data.activityAssignments = await createActivityAssignments(data.users, data.activities, data.departments);
  data.indicatorAssignments = await createIndicatorAssignments(data.users, data.indicators, data.departments);
  
  // 4. REPORTES DE PROGRESO
  data.progressReports = await createProgressReports(data.activities, data.indicators, data.users);
  
  // 5. PACC (COMPRAS Y CONTRATACIONES)
  data.procurementProcesses = await createProcurementProcesses(data.activities);
  data.activityProcurements = await createActivityProcurements(data.activities, data.procurementProcesses);
  data.paccSchedules = await createPaccSchedules(data.procurementProcesses, data.users);
  
  // 6. PRESUPUESTO
  data.budgetItems = await createBudgetItems();
  data.budgetAllocations = await createBudgetAllocations(data.activities, data.procurementProcesses);
  data.budgetExecutions = await createBudgetExecutions(data.activities, data.budgetItems, data.budgetAllocations);
  
  // 7. CORRELACIÓN Y CUMPLIMIENTO
  data.poaCorrelations = await createPoaPaccBudgetCorrelations(data.activities);
  data.paccCompliances = await createPaccCompliances(data.users);
  data.paccAlerts = await createPaccAlerts(data.procurementProcesses, data.paccSchedules, data.users);
  
  return data;
}

// ========== ESTRUCTURA ORGANIZACIONAL ==========

async function createDepartments() {
  console.log('🏢 Creando departamentos...');
  
  const departments = [
    {
      code: 'ADMIN',
      name: 'Administración Central',
      description: 'Dirección general y coordinación institucional'
    },
    {
      code: 'DPLAN',
      name: 'Dirección de Planificación',
      description: 'Planificación estratégica y seguimiento del POA'
    },
    {
      code: 'DFIN',
      name: 'Dirección Financiera',
      description: 'Gestión financiera y presupuestaria'
    },
    {
      code: 'DCOMP',
      name: 'Dirección de Compras y Contrataciones',
      description: 'Gestión del PACC y procesos de contratación'
    },
    {
      code: 'DTECH',
      name: 'Dirección Técnica',
      description: 'Desarrollo y supervisión técnica de proyectos'
    },
    {
      code: 'DADMIN',
      name: 'Dirección Administrativa',
      description: 'Gestión de recursos humanos y administración'
    }
  ];
  
  const created = [];
  for (const dept of departments) {
    const department = await prisma.department.create({ data: dept });
    created.push(department);
  }
  
  console.log(`✅ ${created.length} departamentos creados`);
  return created;
}

async function createRoles() {
  console.log('👥 Creando roles...');
  
  const roles = [
    {
      name: 'Administrador del Sistema',
      description: 'Acceso completo a todas las funcionalidades'
    },
    {
      name: 'Director General',
      description: 'Aprobación de planes y supervisión general'
    },
    {
      name: 'Coordinador de Planificación',
      description: 'Gestión del POA e indicadores'
    },
    {
      name: 'Coordinador de PACC',
      description: 'Gestión de compras y contrataciones'
    },
    {
      name: 'Analista de Presupuesto',
      description: 'Seguimiento y ejecución presupuestaria'
    },
    {
      name: 'Técnico de Seguimiento',
      description: 'Reportes de progreso y monitoreo'
    }
  ];
  
  const created = [];
  for (const role of roles) {
    const createdRole = await prisma.role.create({ data: role });
    created.push(createdRole);
  }
  
  console.log(`✅ ${created.length} roles creados`);
  return created;
}

async function createPermissions() {
  console.log('🔐 Creando permisos...');
  
  const permissions = [
    // Usuarios y roles
    { action: 'create', resource: 'user' },
    { action: 'read', resource: 'user' },
    { action: 'update', resource: 'user' },
    { action: 'delete', resource: 'user' },
    { action: 'create', resource: 'role' },
    { action: 'read', resource: 'role' },
    { action: 'update', resource: 'role' },
    { action: 'delete', resource: 'role' },
    { action: 'manage', resource: 'role' },
    
    // Departamentos
    { action: 'create', resource: 'department' },
    { action: 'read', resource: 'department' },
    { action: 'update', resource: 'department' },
    { action: 'delete', resource: 'department' },
    
    // POA
    { action: 'create', resource: 'strategic_axis' },
    { action: 'read', resource: 'strategic_axis' },
    { action: 'update', resource: 'strategic_axis' },
    { action: 'approve', resource: 'strategic_axis' },
    { action: 'create', resource: 'activity' },
    { action: 'read', resource: 'activity' },
    { action: 'update', resource: 'activity' },
    { action: 'assign', resource: 'activity' },
    
    // Indicadores
    { action: 'create', resource: 'indicator' },
    { action: 'read', resource: 'indicator' },
    { action: 'update', resource: 'indicator' },
    { action: 'report', resource: 'indicator' },
    
    // Reportes
    { action: 'create', resource: 'progress_report' },
    { action: 'read', resource: 'progress_report' },
    { action: 'approve', resource: 'progress_report' },
    
    // PACC
    { action: 'create', resource: 'procurement' },
    { action: 'read', resource: 'procurement' },
    { action: 'update', resource: 'procurement' },
    { action: 'approve', resource: 'procurement' },
    
    // Presupuesto
    { action: 'create', resource: 'budget' },
    { action: 'read', resource: 'budget' },
    { action: 'execute', resource: 'budget' },
    { action: 'approve', resource: 'budget' },
    
    // Reportes avanzados
    { action: 'read', resource: 'dashboard' },
    { action: 'export', resource: 'report' },
    { action: 'manage', resource: 'system' }
  ];
  
  const created = [];
  for (const permission of permissions) {
    try {
      const createdPermission = await prisma.permission.create({ data: permission });
      created.push(createdPermission);
    } catch (error) {
      // Ignorar duplicados
      if (!error.message.includes('Unique constraint')) {
        throw error;
      }
    }
  }
  
  console.log(`✅ ${created.length} permisos creados`);
  return created;
}

async function createRolePermissions(roles, permissions) {
  console.log('🔗 Asignando permisos a roles...');
  
  const rolePermissions = [];
  
  // Administrador del Sistema - Todos los permisos
  const adminRole = roles.find(r => r.name === 'Administrador del Sistema');
  for (const permission of permissions) {
    rolePermissions.push({
      roleId: adminRole.id,
      permissionId: permission.id
    });
  }
  
  // Director General - Permisos de lectura y aprobación
  const directorRole = roles.find(r => r.name === 'Director General');
  const directorPermissions = permissions.filter(p => 
    p.action === 'read' || p.action === 'approve' || p.resource === 'dashboard'
  );
  for (const permission of directorPermissions) {
    rolePermissions.push({
      roleId: directorRole.id,
      permissionId: permission.id
    });
  }
  
  // Coordinador de Planificación - POA e indicadores
  const planRole = roles.find(r => r.name === 'Coordinador de Planificación');
  const planPermissions = permissions.filter(p => 
    p.resource === 'strategic_axis' || p.resource === 'activity' || 
    p.resource === 'indicator' || p.resource === 'progress_report' ||
    (p.resource === 'dashboard' && p.action === 'read')
  );
  for (const permission of planPermissions) {
    rolePermissions.push({
      roleId: planRole.id,
      permissionId: permission.id
    });
  }
  
  // Coordinador de PACC - Compras y contrataciones
  const paccRole = roles.find(r => r.name === 'Coordinador de PACC');
  const paccPermissions = permissions.filter(p => 
    p.resource === 'procurement' || 
    (p.resource === 'dashboard' && p.action === 'read') ||
    (p.resource === 'activity' && p.action === 'read')
  );
  for (const permission of paccPermissions) {
    rolePermissions.push({
      roleId: paccRole.id,
      permissionId: permission.id
    });
  }
  
  // Analista de Presupuesto - Presupuesto y ejecución
  const budgetRole = roles.find(r => r.name === 'Analista de Presupuesto');
  const budgetPermissions = permissions.filter(p => 
    p.resource === 'budget' || 
    (p.resource === 'dashboard' && p.action === 'read') ||
    (p.resource === 'activity' && p.action === 'read')
  );
  for (const permission of budgetPermissions) {
    rolePermissions.push({
      roleId: budgetRole.id,
      permissionId: permission.id
    });
  }
  
  // Técnico de Seguimiento - Reportes
  const techRole = roles.find(r => r.name === 'Técnico de Seguimiento');
  const techPermissions = permissions.filter(p => 
    p.resource === 'progress_report' || p.resource === 'indicator' ||
    (p.resource === 'dashboard' && p.action === 'read')
  );
  for (const permission of techPermissions) {
    rolePermissions.push({
      roleId: techRole.id,
      permissionId: permission.id
    });
  }
  
  const created = [];
  for (const rolePermission of rolePermissions) {
    try {
      const createdRolePermission = await prisma.rolePermission.create({ data: rolePermission });
      created.push(createdRolePermission);
    } catch (error) {
      // Ignorar duplicados
      if (!error.message.includes('Unique constraint')) {
        throw error;
      }
    }
  }
  
  console.log(`✅ ${created.length} asignaciones de permisos creadas`);
  return created;
}

async function createUsers(departments, roles) {
  console.log('👤 Creando usuarios...');
  
  const users = [
    {
      email: 'admin@poa.gov',
      firstName: 'Administrador',
      lastName: 'del Sistema',
      passwordHash: await bcrypt.hash('admin123', 10),
      roleId: roles.find(r => r.name === 'Administrador del Sistema').id,
      departmentId: departments.find(d => d.code === 'ADMIN').id
    },
    {
      email: 'director@poa.gov',
      firstName: 'Director',
      lastName: 'General',
      passwordHash: await bcrypt.hash('director123', 10),
      roleId: roles.find(r => r.name === 'Director General').id,
      departmentId: departments.find(d => d.code === 'ADMIN').id
    },
    {
      email: 'planificacion@poa.gov',
      firstName: 'María',
      lastName: 'Rodríguez',
      passwordHash: await bcrypt.hash('plan123', 10),
      roleId: roles.find(r => r.name === 'Coordinador de Planificación').id,
      departmentId: departments.find(d => d.code === 'DPLAN').id
    },
    {
      email: 'compras@poa.gov',
      firstName: 'Carlos',
      lastName: 'Pérez',
      passwordHash: await bcrypt.hash('pacc123', 10),
      roleId: roles.find(r => r.name === 'Coordinador de PACC').id,
      departmentId: departments.find(d => d.code === 'DCOMP').id
    },
    {
      email: 'presupuesto@poa.gov',
      firstName: 'Ana',
      lastName: 'García',
      passwordHash: await bcrypt.hash('budget123', 10),
      roleId: roles.find(r => r.name === 'Analista de Presupuesto').id,
      departmentId: departments.find(d => d.code === 'DFIN').id
    },
    {
      email: 'seguimiento@poa.gov',
      firstName: 'Luis',
      lastName: 'Martínez',
      passwordHash: await bcrypt.hash('tech123', 10),
      roleId: roles.find(r => r.name === 'Técnico de Seguimiento').id,
      departmentId: departments.find(d => d.code === 'DTECH').id
    }
  ];
  
  const created = [];
  for (const user of users) {
    const createdUser = await prisma.user.create({ data: user });
    created.push(createdUser);
  }
  
  console.log(`✅ ${created.length} usuarios creados`);
  return created;
}

// ========== ESTRUCTURA POA ==========

async function createStrategicAxes(departments) {
  console.log('🎯 Creando ejes estratégicos...');
  
  const axes = [
    {
      code: 'EE001',
      name: 'Fortalecimiento Institucional y Modernización',
      description: 'Mejora de procesos, sistemas y capacidades institucionales',
      year: 2025,
      departmentId: departments.find(d => d.code === 'DPLAN').id
    },
    {
      code: 'EE002',
      name: 'Gestión Eficiente de Recursos',
      description: 'Optimización en el uso de recursos humanos, financieros y tecnológicos',
      year: 2025,
      departmentId: departments.find(d => d.code === 'DFIN').id
    },
    {
      code: 'EE003',
      name: 'Transparencia y Rendición de Cuentas',
      description: 'Fortalecimiento de mecanismos de transparencia y control',
      year: 2025,
      departmentId: departments.find(d => d.code === 'ADMIN').id
    }
  ];
  
  const created = [];
  for (const axis of axes) {
    const createdAxis = await prisma.strategicAxis.create({ data: axis });
    created.push(createdAxis);
  }
  
  console.log(`✅ ${created.length} ejes estratégicos creados`);
  return created;
}

async function createObjectives(strategicAxes) {
  console.log('🎯 Creando objetivos...');
  
  const objectives = [
    // Eje 1: Fortalecimiento Institucional
    {
      code: 'OBJ001',
      name: 'Implementar sistema integrado de gestión POA-PACC-Presupuesto',
      description: 'Desarrollar e implementar un sistema que integre la planificación, compras y ejecución presupuestaria',
      order: 1,
      strategicAxisId: strategicAxes.find(a => a.code === 'EE001').id
    },
    {
      code: 'OBJ002',
      name: 'Fortalecer capacidades del personal técnico',
      description: 'Capacitar al personal en nuevas metodologías y herramientas de gestión',
      order: 2,
      strategicAxisId: strategicAxes.find(a => a.code === 'EE001').id
    },
    
    // Eje 2: Gestión de Recursos
    {
      code: 'OBJ003',
      name: 'Optimizar la ejecución presupuestaria',
      description: 'Mejorar los niveles de ejecución y eficiencia en el uso de recursos',
      order: 1,
      strategicAxisId: strategicAxes.find(a => a.code === 'EE002').id
    },
    {
      code: 'OBJ004',
      name: 'Mejorar procesos de compras y contrataciones',
      description: 'Implementar mejores prácticas en la gestión del PACC',
      order: 2,
      strategicAxisId: strategicAxes.find(a => a.code === 'EE002').id
    },
    
    // Eje 3: Transparencia
    {
      code: 'OBJ005',
      name: 'Implementar sistema de monitoreo y seguimiento',
      description: 'Establecer mecanismos de seguimiento en tiempo real',
      order: 1,
      strategicAxisId: strategicAxes.find(a => a.code === 'EE003').id
    }
  ];
  
  const created = [];
  for (const objective of objectives) {
    const createdObjective = await prisma.objective.create({ data: objective });
    created.push(createdObjective);
  }
  
  console.log(`✅ ${created.length} objetivos creados`);
  return created;
}

async function createProducts(objectives) {
  console.log('📦 Creando productos...');
  
  const products = [
    // Productos para OBJ001
    {
      code: 'PROD001',
      name: 'Sistema POA-PACC-Presupuesto implementado',
      description: 'Sistema integrado funcionando al 100%',
      type: 'PRODUCT',
      order: 1,
      objectiveId: objectives.find(o => o.code === 'OBJ001').id
    },
    {
      code: 'PROD002',
      name: 'Manual de procedimientos integrados',
      description: 'Documentación completa de procesos',
      type: 'PRODUCT',
      order: 2,
      objectiveId: objectives.find(o => o.code === 'OBJ001').id
    },
    
    // Productos para OBJ002
    {
      code: 'PROD003',
      name: 'Personal capacitado en nuevas herramientas',
      description: 'Equipo técnico con competencias actualizadas',
      type: 'SERVICE',
      order: 1,
      objectiveId: objectives.find(o => o.code === 'OBJ002').id
    },
    
    // Productos para OBJ003
    {
      code: 'PROD004',
      name: 'Ejecución presupuestaria optimizada',
      description: 'Mejora en indicadores de ejecución',
      type: 'SERVICE',
      order: 1,
      objectiveId: objectives.find(o => o.code === 'OBJ003').id
    },
    
    // Productos para OBJ004
    {
      code: 'PROD005',
      name: 'Procesos PACC mejorados',
      description: 'Procedimientos de compras optimizados',
      type: 'SERVICE',
      order: 1,
      objectiveId: objectives.find(o => o.code === 'OBJ004').id
    },
    
    // Productos para OBJ005
    {
      code: 'PROD006',
      name: 'Sistema de monitoreo operativo',
      description: 'Plataforma de seguimiento en tiempo real',
      type: 'PRODUCT',
      order: 1,
      objectiveId: objectives.find(o => o.code === 'OBJ005').id
    }
  ];
  
  const created = [];
  for (const product of products) {
    const createdProduct = await prisma.product.create({ data: product });
    created.push(createdProduct);
  }
  
  console.log(`✅ ${created.length} productos creados`);
  return created;
}

async function createActivities(products) {
  console.log('⚡ Creando actividades...');
  
  const currentYear = new Date().getFullYear();
  const activities = [
    // Actividades para PROD001
    {
      code: 'ACT001',
      name: 'Desarrollo del módulo de planificación POA',
      description: 'Implementar funcionalidades de creación y gestión del POA',
      startDate: new Date(`${currentYear}-01-15`),
      endDate: new Date(`${currentYear}-03-31`),
      order: 1,
      productId: products.find(p => p.code === 'PROD001').id
    },
    {
      code: 'ACT002',
      name: 'Desarrollo del módulo PACC',
      description: 'Implementar gestión del Plan Anual de Compras y Contrataciones',
      startDate: new Date(`${currentYear}-02-01`),
      endDate: new Date(`${currentYear}-04-30`),
      order: 2,
      productId: products.find(p => p.code === 'PROD001').id
    },
    {
      code: 'ACT003',
      name: 'Integración con sistema presupuestario',
      description: 'Conectar módulos POA y PACC con sistema de presupuesto',
      startDate: new Date(`${currentYear}-03-01`),
      endDate: new Date(`${currentYear}-05-31`),
      order: 3,
      productId: products.find(p => p.code === 'PROD001').id
    },
    
    // Actividades para PROD002
    {
      code: 'ACT004',
      name: 'Elaboración de manual de usuario',
      description: 'Crear documentación para usuarios finales',
      startDate: new Date(`${currentYear}-04-01`),
      endDate: new Date(`${currentYear}-05-15`),
      order: 1,
      productId: products.find(p => p.code === 'PROD002').id
    },
    {
      code: 'ACT005',
      name: 'Elaboración de manual técnico',
      description: 'Documentar procedimientos técnicos y de mantenimiento',
      startDate: new Date(`${currentYear}-04-15`),
      endDate: new Date(`${currentYear}-06-01`),
      order: 2,
      productId: products.find(p => p.code === 'PROD002').id
    },
    
    // Actividades para PROD003
    {
      code: 'ACT006',
      name: 'Capacitación en gestión POA',
      description: 'Entrenar al personal en planificación operativa anual',
      startDate: new Date(`${currentYear}-05-01`),
      endDate: new Date(`${currentYear}-06-30`),
      order: 1,
      productId: products.find(p => p.code === 'PROD003').id
    },
    {
      code: 'ACT007',
      name: 'Capacitación en gestión PACC',
      description: 'Entrenar en procesos de compras y contrataciones',
      startDate: new Date(`${currentYear}-06-01`),
      endDate: new Date(`${currentYear}-07-31`),
      order: 2,
      productId: products.find(p => p.code === 'PROD003').id
    },
    
    // Actividades para PROD004
    {
      code: 'ACT008',
      name: 'Análisis de ejecución presupuestaria',
      description: 'Revisar y optimizar procesos de ejecución',
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      order: 1,
      productId: products.find(p => p.code === 'PROD004').id
    },
    
    // Actividades para PROD005
    {
      code: 'ACT009',
      name: 'Optimización de procesos PACC',
      description: 'Mejorar eficiencia en compras y contrataciones',
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      order: 1,
      productId: products.find(p => p.code === 'PROD005').id
    },
    
    // Actividades para PROD006
    {
      code: 'ACT010',
      name: 'Implementación de dashboard de monitoreo',
      description: 'Crear tablero de control para seguimiento',
      startDate: new Date(`${currentYear}-06-01`),
      endDate: new Date(`${currentYear}-08-31`),
      order: 1,
      productId: products.find(p => p.code === 'PROD006').id
    }
  ];
  
  const created = [];
  for (const activity of activities) {
    const createdActivity = await prisma.activity.create({ data: activity });
    created.push(createdActivity);
  }
  
  console.log(`✅ ${created.length} actividades creadas`);
  return created;
}

// ========== INDICADORES ==========

async function createIndicators(strategicAxes, objectives, products, activities) {
  console.log('📊 Creando indicadores...');
  
  const indicators = [
    // Indicadores a nivel de Eje Estratégico (trimestral)
    {
      name: 'Porcentaje de cumplimiento del eje de fortalecimiento institucional',
      description: 'Mide el avance general del eje estratégico',
      type: 'RESULT',
      measurementUnit: 'Porcentaje',
      baseline: 0,
      annualTarget: 90,
      reportingFrequency: 'trimestral',
      q1Target: 20,
      q2Target: 45,
      q3Target: 70,
      q4Target: 90,
      strategicAxisId: strategicAxes.find(a => a.code === 'EE001').id
    },
    
    // Indicadores a nivel de Objetivo (trimestral)
    {
      name: 'Sistema POA-PACC-Presupuesto implementado',
      description: 'Porcentaje de implementación del sistema integrado',
      type: 'PRODUCT',
      measurementUnit: 'Porcentaje',
      baseline: 0,
      annualTarget: 100,
      reportingFrequency: 'trimestral',
      q1Target: 25,
      q2Target: 60,
      q3Target: 85,
      q4Target: 100,
      objectiveId: objectives.find(o => o.code === 'OBJ001').id
    },
    
    // Indicadores a nivel de Producto (trimestral)
    {
      name: 'Módulos del sistema desarrollados',
      description: 'Cantidad de módulos funcionales completados',
      type: 'PRODUCT',
      measurementUnit: 'Número',
      baseline: 0,
      annualTarget: 3,
      reportingFrequency: 'trimestral',
      q1Target: 1,
      q2Target: 2,
      q3Target: 3,
      q4Target: 3,
      productId: products.find(p => p.code === 'PROD001').id
    },
    
    // Indicadores a nivel de Actividad (trimestral)
    {
      name: 'Avance del desarrollo del módulo POA',
      description: 'Porcentaje de completitud del módulo de planificación',
      type: 'PRODUCT',
      measurementUnit: 'Porcentaje',
      baseline: 0,
      annualTarget: 100,
      reportingFrequency: 'trimestral',
      q1Target: 100,
      q2Target: 100,
      q3Target: 100,
      q4Target: 100,
      activityId: activities.find(a => a.code === 'ACT001').id
    },
    {
      name: 'Avance del desarrollo del módulo PACC',
      description: 'Porcentaje de completitud del módulo PACC',
      type: 'PRODUCT',
      measurementUnit: 'Porcentaje',
      baseline: 0,
      annualTarget: 100,
      reportingFrequency: 'trimestral',
      q1Target: 0,
      q2Target: 100,
      q3Target: 100,
      q4Target: 100,
      activityId: activities.find(a => a.code === 'ACT002').id
    },
    
    // Indicador mensual para capacitación
    {
      name: 'Personal capacitado en POA',
      description: 'Número de funcionarios capacitados en gestión POA por mes',
      type: 'PRODUCT',
      measurementUnit: 'Número',
      baseline: 0,
      annualTarget: 15,
      reportingFrequency: 'mensual',
      janTarget: 0,
      febTarget: 0,
      marTarget: 2,
      aprTarget: 3,
      mayTarget: 4,
      junTarget: 6,
      julTarget: 0,
      augTarget: 0,
      sepTarget: 0,
      octTarget: 0,
      novTarget: 0,
      decTarget: 0,
      activityId: activities.find(a => a.code === 'ACT006').id
    },
    
    // Indicador mensual para ejecución presupuestaria
    {
      name: 'Ejecución presupuestaria mensual',
      description: 'Porcentaje de ejecución del presupuesto por mes',
      type: 'RESULT',
      measurementUnit: 'Porcentaje',
      baseline: 75,
      annualTarget: 95,
      reportingFrequency: 'mensual',
      janTarget: 8,
      febTarget: 16,
      marTarget: 24,
      aprTarget: 32,
      mayTarget: 40,
      junTarget: 48,
      julTarget: 56,
      augTarget: 64,
      sepTarget: 72,
      octTarget: 80,
      novTarget: 88,
      decTarget: 95,
      activityId: activities.find(a => a.code === 'ACT008').id
    },
    
    // Indicador mensual para procesos PACC
    {
      name: 'Procesos PACC completados',
      description: 'Número de procesos de contratación finalizados mensualmente',
      type: 'PRODUCT',
      measurementUnit: 'Número',
      baseline: 0,
      annualTarget: 12,
      reportingFrequency: 'mensual',
      janTarget: 1,
      febTarget: 1,
      marTarget: 1,
      aprTarget: 1,
      mayTarget: 1,
      junTarget: 1,
      julTarget: 1,
      augTarget: 1,
      sepTarget: 1,
      octTarget: 1,
      novTarget: 1,
      decTarget: 1,
      activityId: activities.find(a => a.code === 'ACT009').id
    }
  ];
  
  const created = [];
  for (const indicator of indicators) {
    const createdIndicator = await prisma.indicator.create({ data: indicator });
    created.push(createdIndicator);
  }
  
  console.log(`✅ ${created.length} indicadores creados`);
  return created;
}

// ========== ASIGNACIONES ==========

async function createActivityAssignments(users, activities, departments) {
  console.log('👥 Creando asignaciones de actividades...');
  
  const assignments = [
    // Actividades técnicas asignadas al coordinador de planificación
    {
      userId: users.find(u => u.email === 'planificacion@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT001').id,
      departmentId: departments.find(d => d.code === 'DPLAN').id,
      isMain: true
    },
    {
      userId: users.find(u => u.email === 'compras@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT002').id,
      departmentId: departments.find(d => d.code === 'DCOMP').id,
      isMain: true
    },
    {
      userId: users.find(u => u.email === 'presupuesto@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT003').id,
      departmentId: departments.find(d => d.code === 'DFIN').id,
      isMain: true
    },
    
    // Actividades de documentación
    {
      userId: users.find(u => u.email === 'seguimiento@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT004').id,
      departmentId: departments.find(d => d.code === 'DTECH').id,
      isMain: true
    },
    {
      userId: users.find(u => u.email === 'seguimiento@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT005').id,
      departmentId: departments.find(d => d.code === 'DTECH').id,
      isMain: true
    },
    
    // Actividades de capacitación
    {
      userId: users.find(u => u.email === 'planificacion@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT006').id,
      departmentId: departments.find(d => d.code === 'DPLAN').id,
      isMain: true
    },
    {
      userId: users.find(u => u.email === 'compras@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT007').id,
      departmentId: departments.find(d => d.code === 'DCOMP').id,
      isMain: true
    },
    
    // Actividades de seguimiento
    {
      userId: users.find(u => u.email === 'presupuesto@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT008').id,
      departmentId: departments.find(d => d.code === 'DFIN').id,
      isMain: true
    },
    {
      userId: users.find(u => u.email === 'compras@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT009').id,
      departmentId: departments.find(d => d.code === 'DCOMP').id,
      isMain: true
    },
    {
      userId: users.find(u => u.email === 'seguimiento@poa.gov').id,
      activityId: activities.find(a => a.code === 'ACT010').id,
      departmentId: departments.find(d => d.code === 'DTECH').id,
      isMain: true
    }
  ];
  
  const created = [];
  for (const assignment of assignments) {
    try {
      const createdAssignment = await prisma.activityAssignment.create({ data: assignment });
      created.push(createdAssignment);
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        throw error;
      }
    }
  }
  
  console.log(`✅ ${created.length} asignaciones de actividades creadas`);
  return created;
}

async function createIndicatorAssignments(users, indicators, departments) {
  console.log('📊 Creando asignaciones de indicadores...');
  
  const assignments = [];
  
  // Asignar cada indicador a un usuario responsable
  for (const indicator of indicators) {
    let userId, departmentId;
    
    if (indicator.strategicAxisId || indicator.objectiveId) {
      // Indicadores estratégicos al coordinador de planificación
      userId = users.find(u => u.email === 'planificacion@poa.gov').id;
      departmentId = departments.find(d => d.code === 'DPLAN').id;
    } else if (indicator.activityId) {
      // Indicadores de actividad al responsable según la actividad
      const activity = await prisma.activity.findUnique({
        where: { id: indicator.activityId },
        include: { assignments: { include: { user: true } } }
      });
      
      if (activity && activity.assignments.length > 0) {
        const mainAssignment = activity.assignments.find(a => a.isMain) || activity.assignments[0];
        userId = mainAssignment.userId;
        departmentId = mainAssignment.departmentId;
      } else {
        userId = users.find(u => u.email === 'seguimiento@poa.gov').id;
        departmentId = departments.find(d => d.code === 'DTECH').id;
      }
    } else {
      // Por defecto al técnico de seguimiento
      userId = users.find(u => u.email === 'seguimiento@poa.gov').id;
      departmentId = departments.find(d => d.code === 'DTECH').id;
    }
    
    assignments.push({
      userId: userId,
      indicatorId: indicator.id,
      departmentId: departmentId,
      isMain: true
    });
  }
  
  const created = [];
  for (const assignment of assignments) {
    try {
      const createdAssignment = await prisma.indicatorAssignment.create({ data: assignment });
      created.push(createdAssignment);
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        throw error;
      }
    }
  }
  
  console.log(`✅ ${created.length} asignaciones de indicadores creadas`);
  return created;
}

// ========== REPORTES DE PROGRESO ==========

async function createProgressReports(activities, indicators, users) {
  console.log('📈 Creando reportes de progreso...');
  
  const currentYear = new Date().getFullYear();
  const reports = [];
  
  // Crear reportes trimestrales para las actividades principales
  const mainActivities = activities.slice(0, 5); // Primeras 5 actividades
  const periods = ['2025-Q1', '2025-Q2', '2025-Q3'];
  
  for (const activity of mainActivities) {
    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const progress = Math.min(90, 30 + (i * 30)); // Progreso incremental
      
      reports.push({
        periodType: 'trimestral',
        period: period,
        currentValue: progress,
        targetValue: 100,
        executionPercentage: progress,
        qualitativeComments: `Avance satisfactorio de la actividad ${activity.name}. Se han completado las tareas programadas para el trimestre.`,
        challenges: i > 0 ? 'Algunos retrasos menores debido a coordinación entre departamentos' : null,
        nextSteps: 'Continuar con las actividades programadas para el siguiente trimestre',
        status: i < 2 ? 'aprobado' : 'pendiente',
        activityId: activity.id,
        reportedById: users.find(u => u.email === 'seguimiento@poa.gov').id,
        reviewedById: i < 2 ? users.find(u => u.email === 'planificacion@poa.gov').id : null,
        reviewedAt: i < 2 ? new Date() : null
      });
    }
  }
  
  // Crear reportes para indicadores principales
  const mainIndicators = indicators.filter(ind => ind.activityId).slice(0, 3);
  
  for (const indicator of mainIndicators) {
    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const progress = Math.min(indicator.annualTarget, indicator.baseline + (i + 1) * (indicator.annualTarget / 4));
      
      reports.push({
        periodType: 'trimestral',
        period: period,
        currentValue: progress,
        targetValue: indicator.annualTarget,
        executionPercentage: (progress / indicator.annualTarget) * 100,
        qualitativeComments: `Progreso del indicador ${indicator.name} dentro de las metas establecidas.`,
        status: i < 2 ? 'aprobado' : 'pendiente',
        indicatorId: indicator.id,
        reportedById: users.find(u => u.email === 'seguimiento@poa.gov').id,
        reviewedById: i < 2 ? users.find(u => u.email === 'planificacion@poa.gov').id : null,
        reviewedAt: i < 2 ? new Date() : null
      });
    }
  }
  
  const created = [];
  for (const report of reports) {
    try {
      const createdReport = await prisma.progressReport.create({ data: report });
      created.push(createdReport);
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        throw error;
      }
    }
  }
  
  console.log(`✅ ${created.length} reportes de progreso creados`);
  return created;
}

// ========== PACC (COMPRAS Y CONTRATACIONES) ==========

async function createProcurementProcesses(activities) {
  console.log('🛒 Creando procesos de contratación...');
  
  const currentYear = new Date().getFullYear();
  const processes = [
    {
      description: 'Contratación de servicios de desarrollo de software para sistema POA-PACC',
      procurementType: 'SERVICIOS',
      procurementMethod: 'LICITACION_RESTRINGIDA',
      estimatedAmount: 2500000.00,
      currency: 'DOP',
      plannedStartDate: new Date(`${currentYear}-01-15`),
      plannedEndDate: new Date(`${currentYear}-03-31`),
      quarter: 'Q1',
      month: '01',
      status: 'EN_PROCESO',
      priority: 'ALTA',
      budgetCode: 'PROD001',
      isRecurrent: false,
      legalFramework: 'LEY_340_06',
      observations: 'Proceso crítico para implementación del sistema integrado',
      activityId: activities.find(a => a.code === 'ACT001').id
    },
    {
      description: 'Adquisición de equipos informáticos para implementación del sistema',
      procurementType: 'BIENES',
      procurementMethod: 'COMPARACION_PRECIOS',
      estimatedAmount: 850000.00,
      currency: 'DOP',
      plannedStartDate: new Date(`${currentYear}-02-01`),
      plannedEndDate: new Date(`${currentYear}-03-15`),
      quarter: 'Q1',
      month: '02',
      status: 'ADJUDICADO',
      priority: 'MEDIA',
      budgetCode: 'PROD001',
      isRecurrent: false,
      legalFramework: 'LEY_340_06',
      observations: 'Equipos necesarios para operación del sistema',
      activityId: activities.find(a => a.code === 'ACT003').id
    },
    {
      description: 'Contratación de servicios de capacitación en gestión POA',
      procurementType: 'SERVICIOS',
      procurementMethod: 'COMPRA_MENOR',
      estimatedAmount: 320000.00,
      currency: 'DOP',
      plannedStartDate: new Date(`${currentYear}-05-01`),
      plannedEndDate: new Date(`${currentYear}-06-30`),
      quarter: 'Q2',
      month: '05',
      status: 'PLANIFICADO',
      priority: 'MEDIA',
      budgetCode: 'PROD003',
      isRecurrent: false,
      legalFramework: 'LEY_340_06',
      observations: 'Capacitación esencial para uso efectivo del sistema',
      activityId: activities.find(a => a.code === 'ACT006').id
    },
    {
      description: 'Contratación de servicios de consultoría para optimización PACC',
      procurementType: 'CONSULTORIA',
      procurementMethod: 'LICITACION_RESTRINGIDA',
      estimatedAmount: 1200000.00,
      currency: 'DOP',
      plannedStartDate: new Date(`${currentYear}-07-01`),
      plannedEndDate: new Date(`${currentYear}-09-30`),
      quarter: 'Q3',
      month: '07',
      status: 'PLANIFICADO',
      priority: 'ALTA',
      budgetCode: 'PROD005',
      isRecurrent: false,
      legalFramework: 'LEY_340_06',
      observations: 'Consultoría para mejora de procesos de compras',
      activityId: activities.find(a => a.code === 'ACT009').id
    },
    {
      description: 'Mantenimiento de software y hardware del sistema integrado',
      procurementType: 'MANTENIMIENTO',
      procurementMethod: 'CONTRATACION_DIRECTA',
      estimatedAmount: 480000.00,
      currency: 'DOP',
      plannedStartDate: new Date(`${currentYear}-01-01`),
      plannedEndDate: new Date(`${currentYear}-12-31`),
      quarter: 'Q1',
      month: '01',
      status: 'EJECUTADO',
      priority: 'ALTA',
      budgetCode: 'MANT001',
      isRecurrent: true,
      legalFramework: 'LEY_340_06',
      observations: 'Mantenimiento continuo del sistema',
      activityId: activities.find(a => a.code === 'ACT001').id
    }
  ];
  
  const created = [];
  for (const process of processes) {
    const createdProcess = await prisma.procurementProcess.create({ data: process });
    created.push(createdProcess);
  }
  
  console.log(`✅ ${created.length} procesos de contratación creados`);
  return created;
}

async function createActivityProcurements(activities, procurementProcesses) {
  console.log('🔗 Creando vínculos actividad-contratación...');
  
  const links = [
    {
      activityId: activities.find(a => a.code === 'ACT001').id,
      procurementProcessId: procurementProcesses[0].id,
      relationship: 'REQUIRED',
      priority: 'HIGH'
    },
    {
      activityId: activities.find(a => a.code === 'ACT003').id,
      procurementProcessId: procurementProcesses[1].id,
      relationship: 'REQUIRED',
      priority: 'MEDIUM'
    },
    {
      activityId: activities.find(a => a.code === 'ACT006').id,
      procurementProcessId: procurementProcesses[2].id,
      relationship: 'REQUIRED',
      priority: 'MEDIUM'
    },
    {
      activityId: activities.find(a => a.code === 'ACT009').id,
      procurementProcessId: procurementProcesses[3].id,
      relationship: 'REQUIRED',
      priority: 'HIGH'
    }
  ];
  
  const created = [];
  for (const link of links) {
    try {
      const createdLink = await prisma.activityProcurement.create({ data: link });
      created.push(createdLink);
    } catch (error) {
      if (!error.message.includes('Unique constraint')) {
        throw error;
      }
    }
  }
  
  console.log(`✅ ${created.length} vínculos actividad-contratación creados`);
  return created;
}

async function createPaccSchedules(procurementProcesses, users) {
  console.log('📅 Creando cronogramas PACC...');
  
  const schedules = [];
  const phases = [
    'PLANIFICACION',
    'LICITACION', 
    'EVALUACION',
    'ADJUDICACION',
    'CONTRATACION',
    'EJECUCION'
  ];
  
  // Crear cronograma para cada proceso
  for (const process of procurementProcesses.slice(0, 3)) { // Primeros 3 procesos
    let currentDate = new Date(process.plannedStartDate);
    
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const duration = phase === 'EJECUCION' ? 60 : 15; // Días
      
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + duration);
      
      schedules.push({
        procurementProcessId: process.id,
        scheduledPhase: phase,
        phaseName: `${phase.toLowerCase().replace('_', ' ')} - ${process.description.substring(0, 50)}...`,
        plannedStartDate: startDate,
        plannedEndDate: endDate,
        actualStartDate: i < 2 ? startDate : null, // Primeras 2 fases iniciadas
        actualEndDate: i < 1 ? endDate : null, // Primera fase completada
        status: i < 1 ? 'COMPLETADA' : i < 2 ? 'EN_PROCESO' : 'PENDIENTE',
        responsibleUserId: users.find(u => u.email === 'compras@poa.gov').id,
        estimatedDuration: duration,
        actualDuration: i < 1 ? duration : null,
        compliancePercentage: i < 1 ? 100 : i < 2 ? 75 : 0,
        criticalPath: phase === 'ADJUDICACION' || phase === 'EJECUCION'
      });
      
      currentDate = new Date(endDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  const created = [];
  for (const schedule of schedules) {
    const createdSchedule = await prisma.paccSchedule.create({ data: schedule });
    created.push(createdSchedule);
  }
  
  console.log(`✅ ${created.length} cronogramas PACC creados`);
  return created;
}

// ========== PRESUPUESTO ==========

async function createBudgetItems() {
  console.log('💰 Creando partidas presupuestarias...');
  
  const items = [
    {
      code: '211',
      name: 'Servicios Técnicos y Profesionales',
      description: 'Contratación de servicios especializados',
      category: 'FUNCIONAMIENTO'
    },
    {
      code: '212',
      name: 'Servicios Informáticos',
      description: 'Desarrollo y mantenimiento de sistemas',
      category: 'FUNCIONAMIENTO'
    },
    {
      code: '213',
      name: 'Servicios de Capacitación',
      description: 'Entrenamiento y desarrollo de personal',
      category: 'FUNCIONAMIENTO'
    },
    {
      code: '511',
      name: 'Equipos Informáticos',
      description: 'Adquisición de hardware y software',
      category: 'INVERSION'
    },
    {
      code: '512',
      name: 'Mobiliario y Equipos de Oficina',
      description: 'Equipamiento general de oficinas',
      category: 'INVERSION'
    }
  ];
  
  const created = [];
  for (const item of items) {
    const createdItem = await prisma.budgetItem.create({ data: item });
    created.push(createdItem);
  }
  
  console.log(`✅ ${created.length} partidas presupuestarias creadas`);
  return created;
}

async function createBudgetAllocations(activities, procurementProcesses) {
  console.log('📊 Creando asignaciones presupuestarias...');
  
  const currentYear = new Date().getFullYear();
  const allocations = [
    {
      budgetCode: 'PROD001-DEV',
      budgetType: 'FUNCIONAMIENTO',
      fiscalYear: currentYear,
      allocatedAmount: 2500000.00,
      executedAmount: 625000.00,
      availableAmount: 1875000.00,
      quarter: 'Q1',
      month: '01',
      source: 'RECURSOS_INTERNOS',
      category: '200',
      subcategory: '211',
      object: '211001',
      sigefCode: 'SIGEF-2025-001',
      observations: 'Presupuesto para desarrollo del sistema POA-PACC',
      activityId: activities.find(a => a.code === 'ACT001').id,
      procurementProcessId: procurementProcesses[0].id
    },
    {
      budgetCode: 'PROD001-EQUIP',
      budgetType: 'INVERSION',
      fiscalYear: currentYear,
      allocatedAmount: 850000.00,
      executedAmount: 850000.00,
      availableAmount: 0.00,
      quarter: 'Q1',
      month: '02',
      source: 'RECURSOS_INTERNOS',
      category: '500',
      subcategory: '511',
      object: '511001',
      sigefCode: 'SIGEF-2025-002',
      observations: 'Presupuesto para adquisición de equipos',
      activityId: activities.find(a => a.code === 'ACT003').id,
      procurementProcessId: procurementProcesses[1].id
    },
    {
      budgetCode: 'PROD003-CAP',
      budgetType: 'FUNCIONAMIENTO',
      fiscalYear: currentYear,
      allocatedAmount: 320000.00,
      executedAmount: 0.00,
      availableAmount: 320000.00,
      quarter: 'Q2',
      month: '05',
      source: 'RECURSOS_INTERNOS',
      category: '200',
      subcategory: '213',
      object: '213001',
      sigefCode: 'SIGEF-2025-003',
      observations: 'Presupuesto para capacitación del personal',
      activityId: activities.find(a => a.code === 'ACT006').id,
      procurementProcessId: procurementProcesses[2].id
    }
  ];
  
  const created = [];
  for (const allocation of allocations) {
    const createdAllocation = await prisma.budgetAllocation.create({ data: allocation });
    created.push(createdAllocation);
  }
  
  console.log(`✅ ${created.length} asignaciones presupuestarias creadas`);
  return created;
}

async function createBudgetExecutions(activities, budgetItems, budgetAllocations) {
  console.log('💸 Creando ejecuciones presupuestarias...');
  
  const currentYear = new Date().getFullYear();
  const executions = [
    {
      executionDate: new Date(`${currentYear}-01-20`),
      amount: 625000.00,
      description: 'Primer pago por desarrollo del sistema POA-PACC',
      documentNumber: 'COMP-2025-001',
      executionType: 'PAGADO',
      month: '01',
      quarter: 'Q1',
      fiscalYear: currentYear,
      sigefReference: 'SIGEF-PAY-001',
      observations: 'Pago inicial del 25% del contrato',
      activityId: activities.find(a => a.code === 'ACT001').id,
      budgetItemId: budgetItems.find(b => b.code === '212').id,
      budgetAllocationId: budgetAllocations[0].id,
      assignedAmount: 2500000.00,
      committedAmount: 2500000.00,
      accruedAmount: 625000.00,
      paidAmount: 625000.00,
      executionPercent: 25.0
    },
    {
      executionDate: new Date(`${currentYear}-02-15`),
      amount: 850000.00,
      description: 'Pago completo por adquisición de equipos informáticos',
      documentNumber: 'COMP-2025-002',
      executionType: 'PAGADO',
      month: '02',
      quarter: 'Q1',
      fiscalYear: currentYear,
      sigefReference: 'SIGEF-PAY-002',
      observations: 'Pago completo por equipos entregados',
      activityId: activities.find(a => a.code === 'ACT003').id,
      budgetItemId: budgetItems.find(b => b.code === '511').id,
      budgetAllocationId: budgetAllocations[1].id,
      assignedAmount: 850000.00,
      committedAmount: 850000.00,
      accruedAmount: 850000.00,
      paidAmount: 850000.00,
      executionPercent: 100.0
    },
    {
      executionDate: new Date(`${currentYear}-03-10`),
      amount: 1250000.00,
      description: 'Segundo pago por desarrollo del sistema POA-PACC',
      documentNumber: 'COMP-2025-003',
      executionType: 'DEVENGADO',
      month: '03',
      quarter: 'Q1',
      fiscalYear: currentYear,
      sigefReference: 'SIGEF-ACC-003',
      observations: 'Pago del 50% por entregables completados',
      activityId: activities.find(a => a.code === 'ACT001').id,
      budgetItemId: budgetItems.find(b => b.code === '212').id,
      budgetAllocationId: budgetAllocations[0].id,
      assignedAmount: 2500000.00,
      committedAmount: 2500000.00,
      accruedAmount: 1250000.00,
      paidAmount: 0.00,
      executionPercent: 50.0
    }
  ];
  
  const created = [];
  for (const execution of executions) {
    const createdExecution = await prisma.budgetExecution.create({ data: execution });
    created.push(createdExecution);
  }
  
  console.log(`✅ ${created.length} ejecuciones presupuestarias creadas`);
  return created;
}

// ========== CORRELACIÓN Y CUMPLIMIENTO ==========

async function createPoaPaccBudgetCorrelations(activities) {
  console.log('🔗 Creando correlaciones POA-PACC-Presupuesto...');
  
  const correlations = [
    {
      activityId: activities.find(a => a.code === 'ACT001').id,
      hasProcurementNeeds: true,
      procurementCompliance: 75.0,
      hasBudgetAllocation: true,
      budgetCompliance: 85.0,
      overallCompliance: 80.0,
      riskLevel: 'MEDIO',
      complianceStatus: 'EN_CUMPLIMIENTO',
      nextReviewDate: new Date('2025-04-01'),
      observations: 'Actividad crítica con buen nivel de cumplimiento',
      recommendations: 'Mantener seguimiento estrecho del cronograma'
    },
    {
      activityId: activities.find(a => a.code === 'ACT002').id,
      hasProcurementNeeds: true,
      procurementCompliance: 60.0,
      hasBudgetAllocation: true,
      budgetCompliance: 70.0,
      overallCompliance: 65.0,
      riskLevel: 'MEDIO',
      complianceStatus: 'EN_RIESGO',
      nextReviewDate: new Date('2025-03-15'),
      observations: 'Retrasos menores en procesos de contratación',
      recommendations: 'Acelerar procesos de evaluación y adjudicación'
    },
    {
      activityId: activities.find(a => a.code === 'ACT003').id,
      hasProcurementNeeds: true,
      procurementCompliance: 95.0,
      hasBudgetAllocation: true,
      budgetCompliance: 100.0,
      overallCompliance: 97.5,
      riskLevel: 'BAJO',
      complianceStatus: 'EN_CUMPLIMIENTO',
      nextReviewDate: new Date('2025-05-01'),
      observations: 'Actividad completada exitosamente',
      recommendations: 'Documentar lecciones aprendidas para futuras actividades'
    }
  ];
  
  const created = [];
  for (const correlation of correlations) {
    const createdCorrelation = await prisma.poaPaccBudgetCorrelation.create({ data: correlation });
    created.push(createdCorrelation);
  }
  
  console.log(`✅ ${created.length} correlaciones POA-PACC-Presupuesto creadas`);
  return created;
}

async function createPaccCompliances(users) {
  console.log('📋 Creando evaluaciones de cumplimiento PACC...');
  
  const currentYear = new Date().getFullYear();
  const compliances = [
    {
      evaluationPeriod: '2025-Q1',
      periodType: 'TRIMESTRAL',
      fiscalYear: currentYear,
      totalProcesses: 5,
      processesOnSchedule: 3,
      processesDelayed: 1,
      processesAtRisk: 1,
      processesCancelled: 0,
      scheduledMilestones: 18,
      achievedMilestones: 14,
      delayedMilestones: 3,
      milestoneComplianceRate: 77.8,
      averageDelay: 5.2,
      criticalPathCompliance: 85.0,
      budgetCompliance: 88.5,
      legalComplianceScore: 95.0,
      timelinessScore: 78.0,
      qualityScore: 90.0,
      overallScore: 84.3,
      complianceGrade: 'B+',
      keyFindings: 'Cumplimiento general satisfactorio con oportunidades de mejora en tiempos',
      recommendations: 'Mejorar coordinación entre departamentos para reducir retrasos',
      actionPlan: 'Implementar reuniones semanales de seguimiento',
      riskFactors: 'Dependencias externas y coordinación interdepartamental',
      mitigationMeasures: 'Establecer protocolos de comunicación más ágiles',
      evaluatedBy: users.find(u => u.email === 'compras@poa.gov').id,
      approvedBy: users.find(u => u.email === 'director@poa.gov').id,
      evaluationDate: new Date('2025-04-05'),
      approvalDate: new Date('2025-04-10')
    },
    {
      evaluationPeriod: '2025-02',
      periodType: 'MENSUAL',
      fiscalYear: currentYear,
      totalProcesses: 3,
      processesOnSchedule: 2,
      processesDelayed: 0,
      processesAtRisk: 1,
      processesCancelled: 0,
      scheduledMilestones: 8,
      achievedMilestones: 7,
      delayedMilestones: 1,
      milestoneComplianceRate: 87.5,
      averageDelay: 2.1,
      criticalPathCompliance: 90.0,
      budgetCompliance: 92.3,
      legalComplianceScore: 98.0,
      timelinessScore: 88.0,
      qualityScore: 94.0,
      overallScore: 90.1,
      complianceGrade: 'A-',
      keyFindings: 'Excelente desempeño mensual con cumplimiento de la mayoría de hitos',
      recommendations: 'Mantener el ritmo actual y documentar mejores prácticas',
      actionPlan: 'Continuar con procesos establecidos',
      evaluatedBy: users.find(u => u.email === 'compras@poa.gov').id,
      approvedBy: users.find(u => u.email === 'director@poa.gov').id,
      evaluationDate: new Date('2025-03-05'),
      approvalDate: new Date('2025-03-08')
    }
  ];
  
  const created = [];
  for (const compliance of compliances) {
    const createdCompliance = await prisma.paccCompliance.create({ data: compliance });
    created.push(createdCompliance);
  }
  
  console.log(`✅ ${created.length} evaluaciones de cumplimiento PACC creadas`);
  return created;
}

async function createPaccAlerts(procurementProcesses, paccSchedules, users) {
  console.log('🚨 Creando alertas PACC...');
  
  const alerts = [
    {
      alertType: 'CRITICAL_DELAY',
      severity: 'ALTA',
      title: 'Retraso en evaluación de propuestas',
      description: 'El proceso de evaluación del desarrollo de software presenta retraso de 5 días',
      procurementProcessId: procurementProcesses[0].id,
      scheduleId: paccSchedules.find(s => s.scheduledPhase === 'EVALUACION').id,
      triggerDate: new Date('2025-02-15'),
      dueDate: new Date('2025-02-20'),
      status: 'ACTIVA',
      priority: 'ALTA',
      affectedMilestones: 'Evaluación técnica y económica',
      potentialImpact: 'Retraso en inicio de desarrollo del sistema',
      suggestedActions: 'Asignar recursos adicionales para evaluación',
      assignedTo: users.find(u => u.email === 'compras@poa.gov').id,
      createdBy: users.find(u => u.email === 'admin@poa.gov').id,
      escalatedTo: users.find(u => u.email === 'director@poa.gov').id,
      autoGenerated: true,
      requiresApproval: false,
      notificationSent: true
    },
    {
      alertType: 'BUDGET_THRESHOLD',
      severity: 'MEDIA',
      title: 'Ejecución presupuestaria del 75%',
      description: 'Se ha alcanzado el 75% de ejecución del presupuesto asignado',
      procurementProcessId: procurementProcesses[0].id,
      triggerDate: new Date('2025-03-10'),
      dueDate: new Date('2025-03-31'),
      status: 'RESUELTA',
      priority: 'MEDIA',
      potentialImpact: 'Necesidad de planificar siguiente desembolso',
      suggestedActions: 'Preparar documentación para próximo pago',
      assignedTo: users.find(u => u.email === 'presupuesto@poa.gov').id,
      createdBy: users.find(u => u.email === 'admin@poa.gov').id,
      autoGenerated: true,
      requiresApproval: false,
      notificationSent: true,
      resolvedDate: new Date('2025-03-12')
    },
    {
      alertType: 'MILESTONE_RISK',
      severity: 'MEDIA',
      title: 'Riesgo en cronograma de capacitación',
      description: 'La actividad de capacitación podría retrasarse debido a disponibilidad de facilitadores',
      procurementProcessId: procurementProcesses[2].id,
      triggerDate: new Date('2025-04-01'),
      dueDate: new Date('2025-05-01'),
      status: 'PENDIENTE',
      priority: 'MEDIA',
      affectedMilestones: 'Inicio de capacitación',
      potentialImpact: 'Retraso en capacitación del personal',
      suggestedActions: 'Confirmar disponibilidad de facilitadores y fechas alternativas',
      assignedTo: users.find(u => u.email === 'planificacion@poa.gov').id,
      createdBy: users.find(u => u.email === 'compras@poa.gov').id,
      autoGenerated: false,
      requiresApproval: true,
      notificationSent: true
    }
  ];
  
  const created = [];
  for (const alert of alerts) {
    const createdAlert = await prisma.paccAlert.create({ data: alert });
    created.push(createdAlert);
  }
  
  console.log(`✅ ${created.length} alertas PACC creadas`);
  return created;
}

// ========== FUNCIÓN DE RESUMEN ==========

async function showDataSummary(data) {
  console.log('\n📊 RESUMEN DE DATOS CREADOS');
  console.log('================================');
  
  const summary = {
    'Departamentos': data.departments.length,
    'Roles': data.roles.length,
    'Permisos': data.permissions.length,
    'Usuarios': data.users.length,
    'Ejes Estratégicos': data.strategicAxes.length,
    'Objetivos': data.objectives.length,
    'Productos': data.products.length,
    'Actividades': data.activities.length,
    'Indicadores': data.indicators.length,
    'Asignaciones de Actividades': data.activityAssignments.length,
    'Asignaciones de Indicadores': data.indicatorAssignments.length,
    'Reportes de Progreso': data.progressReports.length,
    'Procesos de Contratación': data.procurementProcesses.length,
    'Vínculos Actividad-PACC': data.activityProcurements.length,
    'Cronogramas PACC': data.paccSchedules.length,
    'Partidas Presupuestarias': data.budgetItems.length,
    'Asignaciones Presupuestarias': data.budgetAllocations.length,
    'Ejecuciones Presupuestarias': data.budgetExecutions.length,
    'Correlaciones POA-PACC-Presupuesto': data.poaCorrelations.length,
    'Evaluaciones de Cumplimiento PACC': data.paccCompliances.length,
    'Alertas PACC': data.paccAlerts.length
  };
  
  for (const [key, value] of Object.entries(summary)) {
    console.log(`✅ ${key}: ${value}`);
  }
  
  console.log('\n🔗 INTERRELACIONES CREADAS:');
  console.log('- Usuarios asignados a departamentos y roles');
  console.log('- Ejes estratégicos vinculados a departamentos');
  console.log('- Objetivos asociados a ejes estratégicos');
  console.log('- Productos vinculados a objetivos');
  console.log('- Actividades asociadas a productos');
  console.log('- Indicadores en todos los niveles (eje, objetivo, producto, actividad)');
  console.log('- Asignaciones de responsabilidades por actividad e indicador');
  console.log('- Reportes de progreso para actividades e indicadores');
  console.log('- Procesos PACC vinculados a actividades específicas');
  console.log('- Cronogramas detallados para procesos PACC');
  console.log('- Asignaciones y ejecuciones presupuestarias');
  console.log('- Correlaciones completas POA-PACC-Presupuesto');
  console.log('- Sistema de alertas y cumplimiento operativo');
}

module.exports = createCompleteExampleData;

if (require.main === module) {
  createCompleteExampleData().catch(console.error);
}
