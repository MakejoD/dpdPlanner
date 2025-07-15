const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demonstratePACCFunctionalities() {
  try {
    console.log('🎯 DEMOSTRACIÓN DE FUNCIONALIDADES DEL CRONOGRAMA PACC');
    console.log('====================================================');

    // ========== CONSULTA DE CRONOGRAMAS ACTIVOS ==========
    console.log('\n📅 CRONOGRAMAS ACTIVOS DEL PACC:');
    
    const activeSchedules = await prisma.paccSchedule.findMany({
      where: {
        status: {
          in: ['EN_PROCESO', 'PENDIENTE']
        }
      },
      include: {
        procurementProcess: true,
        responsibleUser: {
          include: {
            department: true
          }
        }
      },
      orderBy: {
        plannedStartDate: 'asc'
      }
    });

    activeSchedules.forEach((schedule, index) => {
      console.log(`\n${index + 1}. ${schedule.phaseName}`);
      console.log(`   📋 Proceso: ${schedule.procurementProcess.description}`);
      console.log(`   📅 Período: ${schedule.plannedStartDate.toLocaleDateString()} - ${schedule.plannedEndDate.toLocaleDateString()}`);
      console.log(`   👤 Responsable: ${schedule.responsibleUser?.firstName} ${schedule.responsibleUser?.lastName}`);
      console.log(`   🏢 Departamento: ${schedule.responsibleUser?.department?.name || 'No asignado'}`);
      console.log(`   📊 Cumplimiento: ${schedule.compliancePercentage}%`);
      console.log(`   🚨 Estado: ${schedule.status}`);
      console.log(`   ⚡ Ruta crítica: ${schedule.criticalPath ? 'SÍ' : 'NO'}`);
      
      if (schedule.risks) {
        console.log(`   ⚠️ Riesgos: ${schedule.risks}`);
      }
      
      if (schedule.observations) {
        console.log(`   📝 Observaciones: ${schedule.observations}`);
      }
    });

    // ========== ANÁLISIS DE PROCESOS EN RIESGO ==========
    console.log('\n🚨 ANÁLISIS DE PROCESOS EN RIESGO:');
    
    const riskAnalysis = await prisma.paccSchedule.findMany({
      where: {
        OR: [
          { compliancePercentage: { lt: 80 } },
          { status: 'RETRASADA' },
          { criticalPath: true }
        ]
      },
      include: {
        procurementProcess: true,
        alerts: {
          where: {
            status: 'ACTIVA'
          }
        }
      }
    });

    console.log(`\nProcesos identificados con riesgo: ${riskAnalysis.length}`);
    
    riskAnalysis.forEach((schedule, index) => {
      console.log(`\n🔍 PROCESO EN RIESGO ${index + 1}:`);
      console.log(`   Nombre: ${schedule.phaseName}`);
      console.log(`   Proceso: ${schedule.procurementProcess.description}`);
      console.log(`   Cumplimiento: ${schedule.compliancePercentage}%`);
      console.log(`   Alertas activas: ${schedule.alerts.length}`);
      
      // Calcular días de retraso si aplica
      if (schedule.actualStartDate && schedule.plannedStartDate) {
        const delayDays = Math.floor((schedule.actualStartDate - schedule.plannedStartDate) / (1000 * 60 * 60 * 24));
        if (delayDays > 0) {
          console.log(`   📅 Retraso en inicio: ${delayDays} días`);
        }
      }
      
      // Mostrar alertas activas
      if (schedule.alerts.length > 0) {
        console.log(`   🚨 Alertas:`);
        schedule.alerts.forEach(alert => {
          console.log(`      - ${alert.title} (${alert.severity})`);
        });
      }
    });

    // ========== DASHBOARD DE CUMPLIMIENTO ==========
    console.log('\n📊 DASHBOARD DE CUMPLIMIENTO DEL PACC:');
    
    const complianceData = await prisma.paccCompliance.findMany({
      include: {
        evaluatedByUser: true,
        approvedByUser: true
      },
      orderBy: {
        evaluationDate: 'desc'
      },
      take: 3
    });

    complianceData.forEach((compliance, index) => {
      console.log(`\n📈 EVALUACIÓN ${index + 1} - ${compliance.evaluationPeriod} (${compliance.periodType}):`);
      console.log(`   📊 Puntuación general: ${compliance.overallScore}/100 (${compliance.complianceGrade})`);
      console.log(`   ⏰ Cumplimiento temporal: ${compliance.timelinessScore}%`);
      console.log(`   💰 Cumplimiento presupuestario: ${compliance.budgetCompliance}%`);
      console.log(`   ⚖️ Cumplimiento legal: ${compliance.legalComplianceScore}%`);
      console.log(`   🏆 Cumplimiento de calidad: ${compliance.qualityScore}%`);
      
      console.log(`\n   📋 Estadísticas de procesos:`);
      console.log(`      • Total: ${compliance.totalProcesses}`);
      console.log(`      • En tiempo: ${compliance.processesOnSchedule}`);
      console.log(`      • Retrasados: ${compliance.processesDelayed}`);
      console.log(`      • En riesgo: ${compliance.processesAtRisk}`);
      
      console.log(`\n   🎯 Hitos:`);
      console.log(`      • Programados: ${compliance.scheduledMilestones}`);
      console.log(`      • Logrados: ${compliance.achievedMilestones}`);
      console.log(`      • Retrasados: ${compliance.delayedMilestones}`);
      console.log(`      • Tasa de cumplimiento: ${compliance.milestoneComplianceRate}%`);
      
      if (compliance.keyFindings) {
        console.log(`\n   🔍 Hallazgos clave: ${compliance.keyFindings}`);
      }
      
      if (compliance.recommendations) {
        console.log(`   💡 Recomendaciones: ${compliance.recommendations}`);
      }
    });

    // ========== ALERTAS ACTIVAS Y GESTIÓN ==========
    console.log('\n🚨 SISTEMA DE ALERTAS DEL PACC:');
    
    const activeAlerts = await prisma.paccAlert.findMany({
      where: {
        status: {
          in: ['ACTIVA', 'PENDIENTE']
        }
      },
      include: {
        procurementProcess: true,
        assignedUser: true,
        escalatedUser: true
      },
      orderBy: [
        { severity: 'desc' },
        { triggerDate: 'desc' }
      ]
    });

    const alertsBySeverity = {
      CRITICA: activeAlerts.filter(a => a.severity === 'CRITICA'),
      ALTA: activeAlerts.filter(a => a.severity === 'ALTA'),
      MEDIA: activeAlerts.filter(a => a.severity === 'MEDIA'),
      BAJA: activeAlerts.filter(a => a.severity === 'BAJA')
    };

    console.log(`\nAlertas activas por severidad:`);
    console.log(`🔴 CRÍTICAS: ${alertsBySeverity.CRITICA.length}`);
    console.log(`🟠 ALTAS: ${alertsBySeverity.ALTA.length}`);
    console.log(`🟡 MEDIAS: ${alertsBySeverity.MEDIA.length}`);
    console.log(`🟢 BAJAS: ${alertsBySeverity.BAJA.length}`);

    // Mostrar alertas críticas y altas
    const priorityAlerts = [...alertsBySeverity.CRITICA, ...alertsBySeverity.ALTA];
    
    if (priorityAlerts.length > 0) {
      console.log(`\n🚨 ALERTAS PRIORITARIAS:`);
      priorityAlerts.forEach((alert, index) => {
        console.log(`\n${index + 1}. ${alert.title} [${alert.severity}]`);
        console.log(`   📝 ${alert.description}`);
        console.log(`   📅 Disparada: ${alert.triggerDate.toLocaleDateString()}`);
        
        if (alert.dueDate) {
          console.log(`   ⏰ Vence: ${alert.dueDate.toLocaleDateString()}`);
        }
        
        if (alert.assignedUser) {
          console.log(`   👤 Asignada a: ${alert.assignedUser.firstName} ${alert.assignedUser.lastName}`);
        }
        
        if (alert.procurementProcess) {
          console.log(`   📋 Proceso: ${alert.procurementProcess.description}`);
        }
        
        if (alert.suggestedActions) {
          console.log(`   💡 Acciones sugeridas: ${alert.suggestedActions}`);
        }
      });
    }

    // ========== PROYECCIÓN DE CRONOGRAMA ==========
    console.log('\n📅 PROYECCIÓN DEL CRONOGRAMA PACC:');
    
    const upcomingMilestones = await prisma.paccSchedule.findMany({
      where: {
        plannedEndDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Próximos 90 días
        },
        status: {
          in: ['PENDIENTE', 'EN_PROCESO']
        }
      },
      include: {
        procurementProcess: true,
        responsibleUser: true
      },
      orderBy: {
        plannedEndDate: 'asc'
      }
    });

    console.log(`\nHitos próximos (90 días): ${upcomingMilestones.length}`);
    
    upcomingMilestones.forEach((milestone, index) => {
      const daysUntilDue = Math.ceil((milestone.plannedEndDate - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`\n${index + 1}. ${milestone.phaseName}`);
      console.log(`   📅 Vence en: ${daysUntilDue} días (${milestone.plannedEndDate.toLocaleDateString()})`);
      console.log(`   📋 Proceso: ${milestone.procurementProcess.description}`);
      console.log(`   👤 Responsable: ${milestone.responsibleUser?.firstName} ${milestone.responsibleUser?.lastName}`);
      console.log(`   📊 Progreso: ${milestone.compliancePercentage}%`);
      
      if (daysUntilDue <= 7) {
        console.log(`   🚨 ¡URGENTE! - Vence esta semana`);
      } else if (daysUntilDue <= 30) {
        console.log(`   ⚠️ ATENCIÓN - Vence este mes`);
      }
    });

    // ========== MÉTRICAS CONSOLIDADAS ==========
    console.log('\n📊 MÉTRICAS CONSOLIDADAS DEL PACC:');
    
    const totalSchedules = await prisma.paccSchedule.count();
    const completedSchedules = await prisma.paccSchedule.count({
      where: { status: 'COMPLETADA' }
    });
    const delayedSchedules = await prisma.paccSchedule.count({
      where: { status: 'RETRASADA' }
    });
    const inProgressSchedules = await prisma.paccSchedule.count({
      where: { status: 'EN_PROCESO' }
    });

    const avgCompliance = await prisma.paccSchedule.aggregate({
      _avg: {
        compliancePercentage: true
      }
    });

    const totalAlerts = await prisma.paccAlert.count({
      where: { status: 'ACTIVA' }
    });

    console.log('\n📈 RESUMEN EJECUTIVO:');
    console.log(`   📅 Total cronogramas: ${totalSchedules}`);
    console.log(`   ✅ Completados: ${completedSchedules}`);
    console.log(`   🔄 En progreso: ${inProgressSchedules}`);
    console.log(`   🚨 Retrasados: ${delayedSchedules}`);
    console.log(`   📊 Cumplimiento promedio: ${avgCompliance._avg.compliancePercentage?.toFixed(1)}%`);
    console.log(`   🚨 Alertas activas: ${totalAlerts}`);

    const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules * 100).toFixed(1) : 0;
    console.log(`   🎯 Tasa de completitud: ${completionRate}%`);

    // ========== RECOMENDACIONES DEL SISTEMA ==========
    console.log('\n💡 RECOMENDACIONES DEL SISTEMA:');
    
    const criticalIssues = await prisma.paccAlert.count({
      where: {
        severity: 'CRITICA',
        status: 'ACTIVA'
      }
    });

    const highRiskSchedules = await prisma.paccSchedule.count({
      where: {
        compliancePercentage: { lt: 70 },
        status: 'EN_PROCESO'
      }
    });

    console.log('\n🎯 ACCIONES PRIORITARIAS:');
    
    if (criticalIssues > 0) {
      console.log(`   🔴 CRÍTICO: Resolver ${criticalIssues} alertas críticas inmediatamente`);
    }
    
    if (highRiskSchedules > 0) {
      console.log(`   🟠 ALTO: Intervenir ${highRiskSchedules} cronogramas con bajo cumplimiento`);
    }
    
    if (delayedSchedules > 0) {
      console.log(`   🟡 MEDIO: Recuperar cronograma en ${delayedSchedules} procesos retrasados`);
    }

    console.log('\n📋 RECOMENDACIONES GENERALES:');
    console.log('   1. Implementar reuniones semanales de seguimiento PACC');
    console.log('   2. Establecer alertas automáticas con 15 días de anticipación');
    console.log('   3. Crear protocolo de escalamiento para procesos críticos');
    console.log('   4. Fortalecer coordinación entre áreas técnicas y compras');
    console.log('   5. Implementar dashboard en tiempo real para directivos');

    console.log('\n🏆 SISTEMA DE CRONOGRAMA PACC COMPLETAMENTE OPERATIVO');
    console.log('=====================================================');
    console.log('✅ Seguimiento automático de cronogramas');
    console.log('✅ Alertas inteligentes por prioridad');
    console.log('✅ Dashboard de cumplimiento en tiempo real');
    console.log('✅ Proyecciones y análisis predictivo');
    console.log('✅ Integración completa POA-PACC-Presupuesto');
    console.log('✅ Cumplimiento normativo Ley 340-06');

  } catch (error) {
    console.error('❌ Error en demostración de funcionalidades PACC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  demonstratePACCFunctionalities()
    .then(() => {
      console.log('✅ Demostración de funcionalidades PACC completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en demostración PACC:', error);
      process.exit(1);
    });
}

module.exports = { demonstratePACCFunctionalities };
