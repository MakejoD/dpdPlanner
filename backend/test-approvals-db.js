const { PrismaClient } = require('@prisma/client');

async function testApprovals() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando informes de progreso...');
    
    // Obtener todos los informes
    const allReports = await prisma.progressReport.findMany({
      include: {
        reportedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        activity: {
          select: {
            id: true,
            name: true
          }
        },
        indicator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`📊 Total de informes encontrados: ${allReports.length}`);
    
    if (allReports.length === 0) {
      console.log('❌ No hay informes en la base de datos');
      return;
    }
    
    // Contar por estado
    const statusCounts = {};
    allReports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });
    
    console.log('📈 Informes por estado:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Mostrar informes pendientes
    const pendingReports = allReports.filter(r => r.status === 'SUBMITTED');
    console.log(`⏳ Informes pendientes de aprobación: ${pendingReports.length}`);
    
    if (pendingReports.length > 0) {
      console.log('\n📋 Detalles de informes pendientes:');
      pendingReports.forEach((report, index) => {
        console.log(`${index + 1}. ID: ${report.id}`);
        console.log(`   Periodo: ${report.period} (${report.periodType})`);
        console.log(`   Reportado por: ${report.reportedBy.firstName} ${report.reportedBy.lastName}`);
        console.log(`   Creado: ${report.createdAt}`);
        console.log(`   Estado: ${report.status}`);
        console.log('---');
      });
    }
    
    // Verificar historial de aprobaciones
    const approvalHistory = await prisma.reportApprovalHistory.findMany({
      include: {
        progressReport: true,
        actionBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`📚 Registros en historial de aprobaciones: ${approvalHistory.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApprovals();
