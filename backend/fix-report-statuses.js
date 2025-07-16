const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixReportStatuses() {
  try {
    console.log('🔧 Actualizando estados de reportes...');
    
    // 1. Mostrar estados actuales
    const currentStatuses = await prisma.progressReport.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('📊 Estados actuales:');
    currentStatuses.forEach(group => {
      console.log(`  ${group.status}: ${group._count} reportes`);
    });
    
    // 2. Actualizar reportes 'pendiente' a 'SUBMITTED'
    const updatePendingResult = await prisma.progressReport.updateMany({
      where: { status: 'pendiente' },
      data: { 
        status: 'SUBMITTED'
      }
    });
    
    console.log(`\n✅ Actualizados ${updatePendingResult.count} reportes de 'pendiente' a 'SUBMITTED'`);
    
    // 3. Actualizar reportes 'aprobado' a 'APPROVED'
    const updateApprovedResult = await prisma.progressReport.updateMany({
      where: { status: 'aprobado' },
      data: { status: 'APPROVED' }
    });
    
    console.log(`✅ Actualizados ${updateApprovedResult.count} reportes de 'aprobado' a 'APPROVED'`);
    
    // 4. Actualizar reportes 'rechazado' a 'REJECTED'
    const updateRejectedResult = await prisma.progressReport.updateMany({
      where: { status: 'rechazado' },
      data: { status: 'REJECTED' }
    });
    
    console.log(`✅ Actualizados ${updateRejectedResult.count} reportes de 'rechazado' a 'REJECTED'`);
    
    // 5. Mostrar estados finales
    const finalStatuses = await prisma.progressReport.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('\n📊 Estados finales:');
    finalStatuses.forEach(group => {
      console.log(`  ${group.status}: ${group._count} reportes`);
    });
    
    // 6. Verificar reportes SUBMITTED para aprobaciones
    const submittedReports = await prisma.progressReport.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        reportedBy: { select: { firstName: true, lastName: true } },
        activity: { select: { name: true } },
        indicator: { select: { name: true } }
      }
    });
    
    console.log(`\n🎯 Reportes disponibles para aprobación (${submittedReports.length}):`);
    submittedReports.forEach(report => {
      console.log(`  - ${report.activity?.name || report.indicator?.name} (${report.reportedBy.firstName} ${report.reportedBy.lastName})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixReportStatuses();
