const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyProgressReportsQuick() {
  try {
    const count = await prisma.progressReport.count();
    console.log(`📊 Total informes en BD: ${count}`);
    
    if (count > 0) {
      const sample = await prisma.progressReport.findMany({
        take: 3,
        include: {
          activity: { select: { name: true } },
          indicator: { select: { name: true } },
          reportedBy: { select: { firstName: true, lastName: true } }
        }
      });
      
      console.log('📋 Ejemplos:');
      sample.forEach((r, i) => {
        console.log(`${i+1}. ${r.activity?.name || r.indicator?.name} - ${r.status}`);
      });
    }
  } catch (error) {
    console.error('❌', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProgressReportsQuick();
