const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createIndicatorExamples() {
  try {
    console.log('📊 Creando indicadores de ejemplo...');

    // Obtener los datos existentes
    const strategicAxes = await prisma.strategicAxis.findMany();
    const objectives = await prisma.objective.findMany();
    const products = await prisma.product.findMany();
    const activities = await prisma.activity.findMany();

    // ========== INDICADORES DE EJE ESTRATÉGICO ==========
    console.log('🎯 Creando indicadores de eje estratégico...');
    
    const strategicAxisIndicators = await Promise.all([
      prisma.indicator.create({
        data: {
          name: 'Porcentaje de modernización institucional',
          description: 'Porcentaje de procesos institucionales modernizados conforme a estándares internacionales',
          type: 'RESULT',
          measurementUnit: 'Porcentaje',
          baseline: 30,
          annualTarget: 85,
          q1Target: 40,
          q2Target: 55,
          q3Target: 70,
          q4Target: 85,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-001-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Índice de transparencia institucional',
          description: 'Índice de transparencia según evaluación del SIGEF y portal 311',
          type: 'RESULT',
          measurementUnit: 'Puntos (0-100)',
          baseline: 65,
          annualTarget: 90,
          q1Target: 70,
          q2Target: 75,
          q3Target: 82,
          q4Target: 90,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-002-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Servicios públicos digitalizados',
          description: 'Número de servicios públicos completamente digitalizados y en operación',
          type: 'RESULT',
          measurementUnit: 'Servicios',
          baseline: 2,
          annualTarget: 10,
          q1Target: 4,
          q2Target: 6,
          q3Target: 8,
          q4Target: 10,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-003-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Eficiencia en ejecución presupuestaria',
          description: 'Porcentaje de ejecución presupuestaria conforme a la programación anual',
          type: 'RESULT',
          measurementUnit: 'Porcentaje',
          baseline: 78,
          annualTarget: 95,
          q1Target: 85,
          q2Target: 88,
          q3Target: 92,
          q4Target: 95,
          strategicAxisId: strategicAxes.find(s => s.code === 'EJE-004-2025').id,
          isActive: true
        }
      })
    ]);

    // ========== INDICADORES DE OBJETIVO ==========
    console.log('🎯 Creando indicadores de objetivo...');
    
    const objectiveIndicators = await Promise.all([
      prisma.indicator.create({
        data: {
          name: 'Sistema POA-PACC-Presupuesto implementado',
          description: 'Sistema integrado POA-PACC-Presupuesto funcionando correctamente',
          type: 'PRODUCT',
          measurementUnit: 'Sistema',
          baseline: 0,
          annualTarget: 1,
          q1Target: 0.25,
          q2Target: 0.5,
          q3Target: 0.75,
          q4Target: 1,
          objectiveId: objectives.find(o => o.code === 'OBJ-001-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Personal capacitado en planificación',
          description: 'Número de funcionarios capacitados en herramientas de planificación estratégica',
          type: 'PRODUCT',
          measurementUnit: 'Personas',
          baseline: 5,
          annualTarget: 50,
          q1Target: 15,
          q2Target: 25,
          q3Target: 35,
          q4Target: 50,
          objectiveId: objectives.find(o => o.code === 'OBJ-002-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Portal de transparencia actualizado',
          description: 'Portal de transparencia con información actualizada en tiempo real',
          type: 'PRODUCT',
          measurementUnit: 'Portal',
          baseline: 0,
          annualTarget: 1,
          q1Target: 0.2,
          q2Target: 0.6,
          q3Target: 0.8,
          q4Target: 1,
          objectiveId: objectives.find(o => o.code === 'OBJ-003-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Consultas ciudadanas atendidas',
          description: 'Número de consultas ciudadanas atendidas a través del sistema de seguimiento',
          type: 'RESULT',
          measurementUnit: 'Consultas',
          baseline: 50,
          annualTarget: 500,
          q1Target: 100,
          q2Target: 200,
          q3Target: 350,
          q4Target: 500,
          objectiveId: objectives.find(o => o.code === 'OBJ-004-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Tiempo promedio de respuesta de servicios',
          description: 'Tiempo promedio de respuesta de los servicios digitalizados',
          type: 'RESULT',
          measurementUnit: 'Días',
          baseline: 15,
          annualTarget: 3,
          q1Target: 12,
          q2Target: 8,
          q3Target: 5,
          q4Target: 3,
          objectiveId: objectives.find(o => o.code === 'OBJ-005-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Procesos de contratación optimizados',
          description: 'Porcentaje de procesos de contratación ejecutados en tiempo óptimo',
          type: 'RESULT',
          measurementUnit: 'Porcentaje',
          baseline: 60,
          annualTarget: 90,
          q1Target: 65,
          q2Target: 75,
          q3Target: 82,
          q4Target: 90,
          objectiveId: objectives.find(o => o.code === 'OBJ-006-2025').id,
          isActive: true
        }
      })
    ]);

    // ========== INDICADORES DE PRODUCTO ==========
    console.log('📦 Creando indicadores de producto...');
    
    const productIndicators = await Promise.all([
      prisma.indicator.create({
        data: {
          name: 'Módulos del sistema desarrollados',
          description: 'Número de módulos funcionales del sistema POA-PACC-Presupuesto completados',
          type: 'PRODUCT',
          measurementUnit: 'Módulos',
          baseline: 0,
          annualTarget: 8,
          q1Target: 2,
          q2Target: 4,
          q3Target: 6,
          q4Target: 8,
          productId: products.find(p => p.code === 'PROD-001-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Usuarios activos del sistema',
          description: 'Número de usuarios que utilizan activamente el sistema POA-PACC-Presupuesto',
          type: 'RESULT',
          measurementUnit: 'Usuarios',
          baseline: 0,
          annualTarget: 100,
          q1Target: 10,
          q2Target: 30,
          q3Target: 60,
          q4Target: 100,
          productId: products.find(p => p.code === 'PROD-001-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Secciones del manual completadas',
          description: 'Número de secciones del manual de procedimientos completadas',
          type: 'PRODUCT',
          measurementUnit: 'Secciones',
          baseline: 0,
          annualTarget: 12,
          q1Target: 3,
          q2Target: 6,
          q3Target: 9,
          q4Target: 12,
          productId: products.find(p => p.code === 'PROD-002-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Horas de capacitación impartidas',
          description: 'Total de horas de capacitación en planificación impartidas',
          type: 'PRODUCT',
          measurementUnit: 'Horas',
          baseline: 0,
          annualTarget: 200,
          q1Target: 40,
          q2Target: 80,
          q3Target: 140,
          q4Target: 200,
          productId: products.find(p => p.code === 'PROD-003-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Visitas al portal de transparencia',
          description: 'Número de visitas mensuales al portal de transparencia renovado',
          type: 'RESULT',
          measurementUnit: 'Visitas/mes',
          baseline: 1000,
          annualTarget: 5000,
          q1Target: 2000,
          q2Target: 3000,
          q3Target: 4000,
          q4Target: 5000,
          productId: products.find(p => p.code === 'PROD-004-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Descargas de la app ciudadana',
          description: 'Número de descargas de la aplicación móvil de seguimiento ciudadano',
          type: 'RESULT',
          measurementUnit: 'Descargas',
          baseline: 0,
          annualTarget: 2000,
          q1Target: 200,
          q2Target: 600,
          q3Target: 1200,
          q4Target: 2000,
          productId: products.find(p => p.code === 'PROD-005-2025').id,
          isActive: true
        }
      })
    ]);

    // ========== INDICADORES DE ACTIVIDAD ==========
    console.log('📋 Creando indicadores de actividad...');
    
    const activityIndicators = await Promise.all([
      prisma.indicator.create({
        data: {
          name: 'Documentos de análisis elaborados',
          description: 'Número de documentos de análisis y diseño del sistema completados',
          type: 'PRODUCT',
          measurementUnit: 'Documentos',
          baseline: 0,
          annualTarget: 5,
          q1Target: 5,
          q2Target: 5,
          q3Target: 5,
          q4Target: 5,
          activityId: activities.find(a => a.code === 'ACT-001-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Porcentaje de desarrollo completado',
          description: 'Porcentaje de desarrollo del sistema POA-PACC-Presupuesto completado',
          type: 'PRODUCT',
          measurementUnit: 'Porcentaje',
          baseline: 0,
          annualTarget: 100,
          q1Target: 0,
          q2Target: 25,
          q3Target: 75,
          q4Target: 100,
          activityId: activities.find(a => a.code === 'ACT-002-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Casos de prueba ejecutados',
          description: 'Número de casos de prueba del sistema ejecutados exitosamente',
          type: 'PRODUCT',
          measurementUnit: 'Casos',
          baseline: 0,
          annualTarget: 50,
          q1Target: 0,
          q2Target: 0,
          q3Target: 25,
          q4Target: 50,
          activityId: activities.find(a => a.code === 'ACT-003-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Procedimientos revisados',
          description: 'Número de procedimientos del POA revisados y documentados',
          type: 'PRODUCT',
          measurementUnit: 'Procedimientos',
          baseline: 0,
          annualTarget: 15,
          q1Target: 15,
          q2Target: 15,
          q3Target: 15,
          q4Target: 15,
          activityId: activities.find(a => a.code === 'ACT-004-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Talleres de capacitación realizados',
          description: 'Número de talleres de capacitación en planificación realizados',
          type: 'PRODUCT',
          measurementUnit: 'Talleres',
          baseline: 0,
          annualTarget: 20,
          q1Target: 2,
          q2Target: 8,
          q3Target: 15,
          q4Target: 20,
          activityId: activities.find(a => a.code === 'ACT-007-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Funcionalidades del portal implementadas',
          description: 'Número de nuevas funcionalidades implementadas en el portal de transparencia',
          type: 'PRODUCT',
          measurementUnit: 'Funcionalidades',
          baseline: 0,
          annualTarget: 10,
          q1Target: 2,
          q2Target: 5,
          q3Target: 8,
          q4Target: 10,
          activityId: activities.find(a => a.code === 'ACT-008-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Funcionalidades de la app desarrolladas',
          description: 'Número de funcionalidades de la aplicación móvil desarrolladas',
          type: 'PRODUCT',
          measurementUnit: 'Funcionalidades',
          baseline: 0,
          annualTarget: 8,
          q1Target: 0,
          q2Target: 3,
          q3Target: 6,
          q4Target: 8,
          activityId: activities.find(a => a.code === 'ACT-009-2025').id,
          isActive: true
        }
      }),
      
      prisma.indicator.create({
        data: {
          name: 'Procesos de contratación automatizados',
          description: 'Número de procesos de contratación completamente automatizados',
          type: 'PRODUCT',
          measurementUnit: 'Procesos',
          baseline: 0,
          annualTarget: 5,
          q1Target: 1,
          q2Target: 2,
          q3Target: 4,
          q4Target: 5,
          activityId: activities.find(a => a.code === 'ACT-011-2025').id,
          isActive: true
        }
      })
    ]);

    console.log('✅ Indicadores creados exitosamente!');
    console.log('\n📊 RESUMEN DE INDICADORES:');
    console.log(`- ${strategicAxisIndicators.length} Indicadores de Eje Estratégico`);
    console.log(`- ${objectiveIndicators.length} Indicadores de Objetivo`);
    console.log(`- ${productIndicators.length} Indicadores de Producto`);
    console.log(`- ${activityIndicators.length} Indicadores de Actividad`);
    console.log(`- ${strategicAxisIndicators.length + objectiveIndicators.length + productIndicators.length + activityIndicators.length} Total de Indicadores`);

  } catch (error) {
    console.error('❌ Error creando indicadores:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createIndicatorExamples()
    .then(() => {
      console.log('✅ Script de indicadores completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script de indicadores:', error);
      process.exit(1);
    });
}

module.exports = { createIndicatorExamples };
