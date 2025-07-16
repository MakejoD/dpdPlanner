const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const indicators = await prisma.indicator.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        reportingFrequency: true,
        janTarget: true,
        febTarget: true,
        q1Target: true,
        q2Target: true
      }
    });
    
    console.log('📊 Indicadores en BD:');
    indicators.forEach(ind => {
      console.log(`- ${ind.name} (${ind.reportingFrequency})`);
      if (ind.reportingFrequency === 'mensual') {
        console.log(`  Enero: ${ind.janTarget}, Febrero: ${ind.febTarget}`);
      } else {
        console.log(`  Q1: ${ind.q1Target}, Q2: ${ind.q2Target}`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
