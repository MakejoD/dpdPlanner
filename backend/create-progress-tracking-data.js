const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createProgressTrackingData() {
  try {
    console.log('🎯 Creando datos de ejemplo para Módulo de Seguimiento y Avances...\n');

    // 1. Crear Eje Estratégico
    console.log('📊 Creando Eje Estratégico...');
    const strategicAxis = await prisma.strategicAxis.create({
      data: {
        name: 'Modernización y Eficiencia Institucional',
        description: 'Eje estratégico enfocado en la modernización de procesos y mejora de la eficiencia institucional',
        code: 'MEI-2024',
        year: 2024,
        departmentId: (await prisma.department.findFirst()).id
      }
    });

    // 2. Crear Objetivo
    console.log('🎯 Creando Objetivos...');
    const objective = await prisma.objective.create({
      data: {
        name: 'Implementar sistema de gestión digital',
        description: 'Desarrollar e implementar un sistema integral de gestión digital para mejorar los procesos administrativos',
        code: 'OBJ-001',
        strategicAxisId: strategicAxis.id
      }
    });

    // 3. Crear Producto
    console.log('📦 Creando Productos...');
    const product = await prisma.product.create({
      data: {
        name: 'Sistema POA implementado',
        description: 'Sistema de Planificación Operativa Anual completamente implementado y operativo',
        code: 'PROD-001',
        type: 'PRODUCT',
        objectiveId: objective.id
      }
    });

    // 4. Crear Actividades
    console.log('⚡ Creando Actividades...');
    const activities = await Promise.all([
      prisma.activity.create({
        data: {
          name: 'Desarrollo del módulo de planificación',
          description: 'Desarrollar el módulo de planificación estratégica del sistema POA',
          code: 'ACT-001',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          productId: product.id
        }
      }),
      prisma.activity.create({
        data: {
          name: 'Implementación del módulo de seguimiento',
          description: 'Implementar el módulo de seguimiento y avances del sistema POA',
          code: 'ACT-002',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-04-30'),
          productId: product.id
        }
      }),
      prisma.activity.create({
        data: {
          name: 'Capacitación a usuarios finales',
          description: 'Capacitar al personal en el uso del sistema POA',
          code: 'ACT-003',
          startDate: new Date('2024-04-01'),
          endDate: new Date('2024-05-31'),
          productId: product.id
        }
      })
    ]);

    // 5. Crear Indicadores
    console.log('📈 Creando Indicadores...');
    const indicators = await Promise.all([
      // Indicadores de actividades
      prisma.indicator.create({
        data: {
          name: 'Porcentaje de módulos desarrollados',
          description: 'Porcentaje de avance en el desarrollo de módulos del sistema',
          type: 'PRODUCT',
          measurementUnit: 'Porcentaje',
          baseline: 0,
          annualTarget: 100,
          q1Target: 25,
          q2Target: 50,
          q3Target: 75,
          q4Target: 100,
          activityId: activities[0].id
        }
      }),
      prisma.indicator.create({
        data: {
          name: 'Funcionalidades implementadas',
          description: 'Número de funcionalidades implementadas en el módulo de seguimiento',
          type: 'PRODUCT',
          measurementUnit: 'Número',
          baseline: 0,
          annualTarget: 12,
          q1Target: 3,
          q2Target: 6,
          q3Target: 9,
          q4Target: 12,
          activityId: activities[1].id
        }
      }),
      prisma.indicator.create({
        data: {
          name: 'Usuarios capacitados',
          description: 'Número de usuarios capacitados en el sistema POA',
          type: 'RESULT',
          measurementUnit: 'Número',
          baseline: 0,
          annualTarget: 50,
          q1Target: 0,
          q2Target: 25,
          q3Target: 40,
          q4Target: 50,
          activityId: activities[2].id
        }
      }),
      // Indicador independiente
      prisma.indicator.create({
        data: {
          name: 'Índice de satisfacción del usuario',
          description: 'Índice de satisfacción de los usuarios con el sistema POA',
          type: 'RESULT',
          measurementUnit: 'Escala 1-10',
          baseline: 5,
          annualTarget: 8.5,
          q1Target: 6,
          q2Target: 7,
          q3Target: 8,
          q4Target: 8.5,
          objectiveId: objective.id
        }
      })
    ]);

    // 6. Obtener usuarios técnicos para asignaciones
    console.log('👥 Obteniendo usuarios para asignaciones...');
    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });

    const technicalUsers = users.filter(user => 
      user.role.name === 'Técnico Registrador' || 
      user.role.name === 'Director de Área'
    );

    if (technicalUsers.length === 0) {
      console.log('⚠️  No hay usuarios técnicos, creando usuarios de ejemplo...');
      
      // Crear roles si no existen
      const techRole = await prisma.role.upsert({
        where: { name: 'Técnico Registrador' },
        update: {},
        create: {
          name: 'Técnico Registrador',
          description: 'Registra avances de actividades asignadas',
          rolePermissions: {
            create: [
              {
                permission: {
                  connect: {
                    id: (await prisma.permission.findFirst({ where: { action: 'create', resource: 'progress_report' } })).id
                  }
                }
              },
              {
                permission: {
                  connect: {
                    id: (await prisma.permission.findFirst({ where: { action: 'read', resource: 'progress_report' } })).id
                  }
                }
              },
              {
                permission: {
                  connect: {
                    id: (await prisma.permission.findFirst({ where: { action: 'update', resource: 'progress_report' } })).id
                  }
                }
              }
            ]
          }
        }
      });

      // Crear usuarios técnicos
      const techUsers = await Promise.all([
        prisma.user.create({
          data: {
            email: 'juan.perez@poa.gov',
            firstName: 'Juan',
            lastName: 'Pérez García',
            passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            roleId: techRole.id,
            departmentId: (await prisma.department.findFirst()).id
          }
        }),
        prisma.user.create({
          data: {
            email: 'maria.lopez@poa.gov',
            firstName: 'María',
            lastName: 'López Silva',
            passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
            roleId: techRole.id,
            departmentId: (await prisma.department.findFirst()).id
          }
        })
      ]);

      technicalUsers.push(...techUsers);
    }

    // 7. Crear asignaciones de actividades
    console.log('🔗 Creando asignaciones de actividades...');
    await Promise.all([
      prisma.activityAssignment.create({
        data: {
          userId: technicalUsers[0].id,
          activityId: activities[0].id,
          isMain: true,
          departmentId: technicalUsers[0].departmentId
        }
      }),
      prisma.activityAssignment.create({
        data: {
          userId: technicalUsers[1] ? technicalUsers[1].id : technicalUsers[0].id,
          activityId: activities[1].id,
          isMain: true,
          departmentId: technicalUsers[1] ? technicalUsers[1].departmentId : technicalUsers[0].departmentId
        }
      }),
      prisma.activityAssignment.create({
        data: {
          userId: technicalUsers[0].id,
          activityId: activities[2].id,
          isMain: true,
          departmentId: technicalUsers[0].departmentId
        }
      })
    ]);

    // 8. Crear asignaciones de indicadores
    console.log('📊 Creando asignaciones de indicadores...');
    await Promise.all([
      prisma.indicatorAssignment.create({
        data: {
          userId: technicalUsers[0].id,
          indicatorId: indicators[3].id, // Indicador independiente
          isMain: true,
          departmentId: technicalUsers[0].departmentId
        }
      })
    ]);

    // 9. Crear algunos reportes de progreso de ejemplo
    console.log('📝 Creando reportes de progreso de ejemplo...');
    await Promise.all([
      prisma.progressReport.create({
        data: {
          activityId: activities[0].id,
          reportedById: technicalUsers[0].id,
          periodType: 'trimestral',
          period: '2024-Q1',
          currentValue: 25,
          targetValue: 25,
          executionPercentage: 100,
          qualitativeComments: 'Se completó el diseño de la base de datos y se iniciaron los módulos básicos.',
          challenges: 'Algunas demoras en la definición de requerimientos.',
          nextSteps: 'Continuar con el desarrollo de los módulos restantes.',
          status: 'aprobado'
        }
      }),
      prisma.progressReport.create({
        data: {
          activityId: activities[1].id,
          reportedById: technicalUsers[1] ? technicalUsers[1].id : technicalUsers[0].id,
          periodType: 'trimestral',
          period: '2024-Q1',
          currentValue: 3,
          targetValue: 3,
          executionPercentage: 100,
          qualitativeComments: 'Se implementaron las funcionalidades básicas de seguimiento.',
          challenges: 'Integración con el módulo de planificación requirió más tiempo.',
          nextSteps: 'Implementar funcionalidades avanzadas de reportes.',
          status: 'pendiente'
        }
      }),
      prisma.progressReport.create({
        data: {
          indicatorId: indicators[3].id,
          reportedById: technicalUsers[0].id,
          periodType: 'trimestral',
          period: '2024-Q1',
          currentValue: 6.5,
          targetValue: 6,
          executionPercentage: 108.33,
          qualitativeComments: 'Los usuarios muestran satisfacción con las funcionalidades implementadas.',
          challenges: 'Necesidad de más capacitación en funciones avanzadas.',
          nextSteps: 'Programar sesiones adicionales de capacitación.',
          status: 'aprobado'
        }
      })
    ]);

    console.log('\n✅ Datos de ejemplo creados exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log(`- 1 Eje Estratégico: ${strategicAxis.name}`);
    console.log(`- 1 Objetivo: ${objective.name}`);
    console.log(`- 1 Producto: ${product.name}`);
    console.log(`- ${activities.length} Actividades`);
    console.log(`- ${indicators.length} Indicadores`);
    console.log(`- ${technicalUsers.length} Usuarios técnicos asignados`);
    console.log('- 3 Reportes de progreso de ejemplo');
    
    console.log('\n👥 Usuarios para pruebas:');
    console.log('- admin@poa.gov (Administrador) - password: admin123');
    technicalUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role?.name || 'Técnico'}) - password: password`);
    });

  } catch (error) {
    console.error('❌ Error creando datos de ejemplo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createProgressTrackingData()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createProgressTrackingData };
