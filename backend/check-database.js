const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // Verificar asignaciones presupuestarias
    const budgetCount = await prisma.budgetAllocation.count();
    console.log(`📊 Total de asignaciones presupuestarias: ${budgetCount}`);
    
    if (budgetCount > 0) {
      const budgets = await prisma.budgetAllocation.findMany({
        take: 3
      });
      
      console.log('📋 Primeras asignaciones:');
      budgets.forEach((budget, index) => {
        console.log(`  ${index + 1}. ${budget.budgetCode} - ${budget.budgetType} - RD$ ${budget.allocatedAmount}`);
      });
    }

    // Verificar ejecuciones
    const executionCount = await prisma.budgetExecution.count();
    console.log(`📊 Total de ejecuciones presupuestarias: ${executionCount}`);

    // Verificar usuarios
    const userCount = await prisma.user.count();
    console.log(`👥 Total de usuarios: ${userCount}`);

    // Verificar actividades
    const activityCount = await prisma.activity.count();
    console.log(`🎯 Total de actividades: ${activityCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error al verificar base de datos:', error);
    await prisma.$disconnect();
  }
}

checkDatabase();
