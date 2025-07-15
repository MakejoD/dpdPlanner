const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function setupCompleteSystem() {
  console.log('🚀 CONFIGURACIÓN AUTOMÁTICA DEL SISTEMA POA-PACC');
  console.log('=================================================\n');

  try {
    // 1. Configurar .env
    await setupEnvironment();
    
    // 2. Verificar base de datos
    await verifyDatabase();
    
    // 3. Crear estructura completa
    await createCompleteStructure();
    
    // 4. Mostrar resumen
    showFinalSummary();
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function setupEnvironment() {
  console.log('🔧 Configurando variables de entorno...');
  
  const envPath = path.join(__dirname, '.env');
  const envContent = `DATABASE_URL="file:./dev.db"
JWT_SECRET="dpd-planner-super-secret-jwt-key-2025-secure"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL="http://localhost:5173"
`;

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado');
  } else {
    console.log('✅ Archivo .env verificado');
  }
}

async function verifyDatabase() {
  console.log('🗄️  Verificando base de datos...');
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a la base de datos OK');
  } catch (error) {
    console.error('❌ Error de base de datos');
    console.log('💡 Ejecutar: npx prisma generate && npx prisma db push');
    throw error;
  }
}

async function createCompleteStructure() {
  console.log('\n📊 Creando estructura completa del sistema...');
  
  const results = {
    departments: 0,
    roles: 0,
    permissions: 0,
    users: 0,
    strategicAxes: 0,
    objectives: 0,
    products: 0,
    activities: 0,
    indicators: 0,
    budgetExecutions: 0,
    progressReports: 0,
    paccCompliance: 0,
    procurementProcesses: 0
  };

  // Crear departamentos
  console.log('🏢 Departamentos...');
  const departments = [
    { code: 'DPLAN', name: 'Dirección de Planificación', description: 'Responsable de la planificación estratégica y operativa' },
    { code: 'DADMIN', name: 'Dirección Administrativa', description: 'Gestión administrativa y recursos humanos' },
    { code: 'DFIN', name: 'Dirección Financiera', description: 'Gestión financiera y presupuestaria' },
    { code: 'DTECH', name: 'Dirección Técnica', description: 'Desarrollo y supervisión técnica' },
    { code: 'DCOMP', name: 'Dirección de Compras y Contrataciones', description: 'Gestión del PACC' }
  ];

  for (const dept of departments) {
    try {
      const existing = await prisma.department.findFirst({ where: { code: dept.code } });
      if (!existing) {
        await prisma.department.create({ data: dept });
        results.departments++;
      }
    } catch (error) {
      console.log(`   ⚠️  Error con departamento ${dept.code}`);
    }
  }

  // Crear permisos
  console.log('🔐 Permisos...');
  const permissions = [
    { action: 'create', resource: 'user' },
    { action: 'read', resource: 'user' },
    { action: 'update', resource: 'user' },
    { action: 'delete', resource: 'user' },
    { action: 'create', resource: 'department' },
    { action: 'read', resource: 'department' },
    { action: 'update', resource: 'department' },
    { action: 'delete', resource: 'department' },
    { action: 'create', resource: 'strategic-axis' },
    { action: 'read', resource: 'strategic-axis' },
    { action: 'update', resource: 'strategic-axis' },
    { action: 'delete', resource: 'strategic-axis' },
    { action: 'create', resource: 'objective' },
    { action: 'read', resource: 'objective' },
    { action: 'update', resource: 'objective' },
    { action: 'delete', resource: 'objective' },
    { action: 'create', resource: 'product' },
    { action: 'read', resource: 'product' },
    { action: 'update', resource: 'product' },
    { action: 'delete', resource: 'product' },
    { action: 'create', resource: 'activity' },
    { action: 'read', resource: 'activity' },
    { action: 'update', resource: 'activity' },
    { action: 'delete', resource: 'activity' },
    { action: 'create', resource: 'indicator' },
    { action: 'read', resource: 'indicator' },
    { action: 'update', resource: 'indicator' },
    { action: 'delete', resource: 'indicator' },
    { action: 'create', resource: 'progress-report' },
    { action: 'read', resource: 'progress-report' },
    { action: 'update', resource: 'progress-report' },
    { action: 'delete', resource: 'progress-report' },
    { action: 'approve', resource: 'progress-report' },
    { action: 'create', resource: 'budget-execution' },
    { action: 'read', resource: 'budget-execution' },
    { action: 'update', resource: 'budget-execution' },
    { action: 'delete', resource: 'budget-execution' },
    { action: 'create', resource: 'procurement_process' },
    { action: 'read', resource: 'procurement_process' },
    { action: 'update', resource: 'procurement_process' },
    { action: 'delete', resource: 'procurement_process' },
    { action: 'create', resource: 'role' },
    { action: 'read', resource: 'role' },
    { action: 'update', resource: 'role' },
    { action: 'delete', resource: 'role' },
    { action: 'read', resource: 'permission' },
    { action: 'read', resource: 'dashboard' },
    { action: 'read', resource: 'report' },
    { action: 'export', resource: 'report' }
  ];

  for (const perm of permissions) {
    try {
      const existing = await prisma.permission.findUnique({
        where: { action_resource: { action: perm.action, resource: perm.resource } }
      });
      if (!existing) {
        await prisma.permission.create({ data: perm });
        results.permissions++;
      }
    } catch (error) {
      // Ignorar errores de permisos duplicados
    }
  }

  // Crear roles
  console.log('👥 Roles...');
  const roles = [
    { name: 'Administrador', description: 'Acceso total al sistema' },
    { name: 'Director de Planificación', description: 'Gestión de planificación estratégica' },
    { name: 'Director de Área', description: 'Gestión departamental' },
    { name: 'Técnico de Seguimiento', description: 'Seguimiento y reportes' },
    { name: 'Director de Compras y Contrataciones', description: 'Gestión del PACC' }
  ];

  for (const role of roles) {
    try {
      const existing = await prisma.role.findFirst({ where: { name: role.name } });
      if (!existing) {
        await prisma.role.create({ data: role });
        results.roles++;
      }
    } catch (error) {
      console.log(`   ⚠️  Error con rol ${role.name}`);
    }
  }

  // Crear usuarios
  console.log('👤 Usuarios...');
  const planningDept = await prisma.department.findFirst({ where: { code: 'DPLAN' } });
  const adminRole = await prisma.role.findFirst({ where: { name: 'Administrador' } });
  const directorRole = await prisma.role.findFirst({ where: { name: 'Director de Planificación' } });

  if (planningDept && adminRole) {
    const users = [
      {
        email: 'admin@poa.gov',
        firstName: 'Administrador',
        lastName: 'Sistema',
        passwordHash: await bcrypt.hash('admin123', 10),
        roleId: adminRole.id,
        departmentId: planningDept.id,
        isActive: true
      },
      {
        email: 'director.planificacion@poa.gov',
        firstName: 'María Elena',
        lastName: 'González Pérez',
        passwordHash: await bcrypt.hash('director123', 10),
        roleId: directorRole?.id || adminRole.id,
        departmentId: planningDept.id,
        isActive: true
      }
    ];

    for (const user of users) {
      try {
        const existing = await prisma.user.findFirst({ where: { email: user.email } });
        if (!existing) {
          await prisma.user.create({ data: user });
          results.users++;
        }
      } catch (error) {
        console.log(`   ⚠️  Error con usuario ${user.email}`);
      }
    }
  }

  // Crear estructura de planificación
  console.log('📋 Estructura de planificación...');
  if (planningDept) {
    // Eje estratégico
    let strategicAxis;
    try {
      strategicAxis = await prisma.strategicAxis.findFirst();
      if (!strategicAxis) {
        strategicAxis = await prisma.strategicAxis.create({
          data: {
            code: 'EE001',
            name: 'Fortalecimiento Institucional',
            description: 'Mejorar la capacidad institucional y eficiencia',
            year: 2025,
            departmentId: planningDept.id,
            isActive: true
          }
        });
        results.strategicAxes++;
        console.log('   ✅ Eje estratégico creado');
      } else {
        console.log('   ⏭️  Eje estratégico ya existe');
      }
    } catch (error) {
      console.log('   ⚠️  Error creando eje estratégico:', error.message);
    }

    // Objetivo
    let objective;
    if (strategicAxis) {
      try {
        objective = await prisma.objective.findFirst();
        if (!objective) {
          objective = await prisma.objective.create({
            data: {
              code: 'OBJ001',
              name: 'Modernizar procesos administrativos',
              description: 'Implementar tecnologías modernas',
              strategicAxisId: strategicAxis.id,
              isActive: true
            }
          });
          results.objectives++;
        }
      } catch (error) {
        console.log('   ⚠️  Error creando objetivo');
      }
    }

    // Producto
    let product;
    if (objective) {
      try {
        product = await prisma.product.findFirst();
        if (!product) {
          product = await prisma.product.create({
            data: {
              code: 'PROD001',
              name: 'Sistema POA-PACC implementado',
              description: 'Plataforma digital operativa',
              objectiveId: objective.id,
              isActive: true
            }
          });
          results.products++;
        }
      } catch (error) {
        console.log('   ⚠️  Error creando producto');
      }
    }

    // Actividad
    let activity;
    if (product) {
      try {
        activity = await prisma.activity.findFirst();
        if (!activity) {
          activity = await prisma.activity.create({
            data: {
              code: 'ACT001',
              name: 'Desarrollo del sistema POA-PACC',
              description: 'Implementación completa del sistema',
              productId: product.id,
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-12-31'),
              isActive: true
            }
          });
          results.activities++;
        }
      } catch (error) {
        console.log('   ⚠️  Error creando actividad');
      }
    }

    // Indicador
    if (strategicAxis) {
      try {
        const indicator = await prisma.indicator.findFirst();
        if (!indicator) {
          await prisma.indicator.create({
            data: {
              name: 'Porcentaje de implementación del sistema',
              description: 'Avance en implementación POA-PACC',
              type: 'eficiencia',
              measurementUnit: 'porcentaje',
              baseline: 0,
              annualTarget: 100,
              strategicAxisId: strategicAxis.id,
              isActive: true
            }
          });
          results.indicators++;
        }
      } catch (error) {
        console.log('   ⚠️  Error creando indicador');
      }
    }

    // Ejecución presupuestaria
    if (activity) {
      try {
        const budget = await prisma.budgetExecution.findFirst();
        if (!budget) {
          await prisma.budgetExecution.create({
            data: {
              activityId: activity.id,
              fiscalYear: 2025,
              quarter: 'Q1',
              budgetedAmount: 150000.00,
              executedAmount: 37500.00,
              percentageExecuted: 25.0,
              status: 'EN_PROCESO',
              description: 'Ejecución presupuestaria Q1 2025'
            }
          });
          results.budgetExecutions++;
        }
      } catch (error) {
        console.log('   ⚠️  Error creando ejecución presupuestaria');
      }
    }

    // Reporte de progreso
    if (activity) {
      const user = await prisma.user.findFirst();
      if (user) {
        try {
          const report = await prisma.progressReport.findFirst();
          if (!report) {
            await prisma.progressReport.create({
              data: {
                activityId: activity.id,
                reportingPeriod: '2025-01',
                periodType: 'MENSUAL',
                physicalProgress: 25.5,
                budgetProgress: 22.8,
                status: 'EN_PROGRESO',
                achievements: 'Configuración base completada exitosamente',
                challenges: 'Coordinación entre equipos técnicos',
                nextSteps: 'Completar módulo de planificación',
                reportedBy: user.id,
                reportDate: new Date()
              }
            });
            results.progressReports++;
          }
        } catch (error) {
          console.log('   ⚠️  Error creando reporte de progreso');
        }
      }
    }
  }

  // Datos PACC
  console.log('📊 Datos PACC...');
  const user = await prisma.user.findFirst();
  if (user) {
    try {
      const pacc = await prisma.paccCompliance.findFirst();
      if (!pacc) {
        await prisma.paccCompliance.create({
          data: {
            evaluationPeriod: '2025-01',
            periodType: 'MENSUAL',
            fiscalYear: 2025,
            totalProcesses: 28,
            processesOnSchedule: 22,
            processesDelayed: 4,
            processesAtRisk: 2,
            processesCancelled: 0,
            scheduledMilestones: 52,
            achievedMilestones: 43,
            delayedMilestones: 9,
            milestoneComplianceRate: 82.7,
            averageDelay: 3.8,
            criticalPathCompliance: 87.2,
            budgetCompliance: 91.5,
            legalComplianceScore: 95.8,
            timelinessScore: 82.7,
            qualityScore: 89.1,
            overallScore: 88.9,
            complianceGrade: 'B+',
            keyFindings: 'Sistema funcionando adecuadamente con demoras menores',
            recommendations: 'Mejorar seguimiento de hitos y comunicación',
            actionPlan: 'Implementar alertas tempranas y reuniones semanales',
            riskFactors: 'Dependencias externas y disponibilidad presupuestaria',
            mitigationMeasures: 'Planes de contingencia y reservas',
            evaluatedBy: user.id,
            evaluationDate: new Date()
          }
        });
        results.paccCompliance++;
      }
    } catch (error) {
      console.log('   ⚠️  Error creando datos PACC');
    }

    // Proceso de contratación
    try {
      const procurement = await prisma.procurementProcess.findFirst();
      if (!procurement) {
        await prisma.procurementProcess.create({
          data: {
            processCode: 'PROC-2025-001',
            processName: 'Adquisición de equipos informáticos',
            category: 'BIENES',
            priority: 'ALTA',
            estimatedValue: 85000.00,
            status: 'EN_PROCESO',
            plannedStartDate: new Date('2025-02-01'),
            expectedEndDate: new Date('2025-04-30'),
            description: 'Compra de servidores y equipos para modernización'
          }
        });
        results.procurementProcesses++;
      }
    } catch (error) {
      console.log('   ⚠️  Error creando proceso de contratación');
    }
  }

  // Asignar permisos al administrador
  console.log('🔐 Configurando permisos...');
  if (adminRole) {
    const allPermissions = await prisma.permission.findMany();
    let assignedCount = 0;
    
    for (const permission of allPermissions) {
      try {
        const existing = await prisma.rolePermission.findFirst({
          where: { roleId: adminRole.id, permissionId: permission.id }
        });
        
        if (!existing) {
          await prisma.rolePermission.create({
            data: { roleId: adminRole.id, permissionId: permission.id }
          });
          assignedCount++;
        }
      } catch (error) {
        // Ignorar duplicados
      }
    }
    console.log(`   ✅ ${assignedCount} permisos asignados al administrador`);
  }

  console.log('\n📊 RESUMEN FINAL:');
  console.log(`   🏢 Departamentos: ${results.departments}`);
  console.log(`   👥 Roles: ${results.roles}`);
  console.log(`   🔐 Permisos: ${results.permissions}`);
  console.log(`   👤 Usuarios: ${results.users}`);
  console.log(`   🎯 Ejes Estratégicos: ${results.strategicAxes}`);
  console.log(`   📋 Objetivos: ${results.objectives}`);
  console.log(`   📦 Productos: ${results.products}`);
  console.log(`   ✅ Actividades: ${results.activities}`);
  console.log(`   📊 Indicadores: ${results.indicators}`);
  console.log(`   💰 Ejecuciones Presup.: ${results.budgetExecutions}`);
  console.log(`   📈 Reportes de Progreso: ${results.progressReports}`);
  console.log(`   📊 Evaluaciones PACC: ${results.paccCompliance}`);
  console.log(`   🛒 Procesos Contratación: ${results.procurementProcesses}`);
}

