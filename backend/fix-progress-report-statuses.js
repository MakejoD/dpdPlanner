const { PrismaClient } = require('@prisma/client');

async function fixProgressReportStatuses() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Iniciando corrección de estados de informes...');
    
    // Mapeo de estados incorrectos a correctos
    const statusMapping = {
      'pendiente': 'SUBMITTED',
      'enviado': 'SUBMITTED', 
      'aprobado': 'APPROVED',
      'rechazado': 'REJECTED',
      'borrador': 'DRAFT'
    };
    
    // Obtener todos los informes con estados incorrectos
    const reportsToFix = await prisma.progressReport.findMany({
      where: {
        status: {
          in: Object.keys(statusMapping)
        }
      }
    });
    
    console.log(`📊 Informes encontrados con estados incorrectos: ${reportsToFix.length}`);
    
    if (reportsToFix.length === 0) {
      console.log('✅ No hay informes con estados incorrectos');
      return;
    }
    
    // Corregir cada informe
    for (const report of reportsToFix) {
      const newStatus = statusMapping[report.status];
      
      console.log(`🔄 Corrigiendo informe ${report.id}:`);
      console.log(`   Estado anterior: ${report.status}`);
      console.log(`   Estado nuevo: ${newStatus}`);
      
      await prisma.progressReport.update({
        where: { id: report.id },
        data: { status: newStatus }
      });
      
      // También actualizar el historial de aprobaciones si existe
      const historyRecord = await prisma.reportApprovalHistory.findFirst({
        where: {
          progressReportId: report.id,
          action: report.status // Si el historial tiene el mismo estado incorrecto
        }
      });
      
      if (historyRecord) {
        await prisma.reportApprovalHistory.update({
          where: { id: historyRecord.id },
          data: { action: newStatus }
        });
        console.log(`   ✅ Historial actualizado también`);
      }
    }
    
    console.log('\n🎉 Corrección completada');
    
    // Verificar el resultado
    console.log('\n📈 Estado actual después de la corrección:');
    const allReports = await prisma.progressReport.findMany({
      select: { id: true, status: true }
    });
    
    const statusCounts = {};
    allReports.forEach(report => {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Verificar informes pendientes de aprobación
    const pendingApprovals = allReports.filter(r => r.status === 'SUBMITTED');
    console.log(`\n⏳ Informes pendientes de aprobación: ${pendingApprovals.length}`);
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProgressReportStatuses();
