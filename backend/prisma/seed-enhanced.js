const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed mejorado de la base de datos...');

  try {
    // 1. Crear permisos del sistema
    console.log('📋 Creando permisos del sistema...');
    
    const permissions = [
      // Permisos básicos
      { action: 'create', resource: 'user' },
      { action: 'read', resource: 'user' },
      { action: 'update', resource: 'user' },
      { action: 'delete', resource: 'user' },
      { action: 'create', resource: 'role' },
      { action: 'read', resource: 'role' },
      { action: 'update', resource: 'role' },
      { action: 'delete', resource: 'role' },
      { action: 'create', resource: 'department' },
      { action: 'read', resource: 'department' },
      { action: 'update', resource: 'department' },
      { action: 'delete', resource: 'department' },
      
      // Permisos POA
      { action: 'create', resource: 'strategic_axis' },
      { action: 'read', resource: 'strategic_axis' },
      { action: 'update', resource: 'strategic_axis' },
      { action: 'delete', resource: 'strategic_axis' },
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
      { action: 'create', resource: 'progress_report' },
      { action: 'read', resource: 'progress_report' },
      { action: 'update', resource: 'progress_report' },
      { action: 'delete', resource: 'progress_report' },
      { action: 'approve', resource: 'progress_report' },
      { action: 'reject', resource: 'progress_report' },
      
      // Permisos PACC
      { action: 'create', resource: 'procurement' },
      { action: 'read', resource: 'procurement' },
      { action: 'update', resource: 'procurement' },
      { action: 'delete', resource: 'procurement' },
      
      // Permisos Budget
      { action: 'create', resource: 'budget' },
      { action: 'read', resource: 'budget' },
      { action: 'update', resource: 'budget' },
      { action: 'delete', resource: 'budget' },
      
      // Permisos Correlation
      { action: 'read', resource: 'correlation' },
      { action: 'update', resource: 'correlation' },
      { action: 'generate', resource: 'reports' }
    ];

    const createdPermissions = [];
    for (const permission of permissions) {
      try {
        const existingPermission = await prisma.permission.findFirst({
          where: {
            action: permission.action,
            resource: permission.resource
          }
        });

        if (!existingPermission) {
          const created = await prisma.permission.create({
            data: permission
          });
          createdPermissions.push(created);
        } else {
          createdPermissions.push(existingPermission);
        }
      } catch (error) {
        console.log(`Permiso ${permission.action}-${permission.resource} ya existe`);
      }
    }

    console.log(`✅ ${createdPermissions.length} permisos procesados`);

    // 2. Crear roles del sistema
    console.log('👥 Creando roles del sistema...');
    
    const roles = [
      {
        name: 'ADMIN',
        description: 'Administrador del sistema con acceso completo'
      },
      {
        name: 'PLANIFICADOR',
        description: 'Planificador estratégico con acceso a POA, PACC y presupuesto'
      },
      {
        name: 'DIRECTOR_AREA',
        description: 'Director de área con permisos de aprobación'
      },
      {
        name: 'TECNICO',
        description: 'Técnico registrador de reportes'
      }
    ];

    const createdRoles = [];
    for (const role of roles) {
      try {
        const existing = await prisma.role.findUnique({
          where: { name: role.name }
        });

        if (!existing) {
          const created = await prisma.role.create({
            data: role
          });
          createdRoles.push(created);
        } else {
          createdRoles.push(existing);
        }
      } catch (error) {
        console.log(`Rol ${role.name} ya existe`);
      }
    }

    console.log(`✅ ${createdRoles.length} roles procesados`);

    // 3. Asignar permisos a roles
    console.log('🔐 Asignando permisos a roles...');
    
    const adminRole = createdRoles.find(r => r.name === 'ADMIN');
    const planificadorRole = createdRoles.find(r => r.name === 'PLANIFICADOR');
    const directorRole = createdRoles.find(r => r.name === 'DIRECTOR_AREA');
    const tecnicoRole = createdRoles.find(r => r.name === 'TECNICO');

    // Admin: todos los permisos
    if (adminRole) {
      for (const permission of createdPermissions) {
        try {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          });
        } catch (error) {
          // Permiso ya asignado
        }
      }
    }

    // Planificador: permisos de gestión POA, PACC y presupuesto
    if (planificadorRole) {
      const planificadorPermissions = createdPermissions.filter(p => 
        !['delete'].includes(p.action) || ['user', 'role', 'department'].includes(p.resource)
      );
      
      for (const permission of planificadorPermissions) {
        try {
          await prisma.rolePermission.create({
            data: {
              roleId: planificadorRole.id,
              permissionId: permission.id
            }
          });
        } catch (error) {
          // Permiso ya asignado
        }
      }
    }

    // Director: permisos de lectura y aprobación
    if (directorRole) {
      const directorPermissions = createdPermissions.filter(p => 
        p.action === 'read' || 
        (p.action === 'approve' && p.resource === 'progress_report') ||
        (p.action === 'reject' && p.resource === 'progress_report')
      );
      
      for (const permission of directorPermissions) {
        try {
          await prisma.rolePermission.create({
            data: {
              roleId: directorRole.id,
              permissionId: permission.id
            }
          });
        } catch (error) {
          // Permiso ya asignado
        }
      }
    }

    // Técnico: permisos básicos de reportes
    if (tecnicoRole) {
      const tecnicoPermissions = createdPermissions.filter(p => 
        (p.action === 'read' && ['activity', 'indicator', 'progress_report'].includes(p.resource)) ||
        (['create', 'update'].includes(p.action) && p.resource === 'progress_report')
      );
      
      for (const permission of tecnicoPermissions) {
        try {
          await prisma.rolePermission.create({
            data: {
              roleId: tecnicoRole.id,
              permissionId: permission.id
            }
          });
        } catch (error) {
          // Permiso ya asignado
        }
      }
    }

    // 4. Crear departamentos
    console.log('🏢 Creando departamentos...');
    
    const departments = [
      { name: 'Dirección General', code: 'DG', isActive: true },
      { name: 'Planificación y Desarrollo', code: 'PYD', isActive: true },
      { name: 'Administración y Finanzas', code: 'AF', isActive: true },
      { name: 'Tecnología', code: 'TEC', isActive: true },
      { name: 'Recursos Humanos', code: 'RH', isActive: true }
    ];

    const createdDepartments = [];
    for (const dept of departments) {
      try {
        const existing = await prisma.department.findUnique({
          where: { code: dept.code }
        });

        if (!existing) {
          const created = await prisma.department.create({
            data: dept
          });
          createdDepartments.push(created);
        } else {
          createdDepartments.push(existing);
        }
      } catch (error) {
        console.log(`Departamento ${dept.code} ya existe`);
      }
    }

    console.log(`✅ ${createdDepartments.length} departamentos procesados`);

    // 5. Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    try {
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@dpdplanner.com',
          firstName: 'Administrador',
          lastName: 'Sistema',
          passwordHash: hashedPassword,
          roleId: adminRole.id,
          departmentId: createdDepartments.find(d => d.code === 'DG')?.id,
          isActive: true
        }
      });
      console.log(`✅ Usuario administrador creado: ${adminUser.email}`);
    } catch (error) {
      console.log('Usuario administrador ya existe');
    }

    // 6. Crear datos de ejemplo para POA
    console.log('📊 Creando estructura POA de ejemplo...');
    
    try {
      // Eje Estratégico
      const strategicAxis = await prisma.strategicAxis.create({
        data: {
          name: 'Modernización Institucional',
          description: 'Fortalecimiento de la capacidad institucional mediante la modernización de procesos y tecnología',
          code: 'EE001',
          order: 1
        }
      });

      // Objetivo
      const objective = await prisma.objective.create({
        data: {
          name: 'Implementar sistemas digitales integrados',
          description: 'Desarrollar e implementar sistemas tecnológicos que mejoren la eficiencia operacional',
          code: 'OBJ001',
          order: 1,
          strategicAxisId: strategicAxis.id
        }
      });

      // Producto
      const product = await prisma.product.create({
        data: {
          name: 'Sistema de Planificación Digital',
          description: 'Sistema web para gestión del Plan Operativo Anual',
          code: 'PROD001',
          type: 'PRODUCT',
          order: 1,
          objectiveId: objective.id
        }
      });

      // Actividades
      const activities = await Promise.all([
        prisma.activity.create({
          data: {
            name: 'Desarrollo del sistema POA',
            description: 'Programación y desarrollo de la plataforma web',
            code: 'ACT001',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-06-30'),
            order: 1,
            productId: product.id
          }
        }),
        prisma.activity.create({
          data: {
            name: 'Capacitación de usuarios',
            description: 'Entrenamientos para uso del sistema',
            code: 'ACT002',
            startDate: new Date('2025-07-01'),
            endDate: new Date('2025-09-30'),
            order: 2,
            productId: product.id
          }
        })
      ]);

      console.log(`✅ Estructura POA creada con ${activities.length} actividades`);

      // 7. Crear datos de ejemplo para PACC
      console.log('🛒 Creando procesos PACC de ejemplo...');
      
      const procurements = await Promise.all([
        prisma.procurementProcess.create({
          data: {
            description: 'Adquisición de servidores para el sistema POA',
            procurementType: 'BIENES',
            procurementMethod: 'LICITACION_PUBLICA',
            estimatedAmount: 2500000,
            currency: 'DOP',
            plannedStartDate: new Date('2025-02-01'),
            plannedEndDate: new Date('2025-04-30'),
            quarter: 'Q1',
            month: 'Febrero',
            status: 'PLANIFICADO',
            priority: 'ALTA',
            budgetCode: 'P511-001',
            isRecurrent: false,
            legalFramework: 'LEY_340_06',
            activityId: activities[0].id
          }
        }),
        prisma.procurementProcess.create({
          data: {
            description: 'Contratación de servicios de capacitación',
            procurementType: 'SERVICIOS',
            procurementMethod: 'COMPARACION_PRECIOS',
            estimatedAmount: 850000,
            currency: 'DOP',
            plannedStartDate: new Date('2025-06-15'),
            plannedEndDate: new Date('2025-08-15'),
            quarter: 'Q3',
            month: 'Junio',
            status: 'PLANIFICADO',
            priority: 'MEDIA',
            budgetCode: 'P422-002',
            isRecurrent: false,
            legalFramework: 'LEY_340_06',
            activityId: activities[1].id
          }
        })
      ]);

      console.log(`✅ ${procurements.length} procesos PACC creados`);

      // 8. Crear asignaciones presupuestarias
      console.log('💰 Creando asignaciones presupuestarias...');
      
      const budgetAllocations = await Promise.all([
        prisma.budgetAllocation.create({
          data: {
            budgetCode: 'P511-001',
            budgetType: 'INVERSION',
            fiscalYear: 2025,
            allocatedAmount: 5000000,
            executedAmount: 0,
            availableAmount: 5000000,
            quarter: 'Q1',
            source: 'RECURSOS_INTERNOS',
            category: '500',
            sigefCode: 'SIGEF-2025-001',
            activityId: activities[0].id,
            procurementProcessId: procurements[0].id
          }
        }),
        prisma.budgetAllocation.create({
          data: {
            budgetCode: 'P422-002',
            budgetType: 'FUNCIONAMIENTO',
            fiscalYear: 2025,
            allocatedAmount: 2000000,
            executedAmount: 0,
            availableAmount: 2000000,
            quarter: 'Q3',
            source: 'RECURSOS_INTERNOS',
            category: '200',
            sigefCode: 'SIGEF-2025-002',
            activityId: activities[1].id,
            procurementProcessId: procurements[1].id
          }
        })
      ]);

      console.log(`✅ ${budgetAllocations.length} asignaciones presupuestarias creadas`);

      // 9. Crear correlaciones POA-PACC-Budget
      console.log('🔗 Creando correlaciones POA-PACC-Budget...');
      
      for (const activity of activities) {
        await prisma.poaPaccBudgetCorrelation.create({
          data: {
            activityId: activity.id,
            hasProcurementNeeds: true,
            procurementCompliance: 0,
            hasBudgetAllocation: true,
            budgetCompliance: 0,
            overallCompliance: 0,
            riskLevel: 'BAJO',
            complianceStatus: 'EN_CUMPLIMIENTO',
            observations: 'Correlación inicial establecida',
            recommendations: 'Seguimiento regular del progreso'
          }
        });
      }

      console.log(`✅ Correlaciones creadas para ${activities.length} actividades`);

    } catch (error) {
      console.log('Algunos datos de ejemplo ya existen:', error.message);
    }

    console.log('✨ Seed completado exitosamente!');
    console.log('📧 Usuario admin: admin@dpdplanner.com');
    console.log('🔑 Contraseña: admin123');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
