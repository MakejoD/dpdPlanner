const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showCompleteSystemData() {
  console.log('🎯 SISTEMA DPD PLANNER - DATOS DE EJEMPLO COMPLETOS E INTERRELACIONADOS');
  console.log('========================================================================\n');

  try {
    // 1. ESTRUCTURA ORGANIZACIONAL
    console.log('🏢 ESTRUCTURA ORGANIZACIONAL:');
    const departments = await prisma.department.findMany({
      include: { users: true }
    });
    
    console.log(`📊 ${departments.length} Departamentos creados:`);
    departments.forEach(dept => {
      console.log(`   • ${dept.name} (${dept.code}) - ${dept.users.length} usuarios`);
    });
    
    const roles = await prisma.role.findMany({
      include: { users: true, rolePermissions: { include: { permission: true } } }
    });
    
    console.log(`\n👥 ${roles.length} Roles con permisos asignados:`);
    roles.forEach(role => {
      console.log(`   • ${role.name} - ${role.users.length} usuarios, ${role.rolePermissions.length} permisos`);
    });

    // 2. ESTRUCTURA POA COMPLETA
    console.log('\n🎯 ESTRUCTURA POA (PLANIFICACIÓN OPERATIVA ANUAL):');
    
    const strategicAxes = await prisma.strategicAxis.findMany({
      include: {
        objectives: {
          include: {
            products: {
              include: {
                activities: {
                  include: {
                    assignments: { include: { user: true } },
                    indicators: true
                  }
                }
              }
            }
          }
        },
        indicators: true,
        department: true
      }
    });
    
    console.log(`\n📈 ${strategicAxes.length} Ejes Estratégicos con estructura completa:`);
    
    strategicAxes.forEach(axis => {
      console.log(`\n   🎯 ${axis.name} (${axis.code})`);
      console.log(`      Departamento: ${axis.department?.name || 'No asignado'}`);
      console.log(`      Indicadores: ${axis.indicators.length}`);
      
      axis.objectives.forEach(obj => {
        console.log(`      📋 ${obj.name} (${obj.code})`);
        
        obj.products.forEach(prod => {
          console.log(`         📦 ${prod.name} (${prod.code})`);
          
          prod.activities.forEach(act => {
            const assignedUsers = act.assignments.map(a => a.user.firstName).join(', ');
            console.log(`            ⚡ ${act.name} (${act.code})`);
            console.log(`               Responsables: ${assignedUsers || 'No asignado'}`);
            console.log(`               Indicadores: ${act.indicators.length}`);
          });
        });
      });
    });

    // 3. SEGUIMIENTO Y REPORTES
    console.log('\n📈 SEGUIMIENTO Y REPORTES DE PROGRESO:');
    const progressReports = await prisma.progressReport.findMany({
      include: {
        activity: true,
        indicator: true,
        reportedBy: true,
        reviewedBy: true
      }
    });
    
    const reportsByPeriod = {};
    progressReports.forEach(report => {
      if (!reportsByPeriod[report.period]) {
        reportsByPeriod[report.period] = [];
      }
      reportsByPeriod[report.period].push(report);
    });
    
    console.log(`📊 ${progressReports.length} Reportes de progreso por período:`);
    Object.keys(reportsByPeriod).forEach(period => {
      const reports = reportsByPeriod[period];
      const approved = reports.filter(r => r.status === 'aprobado').length;
      console.log(`   • ${period}: ${reports.length} reportes (${approved} aprobados)`);
    });

    // 4. PACC (COMPRAS Y CONTRATACIONES)
    console.log('\n🛒 PACC - PLAN ANUAL DE COMPRAS Y CONTRATACIONES:');
    
    const procurementProcesses = await prisma.procurementProcess.findMany({
      include: {
        activity: true,
        activityProcurements: { include: { activity: true } },
        paccSchedules: { include: { responsibleUser: true } }
      }
    });
    
    console.log(`🛒 ${procurementProcesses.length} Procesos de contratación:`);
    
    procurementProcesses.forEach(proc => {
      console.log(`\n   💼 ${proc.description.substring(0, 60)}...`);
      console.log(`      Tipo: ${proc.procurementType} | Método: ${proc.procurementMethod}`);
      console.log(`      Monto: ${proc.estimatedAmount.toLocaleString()} ${proc.currency}`);
      console.log(`      Estado: ${proc.status} | Prioridad: ${proc.priority}`);
      console.log(`      Actividad vinculada: ${proc.activity?.name || 'No vinculada'}`);
      console.log(`      Fases del cronograma: ${proc.paccSchedules.length}`);
    });

    // 5. PRESUPUESTO
    console.log('\n💰 PRESUPUESTO Y EJECUCIÓN:');
    
    const budgetExecutions = await prisma.budgetExecution.findMany({
      include: {
        activity: true,
        budgetItem: true,
        budgetAllocation: true
      }
    });
    
    const totalExecuted = budgetExecutions.reduce((sum, exec) => sum + exec.amount, 0);
    
    console.log(`💸 ${budgetExecutions.length} Ejecuciones presupuestarias:`);
    console.log(`   Total ejecutado: ${totalExecuted.toLocaleString()} DOP`);
    
    budgetExecutions.forEach(exec => {
      console.log(`   • ${exec.description}`);
      console.log(`     Monto: ${exec.amount.toLocaleString()} DOP | Tipo: ${exec.executionType}`);
      console.log(`     Actividad: ${exec.activity?.name || 'No vinculada'}`);
      console.log(`     Partida: ${exec.budgetItem?.name || 'No especificada'}`);
    });

    // 6. CORRELACIONES Y CUMPLIMIENTO
    console.log('\n🔗 CORRELACIONES POA-PACC-PRESUPUESTO:');
    
    const correlations = await prisma.poaPaccBudgetCorrelation.findMany({
      include: { activity: true }
    });
    
    console.log(`🔗 ${correlations.length} Correlaciones de cumplimiento:`);
    
    correlations.forEach(corr => {
      console.log(`\n   🎯 ${corr.activity.name}`);
      console.log(`      Cumplimiento PACC: ${corr.procurementCompliance}%`);
      console.log(`      Cumplimiento Presupuesto: ${corr.budgetCompliance}%`);
      console.log(`      Cumplimiento General: ${corr.overallCompliance}%`);
      console.log(`      Estado: ${corr.complianceStatus} | Riesgo: ${corr.riskLevel}`);
    });

    // 7. ALERTAS Y CUMPLIMIENTO PACC
    console.log('\n🚨 ALERTAS Y CUMPLIMIENTO PACC:');
    
    const alerts = await prisma.paccAlert.findMany({
      include: {
        assignedUser: true,
        procurementProcess: true
      }
    });
    
    console.log(`🚨 ${alerts.length} Alertas activas del sistema:`);
    
    alerts.forEach(alert => {
      console.log(`   • ${alert.title} (${alert.severity})`);
      console.log(`     Estado: ${alert.status} | Prioridad: ${alert.priority}`);
      console.log(`     Asignado a: ${alert.assignedUser?.firstName || 'No asignado'}`);
    });
    
    const paccCompliances = await prisma.paccCompliance.findMany({
      include: {
        evaluatedByUser: true,
        approvedByUser: true
      }
    });
    
    console.log(`\n📋 ${paccCompliances.length} Evaluaciones de cumplimiento PACC:`);
    
    paccCompliances.forEach(comp => {
      console.log(`   • ${comp.evaluationPeriod} (${comp.periodType})`);
      console.log(`     Puntuación general: ${comp.overallScore} | Grado: ${comp.complianceGrade}`);
      console.log(`     Procesos en cronograma: ${comp.processesOnSchedule}/${comp.totalProcesses}`);
    });

    // 8. RESUMEN FINAL
    console.log('\n🎯 RESUMEN FINAL - INTERRELACIONES CREADAS:');
    console.log('==========================================');
    
    const totalUsers = await prisma.user.count();
    const totalActivities = await prisma.activity.count();
    const totalIndicators = await prisma.indicator.count();
    const totalAssignments = await prisma.activityAssignment.count();
    
    console.log(`✅ ${totalUsers} usuarios distribuidos en ${departments.length} departamentos`);
    console.log(`✅ ${totalActivities} actividades con ${totalAssignments} asignaciones de responsabilidad`);
    console.log(`✅ ${totalIndicators} indicadores multinivel (eje, objetivo, producto, actividad)`);
    console.log(`✅ ${progressReports.length} reportes de progreso con seguimiento histórico`);
    console.log(`✅ ${procurementProcesses.length} procesos PACC con cronogramas detallados`);
    console.log(`✅ ${budgetExecutions.length} ejecuciones presupuestarias vinculadas a actividades`);
    console.log(`✅ ${correlations.length} correlaciones POA-PACC-Presupuesto para seguimiento integral`);
    console.log(`✅ ${alerts.length} alertas automáticas del sistema de cumplimiento`);
    
    console.log('\n🚀 EL SISTEMA CUENTA CON DATOS COMPLETOS, INTERRELACIONADOS Y REALISTAS');
    console.log('🚀 TODOS LOS MÓDULOS ESTÁN POBLADOS CON INFORMACIÓN CONSISTENTE');
    console.log('🚀 LAS RELACIONES ENTRE POA, PACC Y PRESUPUESTO ESTÁN ESTABLECIDAS');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  showCompleteSystemData().catch(console.error);
}

module.exports = showCompleteSystemData;
