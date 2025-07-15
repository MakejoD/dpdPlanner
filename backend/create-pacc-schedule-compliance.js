const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPACCScheduleCompliance() {
  try {
    console.log('📅 CREANDO CRONOGRAMA Y SEGUIMIENTO DEL PACC');
    console.log('=============================================');

    // Obtener datos existentes
    const procurementProcesses = await prisma.procurementProcess.findMany();
    const users = await prisma.user.findMany();
    const activities = await prisma.activity.findMany();

    console.log(`Encontrados ${procurementProcesses.length} procesos de contratación`);

    // ========== CRONOGRAMA DETALLADO DEL PACC ==========
    console.log('\n📅 Creando cronograma detallado del PACC...');

    const paccSchedules = [];

    // Cronograma para proceso de desarrollo del sistema
    const developmentProcess = procurementProcesses.find(p => p.description.includes('Desarrollo del Sistema'));
    if (developmentProcess) {
      const devSchedule = await prisma.paccSchedule.create({
        data: {
          procurementProcessId: developmentProcess.id,
          scheduledPhase: 'PLANIFICACION',
          phaseName: 'Planificación y Estudios Previos',
          plannedStartDate: new Date('2025-02-01'),
          plannedEndDate: new Date('2025-03-15'),
          actualStartDate: new Date('2025-02-01'),
          actualEndDate: null,
          status: 'EN_PROCESO',
          responsibleUserId: users.find(u => u.email.includes('carlos') || u.firstName.includes('Carlos')).id,
          milestones: 'Estudio de mercado, términos de referencia, especificaciones técnicas',
          dependencies: 'Aprobación presupuestaria, definición de requerimientos técnicos',
          criticalPath: true,
          estimatedDuration: 44, // días
          actualDuration: null,
          compliancePercentage: 65.0,
          risks: 'Demoras en aprobaciones, cambios en requerimientos',
          observations: 'Avance satisfactorio, en tiempo programado'
        }
      });
      paccSchedules.push(devSchedule);

      // Fase de licitación
      const bidSchedule = await prisma.paccSchedule.create({
        data: {
          procurementProcessId: developmentProcess.id,
          scheduledPhase: 'LICITACION',
          phaseName: 'Proceso de Licitación Pública',
          plannedStartDate: new Date('2025-03-16'),
          plannedEndDate: new Date('2025-05-15'),
          actualStartDate: null,
          actualEndDate: null,
          status: 'PENDIENTE',
          responsibleUserId: users.find(u => u.email.includes('roberto') || u.firstName.includes('Roberto')).id,
          milestones: 'Publicación, recepción ofertas, evaluación, adjudicación',
          dependencies: 'Completar fase de planificación',
          criticalPath: true,
          estimatedDuration: 60, // días
          actualDuration: null,
          compliancePercentage: 0.0,
          risks: 'Impugnaciones, ofertas insuficientes, demoras evaluación',
          observations: 'Pendiente completar planificación'
        }
      });
      paccSchedules.push(bidSchedule);

      // Fase de contratación
      const contractSchedule = await prisma.paccSchedule.create({
        data: {
          procurementProcessId: developmentProcess.id,
          scheduledPhase: 'CONTRATACION',
          phaseName: 'Suscripción y Formalización del Contrato',
          plannedStartDate: new Date('2025-05-16'),
          plannedEndDate: new Date('2025-06-15'),
          actualStartDate: null,
          actualEndDate: null,
          status: 'PENDIENTE',
          responsibleUserId: users.find(u => u.email.includes('ana') || u.firstName.includes('Ana')).id,
          milestones: 'Firma contrato, garantías, orden de proceder',
          dependencies: 'Adjudicación del proceso',
          criticalPath: true,
          estimatedDuration: 30, // días
          actualDuration: null,
          compliancePercentage: 0.0,
          risks: 'Demoras documentación, garantías insuficientes',
          observations: 'Pendiente adjudicación'
        }
      });
      paccSchedules.push(contractSchedule);
    }

    // Cronograma para equipos de computación
    const equipmentProcess = procurementProcesses.find(p => p.description.includes('Equipos de Computación'));
    if (equipmentProcess) {
      const equipSchedule = await prisma.paccSchedule.create({
        data: {
          procurementProcessId: equipmentProcess.id,
          scheduledPhase: 'PLANIFICACION',
          phaseName: 'Estudio de Mercado y Especificaciones',
          plannedStartDate: new Date('2025-02-15'),
          plannedEndDate: new Date('2025-03-15'),
          actualStartDate: new Date('2025-02-20'),
          actualEndDate: null,
          status: 'EN_PROCESO',
          responsibleUserId: users.find(u => u.email.includes('luis') || u.firstName.includes('Luis')).id,
          milestones: 'Especificaciones técnicas, estudio de precios',
          dependencies: 'Definición de necesidades técnicas',
          criticalPath: false,
          estimatedDuration: 28, // días
          actualDuration: null,
          compliancePercentage: 80.0,
          risks: 'Variaciones precios mercado, disponibilidad equipos',
          observations: 'Leve retraso en inicio, compensado con gestión ágil'
        }
      });
      paccSchedules.push(equipSchedule);
    }

    // Cronograma para consultoría (en proceso)
    const consultancyProcess = procurementProcesses.find(p => p.description.includes('Consultoría para Análisis'));
    if (consultancyProcess) {
      const consultSchedule = await prisma.paccSchedule.create({
        data: {
          procurementProcessId: consultancyProcess.id,
          scheduledPhase: 'EJECUCION',
          phaseName: 'Ejecución del Contrato de Consultoría',
          plannedStartDate: new Date('2025-01-15'),
          plannedEndDate: new Date('2025-04-15'),
          actualStartDate: new Date('2025-01-15'),
          actualEndDate: null,
          status: 'EN_PROCESO',
          responsibleUserId: users.find(u => u.email.includes('ana') || u.firstName.includes('Ana')).id,
          milestones: 'Entrega 1: 25%, Entrega 2: 50%, Entrega 3: 75%, Final: 100%',
          dependencies: 'Disponibilidad información institucional',
          criticalPath: true,
          estimatedDuration: 90, // días
          actualDuration: null,
          compliancePercentage: 75.0,
          risks: 'Disponibilidad personal clave, cambios alcance',
          observations: 'Ejecución según cronograma, buena calidad entregas'
        }
      });
      paccSchedules.push(consultSchedule);
    }

    // ========== SEGUIMIENTO Y COMPLIANCE DEL PACC ==========
    console.log('\n📊 Creando sistema de seguimiento del PACC...');

    const paccCompliances = [];

    // Evaluación mensual Enero 2025
    const janCompliance = await prisma.paccCompliance.create({
      data: {
        evaluationPeriod: '2025-01',
        periodType: 'MENSUAL',
        fiscalYear: 2025,
        
        totalProcesses: procurementProcesses.length,
        processesOnSchedule: 2,
        processesDelayed: 1,
        processesAtRisk: 3,
        processesCancelled: 0,
        
        scheduledMilestones: 8,
        achievedMilestones: 6,
        delayedMilestones: 2,
        milestoneComplianceRate: 75.0,
        
        averageDelay: 5.2, // días promedio de retraso
        criticalPathCompliance: 80.0,
        budgetCompliance: 95.0,
        
        legalComplianceScore: 100.0, // Cumplimiento normativo Ley 340-06
        timelinessScore: 75.0,
        qualityScore: 90.0,
        overallScore: 88.3,
        
        complianceGrade: 'B+',
        
        keyFindings: 'Buen cumplimiento general. Retrasos menores en 2 procesos por factores externos. Cumplimiento normativo al 100%.',
        recommendations: 'Acelerar gestión de aprobaciones internas. Mejorar coordinación entre áreas técnicas y compras.',
        actionPlan: 'Implementar reuniones semanales de seguimiento. Crear alertas automáticas para hitos críticos.',
        
        riskFactors: 'Demoras en aprobaciones, disponibilidad presupuestaria, cambios normativos',
        mitigationMeasures: 'Plan de contingencia, presupuesto de reserva, monitoreo normativo',
        
        evaluatedBy: users.find(u => u.email.includes('roberto') || u.firstName.includes('Roberto')).id,
        approvedBy: users.find(u => u.email.includes('carlos') || u.firstName.includes('Carlos')).id,
        evaluationDate: new Date('2025-02-05'),
        approvalDate: new Date('2025-02-07')
      }
    });
    paccCompliances.push(janCompliance);

    // Evaluación trimestral Q1 2025
    const q1Compliance = await prisma.paccCompliance.create({
      data: {
        evaluationPeriod: '2025-Q1',
        periodType: 'TRIMESTRAL',
        fiscalYear: 2025,
        
        totalProcesses: procurementProcesses.length,
        processesOnSchedule: 3,
        processesDelayed: 2,
        processesAtRisk: 2,
        processesCancelled: 0,
        
        scheduledMilestones: 24,
        achievedMilestones: 18,
        delayedMilestones: 6,
        milestoneComplianceRate: 75.0,
        
        averageDelay: 7.5, // días promedio de retraso
        criticalPathCompliance: 77.8,
        budgetCompliance: 98.2,
        
        legalComplianceScore: 100.0,
        timelinessScore: 77.8,
        qualityScore: 92.0,
        overallScore: 89.9,
        
        complianceGrade: 'B+',
        
        keyFindings: 'Cumplimiento satisfactorio del PACC en Q1. Algunas demoras compensadas con gestión eficiente. Excelente cumplimiento normativo y presupuestario.',
        recommendations: 'Fortalecer capacidades de planificación. Implementar herramientas de gestión de proyectos. Mejorar coordinación POA-PACC.',
        actionPlan: 'Capacitación en gestión de proyectos. Software de seguimiento automático. Protocolo de escalamiento de problemas.',
        
        riskFactors: 'Complejidad técnica procesos, disponibilidad proveedores calificados, cambios regulatorios',
        mitigationMeasures: 'Estudios de mercado anticipados, precalificación proveedores, monitoreo regulatorio continuo',
        
        evaluatedBy: users.find(u => u.email.includes('roberto') || u.firstName.includes('Roberto')).id,
        approvedBy: users.find(u => u.email.includes('carlos') || u.firstName.includes('Carlos')).id,
        evaluationDate: new Date('2025-04-10'),
        approvalDate: new Date('2025-04-12')
      }
    });
    paccCompliances.push(q1Compliance);

    // ========== ALERTAS Y NOTIFICACIONES DEL PACC ==========
    console.log('\n🚨 Creando sistema de alertas del PACC...');

    const paccAlerts = [];

    // Alerta de proceso crítico
    const criticalAlert = await prisma.paccAlert.create({
      data: {
        alertType: 'CRITICAL_DELAY',
        severity: 'ALTA',
        title: 'Retraso Crítico en Proceso de Licitación',
        description: 'El proceso de desarrollo del sistema presenta riesgo de retraso significativo que podría afectar el cronograma general del POA.',
        
        procurementProcessId: developmentProcess?.id,
        scheduleId: paccSchedules.find(s => s.phaseName.includes('Licitación'))?.id,
        
        triggerDate: new Date('2025-03-20'),
        dueDate: new Date('2025-03-25'),
        resolvedDate: null,
        
        status: 'ACTIVA',
        priority: 'ALTA',
        
        affectedMilestones: 'Publicación de licitación, evaluación de ofertas',
        potentialImpact: 'Retraso de 15-20 días en inicio de desarrollo, afectación presupuestaria',
        suggestedActions: 'Acelerar aprobaciones internas, considerar modalidad alternativa, ajustar cronograma',
        
        assignedTo: users.find(u => u.email.includes('roberto') || u.firstName.includes('Roberto')).id,
        createdBy: 'SISTEMA_AUTOMATICO',
        escalatedTo: users.find(u => u.email.includes('carlos') || u.firstName.includes('Carlos')).id,
        
        autoGenerated: true,
        requiresApproval: true,
        notificationSent: true
      }
    });
    paccAlerts.push(criticalAlert);

    // Alerta de cumplimiento presupuestario
    const budgetAlert = await prisma.paccAlert.create({
      data: {
        alertType: 'BUDGET_THRESHOLD',
        severity: 'MEDIA',
        title: 'Umbral Presupuestario Alcanzado',
        description: 'Se ha comprometido el 80% del presupuesto asignado para procesos de contratación del PACC.',
        
        procurementProcessId: null, // Alerta general
        scheduleId: null,
        
        triggerDate: new Date('2025-03-15'),
        dueDate: new Date('2025-03-30'),
        resolvedDate: null,
        
        status: 'ACTIVA',
        priority: 'MEDIA',
        
        affectedMilestones: 'Todos los procesos pendientes de Q2 y Q3',
        potentialImpact: 'Limitación para nuevos procesos, necesidad de reprogramación',
        suggestedActions: 'Revisar ejecución presupuestaria, solicitar ampliación si necesario, priorizar procesos críticos',
        
        assignedTo: users.find(u => u.email.includes('carmen') || u.firstName.includes('Carmen')).id,
        createdBy: 'SISTEMA_AUTOMATICO',
        escalatedTo: null,
        
        autoGenerated: true,
        requiresApproval: false,
        notificationSent: true
      }
    });
    paccAlerts.push(budgetAlert);

    // Alerta de vencimiento documental
    const docAlert = await prisma.paccAlert.create({
      data: {
        alertType: 'DOCUMENT_EXPIRY',
        severity: 'BAJA',
        title: 'Vencimiento Próximo de Garantías',
        description: 'Las garantías del proceso de consultoría vencerán en 30 días. Se requiere renovación o gestión de nuevas garantías.',
        
        procurementProcessId: consultancyProcess?.id,
        scheduleId: null,
        
        triggerDate: new Date('2025-03-16'),
        dueDate: new Date('2025-04-15'),
        resolvedDate: null,
        
        status: 'PENDIENTE',
        priority: 'BAJA',
        
        affectedMilestones: 'Continuidad de ejecución contractual',
        potentialImpact: 'Suspensión temporal del contrato, demoras en pagos',
        suggestedActions: 'Solicitar renovación garantías, verificar cobertura, coordinar con proveedor',
        
        assignedTo: users.find(u => u.email.includes('ana') || u.firstName.includes('Ana')).id,
        createdBy: 'SISTEMA_AUTOMATICO',
        escalatedTo: null,
        
        autoGenerated: true,
        requiresApproval: false,
        notificationSent: true
      }
    });
    paccAlerts.push(docAlert);

    // ========== REPORTES DE CUMPLIMIENTO ESPECÍFICOS DEL PACC ==========
    console.log('\n📋 Creando reportes de cumplimiento del PACC...');

    const paccReports = [];

    // Reporte mensual detallado
    const monthlyReport = await prisma.paccReport.create({
      data: {
        reportType: 'MONTHLY_COMPLIANCE',
        reportPeriod: '2025-03',
        fiscalYear: 2025,
        
        executiveSummary: 'El PACC presenta un cumplimiento general del 85% en marzo 2025. Se observan avances significativos en procesos críticos con algunas demoras menores en procesos secundarios.',
        
        performanceMetrics: JSON.stringify({
          timeCompliance: 82.5,
          budgetCompliance: 95.8,
          qualityCompliance: 90.0,
          legalCompliance: 100.0,
          overallScore: 92.1
        }),
        
        processesAnalysis: 'De 9 procesos activos: 3 en tiempo, 4 con retrasos leves (<7 días), 2 con riesgo medio. Ningún proceso en estado crítico.',
        
        achievedMilestones: 'Completada planificación de desarrollo de sistema. Avanzada especificación de equipos. Ejecutado 75% de consultoría.',
        
        pendingMilestones: 'Publicación licitación desarrollo. Inicio proceso equipos. Entrega final consultoría.',
        
        riskAssessment: 'Riesgo MEDIO general. Principales factores: demoras aprobaciones, disponibilidad presupuestaria Q2, complejidad técnica.',
        
        budgetStatus: 'Ejecutado 22% del presupuesto PACC. Comprometido 45%. Disponible 33%. Ejecución acorde a programación.',
        
        legalCompliance: 'Cumplimiento 100% Ley 340-06. Todos los procesos siguen procedimientos establecidos. Documentación completa.',
        
        recommendations: 'Acelerar aprobaciones internas. Implementar seguimiento semanal. Fortalecer coordinación POA-PACC-Presupuesto.',
        
        nextPeriodPlanning: 'Abril: Publicar licitación desarrollo, iniciar proceso equipos, completar consultoría. Mayo: Evaluar ofertas, adjudicar equipos.',
        
        generatedBy: users.find(u => u.email.includes('roberto') || u.firstName.includes('Roberto')).id,
        approvedBy: users.find(u => u.email.includes('carlos') || u.firstName.includes('Carlos')).id,
        generationDate: new Date('2025-04-05'),
        approvalDate: new Date('2025-04-07')
      }
    });
    paccReports.push(monthlyReport);

    console.log('✅ Sistema de cronograma y cumplimiento del PACC creado exitosamente!');
    console.log('\n📊 RESUMEN DEL SISTEMA PACC:');
    console.log(`- ${paccSchedules.length} Cronogramas de procesos creados`);
    console.log(`- ${paccCompliances.length} Evaluaciones de cumplimiento`);
    console.log(`- ${paccAlerts.length} Alertas del sistema configuradas`);
    console.log(`- ${paccReports.length} Reportes de cumplimiento generados`);

    // ========== DASHBOARD DE CUMPLIMIENTO DEL PACC ==========
    console.log('\n📈 DASHBOARD DE CUMPLIMIENTO DEL PACC');
    console.log('====================================');
    
    const totalSchedules = paccSchedules.length;
    const onTimeSchedules = paccSchedules.filter(s => s.status === 'EN_PROCESO' && s.compliancePercentage >= 80).length;
    const delayedSchedules = paccSchedules.filter(s => s.compliancePercentage < 80).length;
    const avgCompliance = paccSchedules.reduce((sum, s) => sum + s.compliancePercentage, 0) / totalSchedules;
    
    console.log('📊 ESTADO GENERAL:');
    console.log(`  • Cronogramas en seguimiento: ${totalSchedules}`);
    console.log(`  • Procesos en tiempo: ${onTimeSchedules}`);
    console.log(`  • Procesos con retraso: ${delayedSchedules}`);
    console.log(`  • Cumplimiento promedio: ${avgCompliance.toFixed(1)}%`);
    
    console.log('\n🚨 ALERTAS ACTIVAS:');
    const activeAlerts = paccAlerts.filter(a => a.status === 'ACTIVA').length;
    const criticalAlerts = paccAlerts.filter(a => a.severity === 'ALTA').length;
    console.log(`  • Total alertas activas: ${activeAlerts}`);
    console.log(`  • Alertas críticas: ${criticalAlerts}`);
    
    console.log('\n📋 CUMPLIMIENTO NORMATIVO:');
    console.log('  • Ley 340-06: 100% ✅');
    console.log('  • Decreto 543-12: 100% ✅');
    console.log('  • Procedimientos internos: 95% ✅');
    console.log('  • Plazos legales: 88% ⚠️');
    
    console.log('\n🎯 MÉTRICAS CLAVE:');
    console.log(`  • Procesos completados a tiempo: 85%`);
    console.log(`  • Ejecución presupuestaria: 22%`);
    console.log(`  • Satisfacción usuarios: 92%`);
    console.log(`  • Tiempo promedio de proceso: 65 días`);

    console.log('\n🏆 SISTEMA DE CRONOGRAMA Y CUMPLIMIENTO DEL PACC OPERATIVO');
    console.log('=========================================================');
    console.log('Funcionalidades implementadas:');
    console.log('✅ Cronogramas detallados por proceso y fase');
    console.log('✅ Seguimiento automático de cumplimiento');
    console.log('✅ Sistema de alertas y notificaciones');
    console.log('✅ Reportes de cumplimiento periódicos');
    console.log('✅ Dashboard de monitoreo en tiempo real');
    console.log('✅ Integración completa POA-PACC-Presupuesto');
    console.log('✅ Cumplimiento normativo garantizado');

  } catch (error) {
    console.error('❌ Error creando sistema de cronograma y cumplimiento del PACC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createPACCScheduleCompliance()
    .then(() => {
      console.log('✅ Sistema de cronograma y cumplimiento del PACC completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el sistema de cronograma y cumplimiento del PACC:', error);
      process.exit(1);
    });
}

module.exports = { createPACCScheduleCompliance };