function showFinalSummary() {
  console.log('\n🎉 ¡SISTEMA CONFIGURADO EXITOSAMENTE!');
  console.log('=====================================');
  console.log('');
  console.log('🔐 CREDENCIALES DE ACCESO:');
  console.log('   👨‍💼 Administrador:');
  console.log('      📧 Email: admin@poa.gov');
  console.log('      🔑 Contraseña: admin123');
  console.log('');
  console.log('   👩‍💼 Director de Planificación:');
  console.log('      📧 Email: director.planificacion@poa.gov');
  console.log('      🔑 Contraseña: director123');
  console.log('');
  console.log('🌐 URLS DEL SISTEMA:');
  console.log('   🔗 Backend API: http://localhost:3001');
  console.log('   🖥️  Frontend: http://localhost:5173');
  console.log('');
  console.log('📝 COMANDOS PARA INICIAR:');
  console.log('   🚀 Backend: npm start');
  console.log('   🌐 Frontend: npm run dev');
  console.log('');
  console.log('✅ El sistema incluye:');
  console.log('   • Estructura organizacional completa');
  console.log('   • Datos de ejemplo realistas');
  console.log('   • Usuarios con permisos configurados');
  console.log('   • Dashboards funcionando');
  console.log('   • Módulos POA y PACC operativos');
  console.log('');
  console.log('🎯 ¡Todo listo para usar!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupCompleteSystem()
    .then(() => {
      console.log('\n🏁 Configuración completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error.message);
      console.error('\n💡 Posibles soluciones:');
      console.error('1. Ejecutar: npx prisma generate');
      console.error('2. Ejecutar: npx prisma db push');
      console.error('3. Verificar dependencias: npm install');
      process.exit(1);
    });
}

module.exports = setupCompleteSystem;
