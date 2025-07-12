const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createIndicatorsWithSampleData() {
  console.log('🎯 Creando indicadores de ejemplo...');

  try {
    // Obtener algunos elementos de planificación
    const strategicAxes = await prisma.strategicAxis.findMany({
      where: { isActive: true },
      take: 2
    });

    const objectives = await prisma.objective.findMany({
      where: { isActive: true },
      take: 3
    });

    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 4
    });

    const activities = await prisma.activity.findMany({
      where: { isActive: true },
      take: 5
    });

    // Crear indicadores para ejes estratégicos
    if (strategicAxes.length > 0) {
      const axisIndicators = [
        {
          name: 'Porcentaje de cumplimiento de objetivos del eje',
          description: 'Mide el cumplimiento general de todos los objetivos asociados al eje estratégico',
          type: 'RESULT',
          measurementUnit: 'Porcentaje',
          baseline: 0,
          annualTarget: 90,
          q1Target: 20,
          q2Target: 45,
          q3Target: 70,
          q4Target: 90,
          strategicAxisId: strategicAxes[0].id
        },
        {
          name: 'Índice de eficiencia presupuestaria',
          description: 'Relación entre recursos ejecutados y resultados obtenidos',
          type: 'RESULT',
          measurementUnit: 'Índice',
          baseline: 0.7,
          annualTarget: 0.95,
          q1Target: 0.75,
          q2Target: 0.85,
          q3Target: 0.90,
          q4Target: 0.95,
          strategicAxisId: strategicAxes.length > 1 ? strategicAxes[1].id : strategicAxes[0].id
        }
      ];

      for (const indicator of axisIndicators) {
        await prisma.indicator.upsert({
          where: {
            id: `axis-${indicator.strategicAxisId}-${indicator.name.toLowerCase().replace(/ /g, '-')}`
          },
          update: {},
          create: {
            id: `axis-${indicator.strategicAxisId}-${indicator.name.toLowerCase().replace(/ /g, '-')}`,
            ...indicator
          }
        });
      }
    }

    // Crear indicadores para objetivos
    if (objectives.length > 0) {
      const objectiveIndicators = [
        {
          name: 'Número de productos entregados',
          description: 'Cantidad total de productos/servicios entregados por el objetivo',
          type: 'PRODUCT',
          measurementUnit: 'Unidades',
          baseline: 0,
          annualTarget: 12,
          q1Target: 3,
          q2Target: 6,
          q3Target: 9,
          q4Target: 12,
          objectiveId: objectives[0].id
        },
        {
          name: 'Satisfacción de beneficiarios',
          description: 'Nivel de satisfacción de los beneficiarios del objetivo',
          type: 'RESULT',
          measurementUnit: 'Porcentaje',
          baseline: 70,
          annualTarget: 85,
          q1Target: 75,
          q2Target: 80,
          q3Target: 82,
          q4Target: 85,
          objectiveId: objectives.length > 1 ? objectives[1].id : objectives[0].id
        }
      ];

      for (const indicator of objectiveIndicators) {
        await prisma.indicator.upsert({
          where: {
            id: `obj-${indicator.objectiveId}-${indicator.name.toLowerCase().replace(/ /g, '-')}`
          },
          update: {},
          create: {
            id: `obj-${indicator.objectiveId}-${indicator.name.toLowerCase().replace(/ /g, '-')}`,
            ...indicator
          }
        });
      }
    }

    // Crear indicadores para productos
    if (products.length > 0) {
      const productIndicators = [
        {
          name: 'Documentos técnicos elaborados',
          description: 'Número de documentos técnicos desarrollados',
          type: 'PRODUCT',
          measurementUnit: 'Documentos',
          baseline: 0,
          annualTarget: 8,
          q1Target: 2,
          q2Target: 4,
          q3Target: 6,
          q4Target: 8,
          productId: products[0].id
        },
        {
          name: 'Capacitaciones realizadas',
          description: 'Número de eventos de capacitación ejecutados',
          type: 'PRODUCT',
          measurementUnit: 'Eventos',
          baseline: 0,
          annualTarget: 24,
          q1Target: 6,
          q2Target: 12,
          q3Target: 18,
          q4Target: 24,
          productId: products.length > 1 ? products[1].id : products[0].id
        },
        {
          name: 'Calidad de productos entregados',
          description: 'Porcentaje de productos que cumplen estándares de calidad',
          type: 'RESULT',
          measurementUnit: 'Porcentaje',
          baseline: 80,
          annualTarget: 95,
          q1Target: 85,
          q2Target: 90,
          q3Target: 92,
          q4Target: 95,
          productId: products.length > 2 ? products[2].id : products[0].id
        }
      ];

      for (const indicator of productIndicators) {
        await prisma.indicator.upsert({
          where: {
            id: `prod-${indicator.productId}-${indicator.name.toLowerCase().replace(/ /g, '-')}`
          },
          update: {},
          create: {
            id: `prod-${indicator.productId}-${indicator.name.toLowerCase().replace(/ /g, '-')}`,
            ...indicator
          }
        });
      }
    }

    // Crear indicadores para actividades
    if (activities.length > 0) {
      const activityIndicators = [
        {
          name: 'Reuniones de coordinación realizadas',
          description: 'Número de reuniones de coordinación ejecutadas',
          type: 'PRODUCT',
          measurementUnit: 'Reuniones',
          baseline: 0,
          annualTarget: 48,
          q1Target: 12,
          q2Target: 24,
          q3Target: 36,
          q4Target: 48,
          activityId: activities[0].id
        },
        {
          name: 'Informes de avance entregados',
          description: 'Número de informes de seguimiento presentados',
          type: 'PRODUCT',
          measurementUnit: 'Informes',
          baseline: 0,
          annualTarget: 12,
          q1Target: 3,
          q2Target: 6,
          q3Target: 9,
          q4Target: 12,
          activityId: activities.length > 1 ? activities[1].id : activities[0].id
        },
        {
          name: 'Tiempo promedio de respuesta',
          description: 'Tiempo promedio para completar la actividad',
          type: 'RESULT',
          measurementUnit: 'Días',
          baseline: 15,
          annualTarget: 10,
          q1Target: 13,
          q2Target: 12,
          q3Target: 11,
          q4Target: 10,
          activityId: activities.length > 2 ? activities[2].id : activities[0].id
        },
        {
          name: 'Recursos humanos capacitados',
          description: 'Número de personas capacitadas en la actividad',
          type: 'PRODUCT',
          measurementUnit: 'Personas',
          baseline: 0,
          annualTarget: 120,
          q1Target: 30,
          q2Target: 60,
          q3Target: 90,
          q4Target: 120,
          activityId: activities.length > 3 ? activities[3].id : activities[0].id
        }
      ];

      for (const indicator of activityIndicators) {
        await prisma.indicator.upsert({
          where: {
            id: `act-${indicator.activityId}-${indicator.name.toLowerCase().replace(/ /g, '-')}`
          },
          update: {},
          create: {
            id: `act-${indicator.activityId}-${indicator.name.toLowerCase().replace(/ /g, '-')}`,
            ...indicator
          }
        });
      }
    }

    console.log('✅ Indicadores de ejemplo creados exitosamente');

    // Mostrar resumen
    const indicatorCount = await prisma.indicator.count();
    const byLevel = {
      strategicAxis: await prisma.indicator.count({ where: { strategicAxisId: { not: null } } }),
      objective: await prisma.indicator.count({ where: { objectiveId: { not: null } } }),
      product: await prisma.indicator.count({ where: { productId: { not: null } } }),
      activity: await prisma.indicator.count({ where: { activityId: { not: null } } })
    };

    console.log(`📊 Resumen de indicadores:`);
    console.log(`   Total: ${indicatorCount}`);
    console.log(`   Por Ejes Estratégicos: ${byLevel.strategicAxis}`);
    console.log(`   Por Objetivos: ${byLevel.objective}`);
    console.log(`   Por Productos: ${byLevel.product}`);
    console.log(`   Por Actividades: ${byLevel.activity}`);

  } catch (error) {
    console.error('❌ Error al crear indicadores:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createIndicatorsWithSampleData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { createIndicatorsWithSampleData };
