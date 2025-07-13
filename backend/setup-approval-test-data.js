const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCompleteTestStructure() {
  console.log('🏗️ Creando estructura completa para pruebas del sistema de aprobaciones...\n');

  try {
    // 1. Verificar que tenemos usuarios
    const users = await prisma.user.findMany();
    console.log(`👥 Usuarios encontrados: ${users.length}`);

    if (users.length === 0) {
      console.log('❌ No hay usuarios. Ejecuta setup-basic-structure.js primero');
      return;
    }

    // 2. Crear ejes estratégicos
    console.log('\n🎯 Creando ejes estratégicos...');
    const strategicAxis = await prisma.strategicAxis.upsert({
      where: { code_year: { code: 'EJE-001', year: 2025 } },
      update: {},
      create: {
        code: 'EJE-001',
        name: 'Desarrollo Institucional',
        description: 'Fortalecimiento de capacidades institucionales',
        year: 2025
      }
    });
    console.log(`✅ Eje estratégico creado: ${strategicAxis.name}`);

    // 3. Crear objetivos
    console.log('\n🎯 Creando objetivos...');
    const objective = await prisma.objective.upsert({
      where: { strategicAxisId_code: { strategicAxisId: strategicAxis.id, code: 'OBJ-001' } },
      update: {},
      create: {
        code: 'OBJ-001',
        name: 'Mejorar la gestión administrativa',
        description: 'Optimizar procesos administrativos para mayor eficiencia',
        strategicAxisId: strategicAxis.id
      }
    });
    console.log(`✅ Objetivo creado: ${objective.name}`);

    // 4. Crear productos
    console.log('\n📦 Creando productos...');
    const product = await prisma.product.upsert({
      where: { objectiveId_code: { objectiveId: objective.id, code: 'PROD-001' } },
      update: {},
      create: {
        code: 'PROD-001',
        name: 'Sistema de gestión implementado',
        description: 'Implementación y puesta en marcha del sistema de gestión',
        objectiveId: objective.id
      }
    });
    console.log(`✅ Producto creado: ${product.name}`);

    // 5. Crear actividades
    console.log('\n🚀 Creando actividades...');
    const activities = [
      {
        code: 'ACT-001',
        name: 'Análisis de requerimientos del sistema',
        description: 'Realizar análisis detallado de los requerimientos funcionales',
        productId: product.id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31')
      },
      {
        code: 'ACT-002',
        name: 'Desarrollo del sistema',
        description: 'Programación y desarrollo de los módulos del sistema',
        productId: product.id,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-09-30')
      },
      {
        code: 'ACT-003',
        name: 'Pruebas y validación',
        description: 'Ejecución de pruebas unitarias e integrales del sistema',
        productId: product.id,
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-11-30')
      }
    ];

    const createdActivities = [];
    for (const actData of activities) {
      const activity = await prisma.activity.upsert({
        where: { productId_code: { productId: product.id, code: actData.code } },
        update: {},
        create: actData
      });
      createdActivities.push(activity);
      console.log(`✅ Actividad creada: ${activity.name}`);
    }

    // 6. Crear indicadores para las actividades
    console.log('\n📊 Creando indicadores...');
    for (let i = 0; i < createdActivities.length; i++) {
      const activity = createdActivities[i];
      
      // Verificar si ya existe un indicador para esta actividad
      const existingIndicator = await prisma.indicator.findFirst({
        where: { activityId: activity.id }
      });
      
      if (!existingIndicator) {
        const indicator = await prisma.indicator.create({
          data: {
            name: `Porcentaje de avance - ${activity.name}`,
            description: `Indicador de progreso para ${activity.name}`,
            type: 'PRODUCT',
            measurementUnit: 'PERCENTAGE',
            annualTarget: 100,
            activityId: activity.id
          }
        });
        console.log(`✅ Indicador creado: ${indicator.name}`);
      } else {
        console.log(`ℹ️ Indicador ya existe para actividad: ${activity.name}`);
      }
    }

    // 7. Crear algunos reportes de progreso de ejemplo
    console.log('\n📄 Creando reportes de progreso de ejemplo...');
    
    const reportsData = [
      {
        activityId: createdActivities[0].id,
        reportedById: users[0].id,
        periodType: 'trimestral',
        period: '2025-Q1',
        currentValue: 25,
        targetValue: 100,
        executionPercentage: 25,
        qualitativeComments: 'Avance del primer trimestre según cronograma',
        challenges: 'Ninguna dificultad significativa',
        nextSteps: 'Continuar con la siguiente fase del análisis',
        status: 'DRAFT'
      },
      {
        activityId: createdActivities[1].id,
        reportedById: users[1].id,
        periodType: 'trimestral',
        period: '2025-Q2',
        currentValue: 40,
        targetValue: 100,
        executionPercentage: 40,
        qualitativeComments: 'Desarrollo progresando adecuadamente',
        challenges: 'Algunos retrasos menores en la integración',
        nextSteps: 'Acelerar el desarrollo de módulos críticos',
        status: 'SUBMITTED'
      },
      {
        activityId: createdActivities[2].id,
        reportedById: users[2].id,
        periodType: 'mensual',
        period: '2025-10',
        currentValue: 15,
        targetValue: 100,
        executionPercentage: 15,
        qualitativeComments: 'Iniciando fase de pruebas',
        challenges: 'Dependencia de finalización del desarrollo',
        nextSteps: 'Preparar casos de prueba detallados',
        status: 'APPROVED'
      }
    ];

    for (let i = 0; i < reportsData.length; i++) {
      const reportData = reportsData[i];
      const report = await prisma.progressReport.create({
        data: reportData
      });
      console.log(`✅ Reporte ${i + 1} creado - Estado: ${report.status}`);

      // Si el reporte está aprobado, crear historial
      if (report.status === 'APPROVED') {
        await prisma.reportApprovalHistory.create({
          data: {
            progressReportId: report.id,
            action: 'APPROVED',
            actionById: users[0].id, // Admin aprueba
            comments: 'Reporte aprobado automáticamente durante setup'
          }
        });
        console.log(`✅ Historial de aprobación creado para reporte ${i + 1}`);
      }
    }

    console.log('\n🎉 Estructura completa creada exitosamente!');
    console.log('\n📊 Resumen de la estructura creada:');
    console.log(`   🎯 Ejes estratégicos: 1`);
    console.log(`   🎯 Objetivos: 1`);
    console.log(`   📦 Productos: 1`);
    console.log(`   🚀 Actividades: ${createdActivities.length}`);
    console.log(`   📊 Indicadores: ${createdActivities.length}`);
    console.log(`   📄 Reportes de progreso: ${reportsData.length}`);
    console.log('\n✅ El sistema está listo para probar las funcionalidades de aprobación!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteTestStructure();
