const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSimpleProgressExamples() {
  try {
    console.log('📊 Creando ejemplos simples de seguimiento...');

    // Obtener algunos datos existentes
    const activities = await prisma.activity.findMany();
    const indicators = await prisma.indicator.findMany();
    const users = await prisma.user.findMany();

    console.log(`Encontradas ${activities.length} actividades y ${users.length} usuarios`);

    if (activities.length === 0 || users.length === 0) {
      console.log('❌ No hay datos suficientes para crear reportes de seguimiento');
      return;
    }

    // ========== REPORTES DE PROGRESO SIMPLES ==========
    console.log('📋 Creando reportes de progreso...');
    
    const progressReports = [];

    // Crear reportes para las primeras 3 actividades
    for (let i = 0; i < Math.min(3, activities.length); i++) {
      const activity = activities[i];
      const reportedBy = users[i % users.length];
      const reviewedBy = users[(i + 1) % users.length];

      const report = await prisma.progressReport.create({
        data: {
          periodType: 'trimestral',
          period: '2025-Q1',
          currentValue: 75 + (i * 10),
          targetValue: 100,
          executionPercentage: 75 + (i * 10),
          qualitativeComments: `Progreso satisfactorio en la actividad ${activity.name}. Se han completado las tareas principales del trimestre.`,
          challenges: 'Coordinación entre departamentos y disponibilidad de recursos.',
          nextSteps: 'Continuar con la ejecución según cronograma establecido.',
          status: i === 0 ? 'aprobado' : 'pendiente',
          reviewComments: i === 0 ? 'Trabajo satisfactorio, cumple con expectativas.' : null,
          activityId: activity.id,
          reportedById: reportedBy.id,
          reviewedById: i === 0 ? reviewedBy.id : null,
          reviewedAt: i === 0 ? new Date() : null
        }
      });

      progressReports.push(report);
      console.log(`✅ Reporte creado para actividad: ${activity.name}`);
    }

    // ========== REPORTES DE INDICADORES ==========
    console.log('📊 Creando reportes de indicadores...');
    
    const indicatorReports = [];

    for (let i = 0; i < Math.min(2, indicators.length); i++) {
      const indicator = indicators[i];
      const reportedBy = users[i % users.length];

      const report = await prisma.progressReport.create({
        data: {
          periodType: 'trimestral',
          period: '2025-Q1',
          currentValue: indicator.q1Target * 0.9, // 90% de la meta
          targetValue: indicator.q1Target,
          executionPercentage: 90,
          qualitativeComments: `Avance del 90% en el indicador ${indicator.name}. Performance dentro de parámetros esperados.`,
          challenges: 'Algunos retrasos menores en recopilación de datos.',
          nextSteps: 'Completar la meta del trimestre y preparar reporte de Q2.',
          status: 'aprobado',
          reviewComments: 'Cumplimiento satisfactorio del indicador.',
          indicatorId: indicator.id,
          reportedById: reportedBy.id,
          reviewedById: users[(i + 1) % users.length].id,
          reviewedAt: new Date()
        }
      });

      indicatorReports.push(report);
      console.log(`✅ Reporte de indicador creado: ${indicator.name}`);
    }

    // ========== REPORTE DE CUMPLIMIENTO ==========
    console.log('📋 Creando reporte de cumplimiento...');
    
    const complianceReport = await prisma.complianceReport.create({
      data: {
        reportType: 'INTEGRATED',
        reportPeriod: 'QUARTERLY',
        fiscalYear: 2025,
        quarter: 'Q1',
        
        totalActivities: activities.length,
        activitiesOnTrack: Math.floor(activities.length * 0.8),
        activitiesAtRisk: Math.floor(activities.length * 0.15),
        activitiesDelayed: Math.floor(activities.length * 0.05),
        
        totalProcurements: 9,
        procurementsCompleted: 1,
        procurementsInProcess: 2,
        procurementsDelayed: 0,
        
        totalBudget: 3665000.00,
        budgetExecuted: 163750.00,
        budgetAvailable: 3501250.00,
        executionPercentage: 4.47,
        
        overallCompliance: 87.5,
        complianceGrade: 'B+',
        
        recommendations: 'Mantener el ritmo de ejecución actual. Monitorear de cerca las actividades en riesgo. Acelerar procesos de contratación pendientes.',
        actionPlan: 'Implementar reuniones semanales de seguimiento. Crear alertas tempranas para actividades críticas.',
        
        generatedBy: 'Sistema POA-PACC-Presupuesto',
        approvedBy: users[0].id,
        approvedAt: new Date()
      }
    });

    console.log('✅ Ejemplos de seguimiento creados exitosamente!');
    console.log('\n📊 RESUMEN DE SEGUIMIENTO:');
    console.log(`- ${progressReports.length} Reportes de Progreso de Actividades`);
    console.log(`- ${indicatorReports.length} Reportes de Progreso de Indicadores`);
    console.log(`- 1 Reporte de Cumplimiento General`);

    // ========== DASHBOARD BÁSICO ==========
    console.log('\n📈 DASHBOARD DE SEGUIMIENTO:');
    console.log('============================');
    
    const totalReports = progressReports.length + indicatorReports.length;
    const approvedReports = [...progressReports, ...indicatorReports].filter(r => r.status === 'aprobado').length;
    
    console.log(`📊 ESTADO DE REPORTES:`);
    console.log(`  • Total de reportes: ${totalReports}`);
    console.log(`  • Reportes aprobados: ${approvedReports}`);
    console.log(`  • Reportes pendientes: ${totalReports - approvedReports}`);
    console.log(`  • Tasa de aprobación: ${((approvedReports / totalReports) * 100).toFixed(1)}%`);
    
    console.log(`\n🎯 CUMPLIMIENTO GENERAL:`);
    console.log(`  • Cumplimiento POA-PACC-Presupuesto: ${complianceReport.overallCompliance}%`);
    console.log(`  • Calificación: ${complianceReport.complianceGrade}`);
    console.log(`  • Actividades en seguimiento: ${complianceReport.totalActivities}`);
    console.log(`  • Actividades en riesgo: ${complianceReport.activitiesAtRisk}`);

    console.log('\n🎉 SISTEMA DE SEGUIMIENTO OPERATIVO');
    console.log('===================================');
    console.log('✅ Reportes de progreso funcionando');
    console.log('✅ Indicadores de gestión monitoreados');
    console.log('✅ Dashboard de cumplimiento activo');
    console.log('✅ Sistema POA-PACC-Presupuesto completo');

  } catch (error) {
    console.error('❌ Error creando ejemplos de seguimiento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createSimpleProgressExamples()
    .then(() => {
      console.log('✅ Sistema de seguimiento completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el sistema de seguimiento:', error);
      process.exit(1);
    });
}

module.exports = { createSimpleProgressExamples };
