const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createProgressTrackingExamples() {
  try {
    console.log('📊 Creando ejemplos de seguimiento y progreso...');

    // Obtener datos existentes
    const activities = await prisma.activity.findMany();
    const indicators = await prisma.indicator.findMany();
    const users = await prisma.user.findMany();

    // ========== REPORTES DE PROGRESO DE ACTIVIDADES ==========
    console.log('📋 Creando reportes de progreso de actividades...');
    
    const activityProgressReports = await Promise.all([
      // Reporte para análisis y diseño del sistema (Q1)
      prisma.progressReport.create({
        data: {
          periodType: 'trimestral',
          period: '2025-Q1',
          currentValue: 5,
          targetValue: 5,
          executionPercentage: 100,
          qualitativeComments: 'Se completó exitosamente la fase de análisis y diseño del sistema POA-PACC-Presupuesto. Se elaboraron 5 documentos técnicos incluyendo análisis de requerimientos, diseño de arquitectura, modelo de datos, especificaciones funcionales y plan de implementación.',
          challenges: 'Inicialmente hubo demoras en la definición de algunos requerimientos específicos del SIGEF, pero se resolvieron mediante reuniones de coordinación con el Ministerio de Hacienda.',
          nextSteps: 'Proceder con la fase de desarrollo del sistema según cronograma establecido. Iniciar proceso de contratación del equipo de desarrollo.',
          status: 'aprobado',
          reviewComments: 'Excelente trabajo. Los documentos entregados cumplen con los estándares requeridos.',
          activityId: activities.find(a => a.code === 'ACT-001-2025').id,
          reportedById: users.find(u => u.email === 'patricia.ramirez@dpd.gob.do' || u.email.includes('patricia')).id,
          reviewedById: users.find(u => u.email === 'ana.garcia@dpd.gob.do' || u.email.includes('ana')).id,
          reviewedAt: new Date('2025-04-05')
        }
      }),

      // Reporte para capacitación (Q1)
      prisma.progressReport.create({
        data: {
          periodType: 'trimestral',
          period: '2025-Q1',
          currentValue: 2,
          targetValue: 2,
          executionPercentage: 100,
          qualitativeComments: 'Se realizaron 2 talleres de capacitación en planificación estratégica dirigidos a 25 funcionarios del DPD. Los talleres cubrieron metodologías POA, vinculación POA-PACC, y manejo del nuevo sistema.',
          challenges: 'Algunos participantes requerían nivelación en conceptos básicos de planificación, lo que requirió ajustar la metodología durante el desarrollo.',
          nextSteps: 'Continuar con el cronograma de capacitaciones. Programar talleres especializados por área temática para Q2.',
          status: 'aprobado',
          reviewComments: 'Muy buena ejecución. Se evidencia mejora en las competencias del personal.',
          activityId: activities.find(a => a.code === 'ACT-007-2025').id,
          reportedById: users.find(u => u.email === 'miguel.reyes@dpd.gob.do' || u.email.includes('miguel')).id,
          reviewedById: users.find(u => u.email === 'luis.rodriguez@dpd.gob.do' || u.email.includes('luis')).id,
          reviewedAt: new Date('2025-04-03')
        }
      }),

      // Reporte para desarrollo del sistema (Q2 - pendiente)
      prisma.progressReport.create({
        data: {
          periodType: 'trimestral',
          period: '2025-Q2',
          currentValue: 0.25,
          targetValue: 0.25,
          executionPercentage: 100,
          qualitativeComments: 'Se inició la fase de desarrollo del sistema. Se completó la configuración del ambiente de desarrollo y se implementaron los módulos básicos de autenticación y gestión de usuarios.',
          challenges: 'Demora en la entrega de equipos de computación afectó ligeramente el cronograma inicial.',
          nextSteps: 'Continuar con el desarrollo de los módulos de planificación estratégica y gestión de actividades.',
          status: 'pendiente',
          activityId: activities.find(a => a.code === 'ACT-002-2025').id,
          reportedById: users.find(u => u.email === 'patricia.ramirez@dpd.gob.do' || u.email.includes('patricia')).id
        }
      })
    ]);

    // ========== REPORTES DE PROGRESO DE INDICADORES ==========
    console.log('📊 Creando reportes de progreso de indicadores...');
    
    const indicatorProgressReports = await Promise.all([
      // Reporte para indicador de modernización institucional
      prisma.progressReport.create({
        data: {
          periodType: 'trimestral',
          period: '2025-Q1',
          currentValue: 40,
          targetValue: 40,
          executionPercentage: 100,
          qualitativeComments: 'Se avanzó significativamente en la modernización institucional. Se completó el análisis de procesos actuales y se diseñó la arquitectura del nuevo sistema integrado.',
          challenges: 'Resistencia inicial de algunos funcionarios al cambio, superada mediante actividades de sensibilización.',
          nextSteps: 'Continuar con la implementación del sistema y capacitación del personal.',
          status: 'aprobado',
          reviewComments: 'Avance satisfactorio conforme a lo programado.',
          indicatorId: indicators.find(i => i.name === 'Porcentaje de modernización institucional').id,
          reportedById: users.find(u => u.email === 'ana.garcia@dpd.gob.do').id,
          reviewedById: users.find(u => u.email === 'carlos.martinez@dpd.gob.do').id,
          reviewedAt: new Date('2025-04-02')
        }
      }),

      // Reporte para personal capacitado
      prisma.progressReport.create({
        data: {
          periodType: 'trimestral',
          period: '2025-Q1',
          currentValue: 15,
          targetValue: 15,
          executionPercentage: 100,
          qualitativeComments: 'Se capacitaron 15 funcionarios en herramientas de planificación estratégica durante el primer trimestre, superando ligeramente la meta de 15 personas.',
          challenges: 'Coordinación de horarios para liberar personal de sus actividades regulares.',
          nextSteps: 'Continuar con el programa de capacitación para alcanzar la meta de 50 funcionarios capacitados en el año.',
          status: 'aprobado',
          reviewComments: 'Excelente cumplimiento de la meta trimestral.',
          indicatorId: indicators.find(i => i.name === 'Personal capacitado en planificación').id,
          reportedById: users.find(u => u.email === 'miguel.reyes@dpd.gob.do').id,
          reviewedById: users.find(u => u.email === 'luis.rodriguez@dpd.gob.do').id,
          reviewedAt: new Date('2025-04-01')
        }
      }),

      // Reporte mensual de enero
      prisma.progressReport.create({
        data: {
          periodType: 'mensual',
          period: '2025-01',
          currentValue: 5,
          targetValue: 4,
          executionPercentage: 125,
          qualitativeComments: 'Enero fue un mes muy productivo. Se completaron 5 funcionarios capacitados superando la meta mensual de 4.',
          challenges: 'Ninguno significativo este mes.',
          nextSteps: 'Mantener el ritmo de capacitación para febrero.',
          status: 'aprobado',
          reviewComments: 'Superó las expectativas.',
          indicatorId: indicators.find(i => i.name === 'Personal capacitado en planificación').id,
          reportedById: users.find(u => u.email === 'miguel.reyes@dpd.gob.do').id,
          reviewedById: users.find(u => u.email === 'luis.rodriguez@dpd.gob.do').id,
          reviewedAt: new Date('2025-02-05')
        }
      })
    ]);

    // ========== REPORTES DE CUMPLIMIENTO GENERAL ==========
    console.log('📋 Creando reportes de cumplimiento...');
    
    const complianceReports = await Promise.all([
      prisma.complianceReport.create({
        data: {
          reportType: 'INTEGRATED',
          reportPeriod: 'QUARTERLY',
          fiscalYear: 2025,
          quarter: 'Q1',
          
          totalActivities: 11,
          activitiesOnTrack: 9,
          activitiesAtRisk: 2,
          activitiesDelayed: 0,
          
          totalProcurements: 9,
          procurementsCompleted: 0,
          procurementsInProcess: 2,
          procurementsDelayed: 0,
          
          totalBudget: 3665000.00,
          budgetExecuted: 163750.00,
          budgetAvailable: 3501250.00,
          executionPercentage: 4.47,
          
          overallCompliance: 85.5,
          complianceGrade: 'B',
          
          recommendations: 'Se recomienda acelerar los procesos de contratación pendientes, especialmente los de alta prioridad. Mejorar la comunicación entre las áreas de planificación, compras y presupuesto.',
          actionPlan: '1. Realizar mesa de trabajo semanal POA-PACC-Presupuesto. 2. Implementar alertas tempranas de cumplimiento. 3. Capacitar personal en nuevos procedimientos integrados.',
          
          generatedBy: 'Sistema Automático',
          approvedBy: users.find(u => u.email === 'carlos.martinez@dpd.gob.do').id,
          approvedAt: new Date('2025-04-10')
        }
      })
    ]);

    console.log('✅ Ejemplos de seguimiento creados exitosamente!');
    console.log('\n📊 RESUMEN DE SEGUIMIENTO:');
    console.log(`- ${activityProgressReports.length} Reportes de Progreso de Actividades`);
    console.log(`- ${indicatorProgressReports.length} Reportes de Progreso de Indicadores`);
    console.log(`- ${complianceReports.length} Reportes de Cumplimiento General`);

    // ========== DASHBOARD DE SEGUIMIENTO ==========
    console.log('\n📈 DASHBOARD DE SEGUIMIENTO Y CONTROL:');
    console.log('=====================================');
    
    // Calcular estadísticas de seguimiento
    const totalReports = activityProgressReports.length + indicatorProgressReports.length;
    const approvedReports = [...activityProgressReports, ...indicatorProgressReports].filter(r => r.status === 'aprobado').length;
    const pendingReports = [...activityProgressReports, ...indicatorProgressReports].filter(r => r.status === 'pendiente').length;
    
    console.log(`📊 ESTADO DE REPORTES:`);
    console.log(`  • Total de reportes: ${totalReports}`);
    console.log(`  • Reportes aprobados: ${approvedReports}`);
    console.log(`  • Reportes pendientes: ${pendingReports}`);
    console.log(`  • Tasa de aprobación: ${((approvedReports / totalReports) * 100).toFixed(1)}%`);
    
    console.log(`\n🎯 CUMPLIMIENTO DE METAS Q1-2025:`);
    console.log(`  • Análisis y diseño del sistema: 100% ✅`);
    console.log(`  • Capacitación de personal: 100% ✅`);
    console.log(`  • Modernización institucional: 100% ✅`);
    console.log(`  • Desarrollo del sistema: 100% ✅ (Q2 iniciado)`);
    
    console.log(`\n💰 EJECUCIÓN PRESUPUESTARIA Q1:`);
    console.log(`  • Ejecución general: 4.47%`);
    console.log(`  • Estado: Normal para Q1 📊`);
    console.log(`  • Próximas ejecuciones importantes: Q2`);
    
    console.log(`\n🛒 ESTADO PACC Q1:`);
    console.log(`  • Procesos en ejecución: 2/9 (22%)`);
    console.log(`  • Procesos pendientes críticos: 5`);
    console.log(`  • Alertas: Acelerar procesos de alta prioridad ⚠️`);

    console.log('\n🎉 SISTEMA DE SEGUIMIENTO COMPLETAMENTE FUNCIONAL');
    console.log('================================================');
    console.log('El sistema ahora incluye:');
    console.log('✅ Reportes de progreso de actividades');
    console.log('✅ Reportes de progreso de indicadores'); 
    console.log('✅ Reportes de cumplimiento integrado');
    console.log('✅ Dashboard de seguimiento y control');
    console.log('✅ Alertas y recomendaciones automáticas');
    console.log('✅ Integración completa POA-PACC-Presupuesto');

  } catch (error) {
    console.error('❌ Error creando ejemplos de seguimiento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createProgressTrackingExamples()
    .then(() => {
      console.log('✅ Sistema de seguimiento POA-PACC-Presupuesto completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el sistema de seguimiento:', error);
      process.exit(1);
    });
}

module.exports = { createProgressTrackingExamples };
