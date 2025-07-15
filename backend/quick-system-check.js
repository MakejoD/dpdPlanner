const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickCheck() {
  try {
    console.log('🔍 Verificación rápida del sistema...');
    
    // Contar usuarios
    const userCount = await prisma.user.count();
    console.log(`👥 Usuarios activos: ${userCount}`);
    
    // Contar informes
    const reportCount = await prisma.progressReport.count();
    console.log(`📊 Informes de progreso: ${reportCount}`);
    
    if (reportCount > 0) {
      // Obtener un informe ejemplo con todas las relaciones
      const sampleReport = await prisma.progressReport.findFirst({
        include: {
          activity: {
            include: {
              product: true
            }
          },
          indicator: true,
          reportedBy: {
            include: {
              department: true
            }
          }
        }
      });
      
      console.log('📋 Informe de ejemplo:');
      console.log('  ID:', sampleReport.id);
      console.log('  Elemento:', sampleReport.activity?.name || sampleReport.indicator?.name);
      console.log('  Estado:', sampleReport.status);
      console.log('  Reportado por:', sampleReport.reportedBy.firstName, sampleReport.reportedBy.lastName);
      console.log('  Progreso:', sampleReport.currentValue, '/', sampleReport.targetValue, `(${sampleReport.executionPercentage}%)`);
    }
    
    console.log('✅ Sistema funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
