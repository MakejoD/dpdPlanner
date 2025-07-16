const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testIndicator() {
  try {
    // Obtener un eje estratégico existente
    const strategicAxis = await prisma.strategicAxis.findFirst();
    
    if (!strategicAxis) {
      console.log('❌ No hay ejes estratégicos disponibles');
      return;
    }
    
    const indicator = await prisma.indicator.create({
      data: {
        name: 'Indicador Mensual de Prueba',
        description: 'Indicador para probar la funcionalidad mensual',
        type: 'PRODUCT',
        measurementUnit: 'Unidades',
        baseline: 0,
        annualTarget: 120,
        reportingFrequency: 'mensual',
        // Metas mensuales
        janTarget: 10,
        febTarget: 10,
        marTarget: 10,
        aprTarget: 10,
        mayTarget: 10,
        junTarget: 10,
        julTarget: 10,
        augTarget: 10,
        sepTarget: 10,
        octTarget: 10,
        novTarget: 10,
        decTarget: 10,
        strategicAxisId: strategicAxis.id
      }
    });
    
    console.log('✅ Indicador mensual creado:', indicator.name);
    console.log('📊 Periodicidad:', indicator.reportingFrequency);
    console.log('📅 Meta Enero:', indicator.janTarget);
    console.log('📅 Meta Febrero:', indicator.febTarget);
    console.log('📅 Meta Total Anual:', indicator.annualTarget);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testIndicator();
