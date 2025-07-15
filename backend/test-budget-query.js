const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBudgetQuery() {
  try {
    console.log('🔍 Probando consulta de presupuesto...');
    
    // Consulta simple sin includes
    console.log('1. Consulta simple sin includes:');
    const simple = await prisma.budgetAllocation.findMany({
      where: { fiscalYear: 2024 }
    });
    console.log(`   ✅ Encontradas: ${simple.length} asignaciones`);

    // Consulta con includes opcionales
    console.log('2. Consulta con includes opcionales:');
    const withIncludes = await prisma.budgetAllocation.findMany({
      where: { fiscalYear: 2024 },
      include: {
        activity: true,
        procurementProcess: true,
        budgetExecutions: true
      }
    });
    console.log(`   ✅ Con includes: ${withIncludes.length} asignaciones`);

    // Mostrar datos de la primera asignación
    if (withIncludes.length > 0) {
      const first = withIncludes[0];
      console.log('3. Datos de la primera asignación:');
      console.log(`   - Código: ${first.budgetCode}`);
      console.log(`   - Tipo: ${first.budgetType}`);
      console.log(`   - Asignado: RD$ ${first.allocatedAmount}`);
      console.log(`   - Actividad: ${first.activity ? first.activity.name : 'Sin actividad'}`);
      console.log(`   - Ejecuciones: ${first.budgetExecutions.length}`);
    }

    await prisma.$disconnect();
    console.log('✅ Test completado');
  } catch (error) {
    console.error('❌ Error en consulta:', error);
    await prisma.$disconnect();
  }
}

testBudgetQuery();
