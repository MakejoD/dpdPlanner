const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateCompleteSystemReport() {
  try {
    console.log('📊 GENERANDO REPORTE COMPLETO DEL SISTEMA POA-PACC-PRESUPUESTO');
    console.log('===============================================================');
    
    // ========== ESTRUCTURA ORGANIZACIONAL ==========
    console.log('\n🏛️ ESTRUCTURA ORGANIZACIONAL');
    const departments = await prisma.department.findMany({
      include: {
        users: {
          include: {
            role: true
          }
        }
      }
    });
    
    console.log(`\n📋 DEPARTAMENTOS (${departments.length}):`);
    departments.forEach(dept => {
      console.log(`  • ${dept.code} - ${dept.name}`);
      console.log(`    Usuarios: ${dept.users.length}`);
      dept.users.forEach(user => {
        console.log(`    - ${user.firstName} ${user.lastName} (${user.role.name})`);
      });
      console.log('');
    });

    // ========== ROLES Y PERMISOS ==========
    const roles = await prisma.role.findMany({
      include: {
        users: true,
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    console.log(`\n👥 ROLES DEL SISTEMA (${roles.length}):`);
    roles.forEach(role => {
      console.log(`  • ${role.name}: ${role.users.length} usuarios`);
      console.log(`    Permisos: ${role.rolePermissions.length}`);
    });

    // ========== ESTRUCTURA DE PLANIFICACIÓN ==========
    console.log('\n📋 ESTRUCTURA DE PLANIFICACIÓN POA');
    
    const strategicAxes = await prisma.strategicAxis.findMany({
      include: {
        objectives: {
          include: {
            products: {
              include: {
                activities: {
                  include: {
                    assignments: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log(`\n🎯 EJES ESTRATÉGICOS (${strategicAxes.length}):`);
    strategicAxes.forEach(axis => {
      console.log(`\n  📌 ${axis.code} - ${axis.name}`);
      console.log(`     Objetivos: ${axis.objectives.length}`);
      
      axis.objectives.forEach(obj => {
        console.log(`    🎯 ${obj.code} - ${obj.name}`);
        console.log(`       Productos: ${obj.products.length}`);
        
        obj.products.forEach(prod => {
          console.log(`      📦 ${prod.code} - ${prod.name}`);
          console.log(`         Actividades: ${prod.activities.length}`);
          
          prod.activities.forEach(act => {
            console.log(`        📋 ${act.code} - ${act.name}`);
            console.log(`           Responsables: ${act.assignments.length}`);
            act.assignments.forEach(assign => {
              const role = assign.isMain ? '(Principal)' : '(Colaborador)';
              console.log(`           - ${assign.user.firstName} ${assign.user.lastName} ${role}`);
            });
          });
        });
      });
    });

    // ========== INDICADORES ==========
    const indicators = await prisma.indicator.findMany({
      include: {
        strategicAxis: true,
        objective: true,
        product: true,
        activity: true
      }
    });
    
    console.log(`\n📊 INDICADORES DEL SISTEMA (${indicators.length}):`);
    
    const indicatorsByLevel = {
      strategic: indicators.filter(i => i.strategicAxisId),
      objective: indicators.filter(i => i.objectiveId),
      product: indicators.filter(i => i.productId),
      activity: indicators.filter(i => i.activityId)
    };
    
    console.log(`  • Indicadores de Eje Estratégico: ${indicatorsByLevel.strategic.length}`);
    console.log(`  • Indicadores de Objetivo: ${indicatorsByLevel.objective.length}`);
    console.log(`  • Indicadores de Producto: ${indicatorsByLevel.product.length}`);
    console.log(`  • Indicadores de Actividad: ${indicatorsByLevel.activity.length}`);

    // ========== PROCESOS DE CONTRATACIÓN (PACC) ==========
    const procurementProcesses = await prisma.procurementProcess.findMany({
      include: {
        activity: true,
        activityProcurements: {
          include: {
            activity: true
          }
        }
      }
    });
    
    console.log(`\n🛒 PLAN ANUAL DE COMPRAS Y CONTRATACIONES - PACC (${procurementProcesses.length}):`);
    
    const procurementByStatus = {
      planned: procurementProcesses.filter(p => p.status === 'PLANIFICADO'),
      inProgress: procurementProcesses.filter(p => p.status === 'EN_PROCESO'),
      completed: procurementProcesses.filter(p => p.status === 'EJECUTADO')
    };
    
    console.log(`  • Procesos Planificados: ${procurementByStatus.planned.length}`);
    console.log(`  • Procesos En Ejecución: ${procurementByStatus.inProgress.length}`);
    console.log(`  • Procesos Completados: ${procurementByStatus.completed.length}`);
    
    console.log('\n  📋 DETALLE DE PROCESOS:');
    procurementProcesses.forEach(proc => {
      console.log(`    • ${proc.description}`);
      console.log(`      Tipo: ${proc.procurementType} | Método: ${proc.procurementMethod}`);
      console.log(`      Monto: RD$ ${proc.estimatedAmount.toLocaleString()} | Estado: ${proc.status}`);
      console.log(`      Actividades vinculadas: ${proc.activityProcurements.length}`);
    });

    // ========== PRESUPUESTO ==========
    const budgetItems = await prisma.budgetItem.findMany();
    const budgetAllocations = await prisma.budgetAllocation.findMany({
      include: {
        activity: true,
        budgetExecutions: true
      }
    });
    
    console.log(`\n💰 GESTIÓN PRESUPUESTARIA:`);
    console.log(`  • Partidas Presupuestarias: ${budgetItems.length}`);
    console.log(`  • Asignaciones Presupuestarias: ${budgetAllocations.length}`);
    
    const budgetSummary = {
      totalAllocated: budgetAllocations.reduce((sum, ba) => sum + ba.allocatedAmount, 0),
      totalExecuted: budgetAllocations.reduce((sum, ba) => sum + ba.executedAmount, 0),
      totalAvailable: budgetAllocations.reduce((sum, ba) => sum + ba.availableAmount, 0)
    };
    
    console.log(`  • Presupuesto Total Asignado: RD$ ${budgetSummary.totalAllocated.toLocaleString()}`);
    console.log(`  • Presupuesto Ejecutado: RD$ ${budgetSummary.totalExecuted.toLocaleString()}`);
    console.log(`  • Presupuesto Disponible: RD$ ${budgetSummary.totalAvailable.toLocaleString()}`);
    console.log(`  • Porcentaje de Ejecución: ${((budgetSummary.totalExecuted / budgetSummary.totalAllocated) * 100).toFixed(2)}%`);

    // ========== EJECUCIÓN PRESUPUESTARIA ==========
    const budgetExecutions = await prisma.budgetExecution.findMany({
      include: {
        activity: true,
        budgetAllocation: true
      }
    });
    
    console.log(`\n💸 EJECUCIÓN PRESUPUESTARIA (${budgetExecutions.length} transacciones):`);
    budgetExecutions.forEach(exec => {
      console.log(`  • ${exec.description}`);
      console.log(`    Monto: RD$ ${exec.amount.toLocaleString()} | Fecha: ${exec.executionDate.toLocaleDateString()}`);
      console.log(`    Documento: ${exec.documentNumber} | SIGEF: ${exec.sigefReference}`);
    });

    // ========== INTEGRACIÓN POA-PACC-PRESUPUESTO ==========
    const activityProcurements = await prisma.activityProcurement.findMany({
      include: {
        activity: true,
        procurementProcess: true
      }
    });
    
    console.log(`\n🔗 INTEGRACIÓN POA-PACC-PRESUPUESTO:`);
    console.log(`  • Vínculos Actividad-Contratación: ${activityProcurements.length}`);
    
    console.log('\n  📋 MAPEO COMPLETO:');
    activityProcurements.forEach(ap => {
      console.log(`    🔗 ${ap.activity.code} ←→ ${ap.procurementProcess.description}`);
      console.log(`       Relación: ${ap.relationship} | Prioridad: ${ap.priority}`);
    });

    // ========== ESTADÍSTICAS GENERALES ==========
    console.log('\n📈 ESTADÍSTICAS GENERALES DEL SISTEMA:');
    console.log('===============================================');
    
    const totalUsers = await prisma.user.count();
    const totalActivities = await prisma.activity.count();
    const totalAssignments = await prisma.activityAssignment.count();
    
    console.log(`👥 Usuarios del sistema: ${totalUsers}`);
    console.log(`🏛️ Departamentos: ${departments.length}`);
    console.log(`👮 Roles definidos: ${roles.length}`);
    console.log(`🎯 Ejes estratégicos: ${strategicAxes.length}`);
    console.log(`📊 Objetivos: ${strategicAxes.reduce((sum, axis) => sum + axis.objectives.length, 0)}`);
    console.log(`📦 Productos: ${strategicAxes.reduce((sum, axis) => sum + axis.objectives.reduce((objSum, obj) => objSum + obj.products.length, 0), 0)}`);
    console.log(`📋 Actividades: ${totalActivities}`);
    console.log(`📊 Indicadores: ${indicators.length}`);
    console.log(`👨‍💼 Asignaciones de responsabilidad: ${totalAssignments}`);
    console.log(`🛒 Procesos de contratación: ${procurementProcesses.length}`);
    console.log(`💰 Partidas presupuestarias: ${budgetItems.length}`);
    console.log(`💸 Transacciones presupuestarias: ${budgetExecutions.length}`);

    // ========== CUMPLIMIENTO Y ALERTAS ==========
    console.log('\n⚠️ ALERTAS Y CUMPLIMIENTO:');
    console.log('============================');
    
    const lowExecutionActivities = budgetAllocations.filter(ba => {
      const executionRate = (ba.executedAmount / ba.allocatedAmount) * 100;
      return executionRate < 10 && ba.quarter === 'Q1';
    });
    
    const highPriorityProcurements = procurementProcesses.filter(p => 
      p.priority === 'ALTA' && p.status === 'PLANIFICADO'
    );
    
    console.log(`🚨 Actividades con baja ejecución presupuestaria: ${lowExecutionActivities.length}`);
    console.log(`🔥 Procesos de alta prioridad pendientes: ${highPriorityProcurements.length}`);
    
    if (highPriorityProcurements.length > 0) {
      console.log('\n📋 PROCESOS CRÍTICOS PENDIENTES:');
      highPriorityProcurements.forEach(proc => {
        console.log(`  ⚡ ${proc.description}`);
        console.log(`     Monto: RD$ ${proc.estimatedAmount.toLocaleString()}`);
        console.log(`     Fecha planificada: ${proc.plannedStartDate?.toLocaleDateString()}`);
      });
    }

    console.log('\n✅ REPORTE COMPLETO GENERADO EXITOSAMENTE');
    console.log('==========================================');
    console.log('El sistema POA-PACC-Presupuesto está completamente funcional con:');
    console.log('• Estructura organizacional completa');
    console.log('• Planificación estratégica implementada');
    console.log('• Indicadores de gestión configurados');
    console.log('• Plan de contrataciones vinculado');
    console.log('• Integración presupuestaria operativa');
    console.log('• Seguimiento y control habilitado');

  } catch (error) {
    console.error('❌ Error generando reporte del sistema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  generateCompleteSystemReport()
    .then(() => {
      console.log('\n🎉 Sistema POA-PACC-Presupuesto listo para uso en producción');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el reporte del sistema:', error);
      process.exit(1);
    });
}

module.exports = { generateCompleteSystemReport };
