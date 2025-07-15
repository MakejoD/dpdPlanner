const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createProgressReportsExamples() {
  try {
    console.log('🔄 Creando informes de progreso de ejemplo...');

    // Verificar si ya existen informes
    const existingReports = await prisma.progressReport.count();
    console.log(`📊 Informes existentes: ${existingReports}`);

    if (existingReports > 0) {
      console.log('⚠️ Ya existen informes de progreso. Eliminando para recrear...');
      await prisma.progressReport.deleteMany({});
    }

    // Obtener actividades con indicadores
    const activitiesWithIndicators = await prisma.activity.findMany({
      include: {
        indicators: true,
        product: true,
        assignments: {
          include: {
            user: true
          }
        }
      },
      where: {
        indicators: {
          some: {}
        },
        assignments: {
          some: {}
        }
      }
    });

    console.log(`📋 Actividades con indicadores encontradas: ${activitiesWithIndicators.length}`);

    // Obtener usuarios para asignar como reportadores
    const users = await prisma.user.findMany({
      where: {
        isActive: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios activos para crear informes');
      return;
    }

    console.log(`👥 Usuarios disponibles: ${users.length}`);

    const progressReports = [];

    // Crear informes para cada actividad con indicadores
    for (const activity of activitiesWithIndicators) {
      const assignedUser = activity.assignments[0]?.user || users[0];
      const primaryIndicator = activity.indicators[0];

      if (!primaryIndicator) continue;

      // Crear informes para los últimos 3 trimestres
      const quarters = ['T1', 'T2', 'T3'];
      const quarterTargets = [
        primaryIndicator.q1Target || 25,
        primaryIndicator.q2Target || 50, 
        primaryIndicator.q3Target || 75
      ];

      for (let i = 0; i < quarters.length; i++) {
        const quarter = quarters[i];
        const target = quarterTargets[i];
        const currentValue = Math.floor(target * (0.7 + Math.random() * 0.4)); // 70-110% del target
        const executionPercentage = (currentValue / target) * 100;

        const reportData = {
          activityId: activity.id,
          periodType: 'trimestral',
          period: quarter,
          currentValue: currentValue,
          targetValue: target,
          executionPercentage: Math.round(executionPercentage * 100) / 100,
          qualitativeComments: `Avances del ${quarter}: Se han ejecutado las actividades planificadas para ${activity.name}. Los resultados muestran un progreso ${executionPercentage >= 100 ? 'excelente' : executionPercentage >= 80 ? 'bueno' : 'moderado'} en el cumplimiento de las metas.`,
          challenges: executionPercentage < 80 ? 'Se identificaron algunos retrasos en la implementación debido a factores externos. Se están tomando medidas correctivas.' : 'No se presentaron desafíos significativos durante el período.',
          nextSteps: `Para el próximo período se planifica continuar con la ejecución de ${activity.name} y mejorar los indicadores de rendimiento.`,
          status: i < 2 ? 'APPROVED' : 'SUBMITTED', // Los primeros dos aprobados, el último pendiente
          reportedById: assignedUser.id,
          createdAt: new Date(2024, i * 3, 15), // Fechas distribuidas en el año
          updatedAt: new Date(2024, i * 3, 15)
        };

        progressReports.push(reportData);
      }
    }

    // Crear informes de indicadores independientes (los que no están asociados a actividades)
    const independentIndicators = await prisma.indicator.findMany({
      where: {
        activityId: null, // Indicadores independientes
        isActive: true
      }
    });

    console.log(`📊 Indicadores independientes: ${independentIndicators.length}`);

    for (const indicator of independentIndicators) {
      const assignedUser = users[Math.floor(Math.random() * users.length)]; // Asignar usuario aleatoriamente
      
      // Crear informes para 2 trimestres
      const quarters = ['T1', 'T2'];
      const quarterTargets = [
        indicator.q1Target || 30,
        indicator.q2Target || 60
      ];

      for (let i = 0; i < quarters.length; i++) {
        const quarter = quarters[i];
        const target = quarterTargets[i];
        const currentValue = Math.floor(target * (0.8 + Math.random() * 0.3)); // 80-110% del target
        const executionPercentage = (currentValue / target) * 100;

        const reportData = {
          indicatorId: indicator.id,
          periodType: 'trimestral',
          period: quarter,
          currentValue: currentValue,
          targetValue: target,
          executionPercentage: Math.round(executionPercentage * 100) / 100,
          qualitativeComments: `Reporte ${quarter} del indicador ${indicator.name}. Los datos recopilados muestran un desempeño ${executionPercentage >= 100 ? 'excelente' : executionPercentage >= 90 ? 'muy bueno' : 'satisfactorio'}.`,
          challenges: executionPercentage < 90 ? 'Se requiere mejorar los procesos de recolección de datos y seguimiento.' : 'Los procesos de medición funcionan correctamente.',
          nextSteps: `Continuar con el monitoreo del indicador y implementar mejoras en la metodología de medición.`,
          status: i === 0 ? 'APPROVED' : 'SUBMITTED',
          reportedById: assignedUser.id,
          createdAt: new Date(2024, i * 3, 20),
          updatedAt: new Date(2024, i * 3, 20)
        };

        progressReports.push(reportData);
      }
    }

    console.log(`📝 Creando ${progressReports.length} informes de progreso...`);

    // Crear todos los informes
    for (const reportData of progressReports) {
      await prisma.progressReport.create({
        data: reportData
      });
    }

    console.log('✅ Informes de progreso creados exitosamente');

    // Verificar la creación
    const finalCount = await prisma.progressReport.count();
    console.log(`📊 Total de informes creados: ${finalCount}`);

    // Mostrar resumen por estado
    const statusSummary = await prisma.progressReport.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    console.log('📈 Resumen por estado:');
    statusSummary.forEach(group => {
      console.log(`   ${group.status}: ${group._count.status} informes`);
    });

  } catch (error) {
    console.error('❌ Error creando informes de progreso:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createProgressReportsExamples().catch(console.error);
