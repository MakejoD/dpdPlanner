const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCompleteExampleData() {
  try {
    console.log('🚀 Iniciando creación de datos de ejemplo completos...');

    // Limpiar datos existentes en orden correcto
    console.log('🧹 Limpiando datos existentes...');
    await prisma.activityAssignment.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.objective.deleteMany({});
    await prisma.strategicAxis.deleteMany({});

    // ========== 1. DEPARTAMENTOS ==========
    console.log('📋 Creando departamentos...');
    
    const departments = await Promise.all([
      prisma.department.upsert({
        where: { code: 'DG' },
        update: {},
        create: {
          name: 'Dirección General',
          code: 'DG',
          description: 'Dirección General de la institución',
          isActive: true
        }
      }),
      prisma.department.upsert({
        where: { code: 'DP' },
        update: {},
        create: {
          name: 'Dirección de Planificación',
          code: 'DP',
          description: 'Responsable de la planificación estratégica y operativa',
          isActive: true
        }
      }),
      prisma.department.upsert({
        where: { code: 'DA' },
        update: {},
        create: {
          name: 'Dirección Administrativa',
          code: 'DA',
          description: 'Gestión administrativa y recursos humanos',
          isActive: true
        }
      }),
      prisma.department.upsert({
        where: { code: 'DF' },
        update: {},
        create: {
          name: 'Dirección Financiera',
          code: 'DF',
          description: 'Gestión financiera y presupuestaria',
          isActive: true
        }
      }),
      prisma.department.upsert({
        where: { code: 'DC' },
        update: {},
        create: {
          name: 'Dirección de Compras',
          code: 'DC',
          description: 'Gestión de procesos de contratación y compras',
          isActive: true
        }
      }),
      prisma.department.upsert({
        where: { code: 'DT' },
        update: {},
        create: {
          name: 'Dirección de Tecnología',
          code: 'DT',
          description: 'Gestión de tecnología e innovación',
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${departments.length} departamentos creados`);

    // ========== 2. ROLES ==========
    console.log('👤 Creando roles...');
    
    const roles = await Promise.all([
      prisma.role.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {},
        create: {
          name: 'SUPER_ADMIN',
          description: 'Super administrador con acceso total al sistema'
        }
      }),
      prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: {
          name: 'ADMIN',
          description: 'Administrador con acceso completo al POA'
        }
      }),
      prisma.role.upsert({
        where: { name: 'PLANNER' },
        update: {},
        create: {
          name: 'PLANNER',
          description: 'Planificador - puede crear y editar POA'
        }
      }),
      prisma.role.upsert({
        where: { name: 'COORDINATOR' },
        update: {},
        create: {
          name: 'COORDINATOR',
          description: 'Coordinador - supervisa actividades asignadas'
        }
      }),
      prisma.role.upsert({
        where: { name: 'EXECUTOR' },
        update: {},
        create: {
          name: 'EXECUTOR',
          description: 'Ejecutor - realiza actividades y reporta progreso'
        }
      }),
      prisma.role.upsert({
        where: { name: 'BUDGET_MANAGER' },
        update: {},
        create: {
          name: 'BUDGET_MANAGER',
          description: 'Gestor de presupuesto - maneja ejecución presupuestaria'
        }
      }),
      prisma.role.upsert({
        where: { name: 'PROCUREMENT_OFFICER' },
        update: {},
        create: {
          name: 'PROCUREMENT_OFFICER',
          description: 'Oficial de compras - gestiona procesos de contratación'
        }
      }),
      prisma.role.upsert({
        where: { name: 'VIEWER' },
        update: {},
        create: {
          name: 'VIEWER',
          description: 'Consultor - solo lectura de reportes y seguimiento'
        }
      })
    ]);

    console.log(`✅ ${roles.length} roles creados`);

    // ========== 3. USUARIOS ==========
    console.log('👥 Creando usuarios...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const users = await Promise.all([
      // Dirección General
      prisma.user.upsert({
        where: { email: 'director.general@poa.gov.do' },
        update: {},
        create: {
          email: 'director.general@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'María Elena',
          lastName: 'Rodríguez Pérez',
          roleId: roles.find(r => r.name === 'SUPER_ADMIN').id,
          departmentId: departments.find(d => d.code === 'DG').id,
          isActive: true
        }
      }),
      
      // Dirección de Planificación
      prisma.user.upsert({
        where: { email: 'planificacion@poa.gov.do' },
        update: {},
        create: {
          email: 'planificacion@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'Carlos Alberto',
          lastName: 'Martínez López',
          roleId: roles.find(r => r.name === 'ADMIN').id,
          departmentId: departments.find(d => d.code === 'DP').id,
          isActive: true
        }
      }),
      
      prisma.user.upsert({
        where: { email: 'ana.planificadora@poa.gov.do' },
        update: {},
        create: {
          email: 'ana.planificadora@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'Ana María',
          lastName: 'González Fernández',
          roleId: roles.find(r => r.name === 'PLANNER').id,
          departmentId: departments.find(d => d.code === 'DP').id,
          isActive: true
        }
      }),
      
      // Dirección Administrativa
      prisma.user.upsert({
        where: { email: 'luis.admin@poa.gov.do' },
        update: {},
        create: {
          email: 'luis.admin@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'Luis Fernando',
          lastName: 'Jiménez Castro',
          roleId: roles.find(r => r.name === 'COORDINATOR').id,
          departmentId: departments.find(d => d.code === 'DA').id,
          isActive: true
        }
      }),
      
      // Dirección Financiera
      prisma.user.upsert({
        where: { email: 'presupuesto@poa.gov.do' },
        update: {},
        create: {
          email: 'presupuesto@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'Carmen Rosa',
          lastName: 'Valdez Morales',
          roleId: roles.find(r => r.name === 'BUDGET_MANAGER').id,
          departmentId: departments.find(d => d.code === 'DF').id,
          isActive: true
        }
      }),
      
      // Dirección de Compras
      prisma.user.upsert({
        where: { email: 'compras@poa.gov.do' },
        update: {},
        create: {
          email: 'compras@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'Roberto Carlos',
          lastName: 'Herrera Núñez',
          roleId: roles.find(r => r.name === 'PROCUREMENT_OFFICER').id,
          departmentId: departments.find(d => d.code === 'DC').id,
          isActive: true
        }
      }),
      
      // Dirección de Tecnología
      prisma.user.upsert({
        where: { email: 'tecnologia@poa.gov.do' },
        update: {},
        create: {
          email: 'tecnologia@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'Patricia Isabel',
          lastName: 'Ramírez Torres',
          roleId: roles.find(r => r.name === 'EXECUTOR').id,
          departmentId: departments.find(d => d.code === 'DT').id,
          isActive: true
        }
      }),
      
      // Ejecutores adicionales
      prisma.user.upsert({
        where: { email: 'ejecutor1@poa.gov.do' },
        update: {},
        create: {
          email: 'ejecutor1@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'Miguel Ángel',
          lastName: 'Reyes Santana',
          roleId: roles.find(r => r.name === 'EXECUTOR').id,
          departmentId: departments.find(d => d.code === 'DP').id,
          isActive: true
        }
      }),
      
      prisma.user.upsert({
        where: { email: 'consultor@poa.gov.do' },
        update: {},
        create: {
          email: 'consultor@poa.gov.do',
          passwordHash: hashedPassword,
          firstName: 'Sandra Milena',
          lastName: 'Acosta Rivera',
          roleId: roles.find(r => r.name === 'VIEWER').id,
          departmentId: departments.find(d => d.code === 'DG').id,
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${users.length} usuarios creados`);

    // ========== 4. EJES ESTRATÉGICOS ==========
    console.log('🎯 Creando ejes estratégicos...');
    
    const strategicAxes = await Promise.all([
      prisma.strategicAxis.create({
        data: {
          name: 'Modernización de la Gestión Pública',
          description: 'Fortalecimiento de la capacidad institucional y modernización de procesos para mejorar la eficiencia del sector público',
          code: 'EJE-001-2025',
          year: 2025,
          departmentId: departments.find(d => d.code === 'DG').id,
          isActive: true,
          isLocked: false
        }
      }),
      
      prisma.strategicAxis.create({
        data: {
          name: 'Transparencia y Rendición de Cuentas',
          description: 'Implementación de mecanismos de transparencia y rendición de cuentas para fortalecer la confianza ciudadana',
          code: 'EJE-002-2025',
          year: 2025,
          departmentId: departments.find(d => d.code === 'DG').id,
          isActive: true,
          isLocked: false
        }
      }),
      
      prisma.strategicAxis.create({
        data: {
          name: 'Innovación y Transformación Digital',
          description: 'Adopción de tecnologías digitales para mejorar los servicios públicos y la experiencia ciudadana',
          code: 'EJE-003-2025',
          year: 2025,
          departmentId: departments.find(d => d.code === 'DT').id,
          isActive: true,
          isLocked: false
        }
      }),
      
      prisma.strategicAxis.create({
        data: {
          name: 'Eficiencia en el Gasto Público',
          description: 'Optimización del uso de recursos públicos mediante mejores prácticas de planificación y ejecución presupuestaria',
          code: 'EJE-004-2025',
          year: 2025,
          departmentId: departments.find(d => d.code === 'DF').id,
          isActive: true,
          isLocked: false
        }
      })
    ]);

    console.log(`✅ ${strategicAxes.length} ejes estratégicos creados`);

    // ========== 5. OBJETIVOS ==========
    console.log('🎯 Creando objetivos...');
    
    const objectives = await Promise.all([
      // Objetivos para EJE-001
      prisma.objective.create({
        data: {
          name: 'Implementar sistema integrado de planificación',
          description: 'Desarrollar e implementar un sistema integrado POA-PACC-Presupuesto que mejore la coordinación institucional',
          code: 'OBJ-001-2025',
          order: 1,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-001-2025').id,
          isActive: true
        }
      }),
      
      prisma.objective.create({
        data: {
          name: 'Fortalecer capacidades del personal',
          description: 'Desarrollar competencias del personal en planificación estratégica y operativa',
          code: 'OBJ-002-2025',
          order: 2,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-001-2025').id,
          isActive: true
        }
      }),
      
      // Objetivos para EJE-002
      prisma.objective.create({
        data: {
          name: 'Mejorar portal de transparencia',
          description: 'Actualizar y mejorar el portal de transparencia institucional con información en tiempo real',
          code: 'OBJ-003-2025',
          order: 1,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-002-2025').id,
          isActive: true
        }
      }),
      
      prisma.objective.create({
        data: {
          name: 'Implementar sistema de seguimiento ciudadano',
          description: 'Crear mecanismos para que la ciudadanía pueda dar seguimiento a proyectos y programas',
          code: 'OBJ-004-2025',
          order: 2,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-002-2025').id,
          isActive: true
        }
      }),
      
      // Objetivos para EJE-003
      prisma.objective.create({
        data: {
          name: 'Digitalizar servicios prioritarios',
          description: 'Transformar digitalmente los 10 servicios más demandados por la ciudadanía',
          code: 'OBJ-005-2025',
          order: 1,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-003-2025').id,
          isActive: true
        }
      }),
      
      // Objetivos para EJE-004
      prisma.objective.create({
        data: {
          name: 'Optimizar procesos de contratación',
          description: 'Mejorar la eficiencia y transparencia en los procesos de contratación pública',
          code: 'OBJ-006-2025',
          order: 1,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-004-2025').id,
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${objectives.length} objetivos creados`);

    // ========== 6. PRODUCTOS ==========
    console.log('📦 Creando productos...');
    
    const products = await Promise.all([
      // Productos para OBJ-001
      prisma.product.create({
        data: {
          name: 'Sistema POA-PACC-Presupuesto',
          description: 'Plataforma web integrada para la gestión del POA, PACC y Presupuesto institucional',
          code: 'PROD-001-2025',
          type: 'PRODUCT',
          order: 1,
          objectiveId: objectives.find(o => o.code === 'OBJ-001-2025').id,
          isActive: true
        }
      }),
      
      prisma.product.create({
        data: {
          name: 'Manual de procedimientos POA',
          description: 'Manual actualizado de procedimientos para la elaboración y seguimiento del POA',
          code: 'PROD-002-2025',
          type: 'PRODUCT',
          order: 2,
          objectiveId: objectives.find(o => o.code === 'OBJ-001-2025').id,
          isActive: true
        }
      }),
      
      // Productos para OBJ-002
      prisma.product.create({
        data: {
          name: 'Programa de capacitación en planificación',
          description: 'Programa integral de capacitación del personal en herramientas de planificación estratégica',
          code: 'PROD-003-2025',
          type: 'PRODUCT',
          order: 1,
          objectiveId: objectives.find(o => o.code === 'OBJ-002-2025').id,
          isActive: true
        }
      }),
      
      // Productos para OBJ-003
      prisma.product.create({
        data: {
          name: 'Portal de transparencia renovado',
          description: 'Portal web renovado con información actualizada y funcionalidades mejoradas',
          code: 'PROD-004-2025',
          type: 'PRODUCT',
          order: 1,
          objectiveId: objectives.find(o => o.code === 'OBJ-003-2025').id,
          isActive: true
        }
      }),
      
      // Productos para OBJ-004
      prisma.product.create({
        data: {
          name: 'App de seguimiento ciudadano',
          description: 'Aplicación móvil para seguimiento de proyectos y servicios por parte de la ciudadanía',
          code: 'PROD-005-2025',
          type: 'PRODUCT',
          order: 1,
          objectiveId: objectives.find(o => o.code === 'OBJ-004-2025').id,
          isActive: true
        }
      }),
      
      // Productos para OBJ-005
      prisma.product.create({
        data: {
          name: 'Servicios digitales prioritarios',
          description: 'Conjunto de 10 servicios digitalizados de alta demanda ciudadana',
          code: 'PROD-006-2025',
          type: 'PRODUCT',
          order: 1,
          objectiveId: objectives.find(o => o.code === 'OBJ-005-2025').id,
          isActive: true
        }
      }),
      
      // Productos para OBJ-006
      prisma.product.create({
        data: {
          name: 'Sistema de contratación optimizado',
          description: 'Sistema mejorado de gestión de procesos de contratación pública',
          code: 'PROD-007-2025',
          type: 'PRODUCT',
          order: 1,
          objectiveId: objectives.find(o => o.code === 'OBJ-006-2025').id,
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${products.length} productos creados`);

    // ========== 7. ACTIVIDADES ==========
    console.log('📋 Creando actividades...');
    
    const activities = await Promise.all([
      // Actividades para PROD-001 (Sistema POA-PACC-Presupuesto)
      prisma.activity.create({
        data: {
          name: 'Análisis y diseño del sistema',
          description: 'Realizar análisis de requerimientos y diseño de la arquitectura del sistema POA-PACC-Presupuesto',
          code: 'ACT-001-2025',
          productId: products.find(p => p.code === 'PROD-001-2025').id,
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-03-31'),
          order: 1,
          isActive: true
        }
      }),
      
      prisma.activity.create({
        data: {
          name: 'Desarrollo del sistema',
          description: 'Desarrollo e implementación de la plataforma web integrada',
          code: 'ACT-002-2025',
          productId: products.find(p => p.code === 'PROD-001-2025').id,
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-08-31'),
          order: 2,
          isActive: true
        }
      }),
      
      prisma.activity.create({
        data: {
          name: 'Pruebas y capacitación',
          description: 'Realizar pruebas del sistema y capacitar a los usuarios finales',
          code: 'ACT-003-2025',
          productId: products.find(p => p.code === 'PROD-001-2025').id,
          startDate: new Date('2025-09-01'),
          endDate: new Date('2025-10-31'),
          order: 3,
          isActive: true
        }
      }),
      
      // Actividades para PROD-002 (Manual de procedimientos)
      prisma.activity.create({
        data: {
          name: 'Revisión de procedimientos actuales',
          description: 'Análisis y documentación de los procedimientos actuales del POA',
          code: 'ACT-004-2025',
          productId: products.find(p => p.code === 'PROD-002-2025').id,
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-03-31'),
          order: 1,
          isActive: true
        }
      }),
      
      prisma.activity.create({
        data: {
          name: 'Elaboración del manual actualizado',
          description: 'Redacción y diseño del manual de procedimientos actualizado',
          code: 'ACT-005-2025',
          productId: products.find(p => p.code === 'PROD-002-2025').id,
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-05-31'),
          order: 2,
          isActive: true
        }
      }),
      
      // Actividades para PROD-003 (Programa de capacitación)
      prisma.activity.create({
        data: {
          name: 'Diseño del programa de capacitación',
          description: 'Diseñar el currículo y metodología del programa de capacitación',
          code: 'ACT-006-2025',
          productId: products.find(p => p.code === 'PROD-003-2025').id,
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-04-30'),
          order: 1,
          isActive: true
        }
      }),
      
      prisma.activity.create({
        data: {
          name: 'Ejecución de capacitaciones',
          description: 'Implementar el programa de capacitación para todo el personal',
          code: 'ACT-007-2025',
          productId: products.find(p => p.code === 'PROD-003-2025').id,
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-09-30'),
          order: 2,
          isActive: true
        }
      }),
      
      // Actividades para PROD-004 (Portal de transparencia)
      prisma.activity.create({
        data: {
          name: 'Rediseño del portal web',
          description: 'Actualizar el diseño y funcionalidades del portal de transparencia',
          code: 'ACT-008-2025',
          productId: products.find(p => p.code === 'PROD-004-2025').id,
          startDate: new Date('2025-02-15'),
          endDate: new Date('2025-06-30'),
          order: 1,
          isActive: true
        }
      }),
      
      // Actividades para PROD-005 (App ciudadana)
      prisma.activity.create({
        data: {
          name: 'Desarrollo de aplicación móvil',
          description: 'Crear aplicación móvil para seguimiento ciudadano de proyectos',
          code: 'ACT-009-2025',
          productId: products.find(p => p.code === 'PROD-005-2025').id,
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-08-31'),
          order: 1,
          isActive: true
        }
      }),
      
      // Actividades para PROD-006 (Servicios digitales)
      prisma.activity.create({
        data: {
          name: 'Digitalización de servicios prioritarios',
          description: 'Digitalizar los 10 servicios de mayor demanda ciudadana',
          code: 'ACT-010-2025',
          productId: products.find(p => p.code === 'PROD-006-2025').id,
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-11-30'),
          order: 1,
          isActive: true
        }
      }),
      
      // Actividades para PROD-007 (Sistema de contratación)
      prisma.activity.create({
        data: {
          name: 'Optimización de procesos de contratación',
          description: 'Mejorar y automatizar los procesos de contratación pública',
          code: 'ACT-011-2025',
          productId: products.find(p => p.code === 'PROD-007-2025').id,
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-07-31'),
          order: 1,
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${activities.length} actividades creadas`);

    // ========== 8. ASIGNACIONES DE ACTIVIDADES ==========
    console.log('👤 Creando asignaciones de actividades...');
    
    const assignments = await Promise.all([
      // ACT-001: Análisis y diseño del sistema
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-001-2025').id,
          userId: users.find(u => u.email === 'tecnologia@poa.gov.do').id,
          isMain: true
        }
      }),
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-001-2025').id,
          userId: users.find(u => u.email === 'ana.planificadora@poa.gov.do').id,
          isMain: false
        }
      }),
      
      // ACT-002: Desarrollo del sistema
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-002-2025').id,
          userId: users.find(u => u.email === 'tecnologia@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-003: Pruebas y capacitación
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-003-2025').id,
          userId: users.find(u => u.email === 'luis.admin@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-004: Revisión de procedimientos
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-004-2025').id,
          userId: users.find(u => u.email === 'ana.planificadora@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-005: Elaboración del manual
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-005-2025').id,
          userId: users.find(u => u.email === 'planificacion@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-006: Diseño del programa de capacitación
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-006-2025').id,
          userId: users.find(u => u.email === 'luis.admin@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-007: Ejecución de capacitaciones
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-007-2025').id,
          userId: users.find(u => u.email === 'ejecutor1@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-008: Rediseño del portal
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-008-2025').id,
          userId: users.find(u => u.email === 'tecnologia@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-009: Desarrollo de app móvil
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-009-2025').id,
          userId: users.find(u => u.email === 'tecnologia@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-010: Digitalización de servicios
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-010-2025').id,
          userId: users.find(u => u.email === 'ejecutor1@poa.gov.do').id,
          isMain: true
        }
      }),
      
      // ACT-011: Optimización de contratación
      prisma.activityAssignment.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-011-2025').id,
          userId: users.find(u => u.email === 'compras@poa.gov.do').id,
          isMain: true
        }
      })
    ]);

    console.log(`✅ ${assignments.length} asignaciones creadas`);

    console.log('🎉 ¡Datos de ejemplo completos creados exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log(`- ${departments.length} Departamentos`);
    console.log(`- ${roles.length} Roles`);
    console.log(`- ${users.length} Usuarios`);
    console.log(`- ${strategicAxes.length} Ejes Estratégicos`);
    console.log(`- ${objectives.length} Objetivos`);
    console.log(`- ${products.length} Productos`);
    console.log(`- ${activities.length} Actividades`);
    console.log(`- ${assignments.length} Asignaciones`);

  } catch (error) {
    console.error('❌ Error creando datos de ejemplo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createCompleteExampleData()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { createCompleteExampleData };
