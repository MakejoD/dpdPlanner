const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingData() {
  try {
    console.log('🔍 Verificando datos existentes...');
    
    // Verificar correlaciones
    const correlations = await prisma.poaPaccBudgetCorrelation.findMany({
      include: {
        activity: true,
        procurementProcess: true,
        budgetAllocation: true
      }
    });

    console.log(`📊 Correlaciones encontradas: ${correlations.length}`);
    
    if (correlations.length > 0) {
      correlations.forEach((corr, index) => {
        console.log(`${index + 1}. Actividad: ${corr.activity?.name || 'N/A'}`);
        console.log(`   Procurement: ${corr.procurementProcess?.description || 'N/A'}`);
        console.log(`   Presupuesto: ${corr.budgetAllocation?.budgetCode || 'N/A'}`);
        console.log(`   Score: ${corr.correlationScore}% - Estado: ${corr.complianceStatus}`);
        console.log('---');
      });
    }

    // Verificar actividades
    const activities = await prisma.activity.count();
    console.log(`🎯 Total de actividades: ${activities}`);

    // Verificar procesos de compra
    const procurements = await prisma.procurementProcess.count();
    console.log(`🛒 Total de procesos PACC: ${procurements}`);

    // Verificar presupuestos
    const budgets = await prisma.budgetAllocation.count();
    console.log(`💰 Total de asignaciones presupuestarias: ${budgets}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error al verificar datos:', error);
    await prisma.$disconnect();
  }
}

checkExistingData();
