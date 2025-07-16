const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReports() {
  try {
    console.log('🔍 Verificando reportes en base de datos...');
    
    // Contar reportes por estado
    const reportsByStatus = await prisma.progressReport.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('📊 Reportes por estado:');
    reportsByStatus.forEach(group => {
      console.log(`  ${group.status}: ${group._count} reportes`);
    });
    
    // Mostrar reportes SUBMITTED con detalles
    const submittedReports = await prisma.progressReport.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        reportedBy: { select: { firstName: true, lastName: true } },
        activity: { select: { name: true } },
        indicator: { select: { name: true } }
      }
    });
    
    console.log(`\n📋 Reportes SUBMITTED (${submittedReports.length}):`);
    submittedReports.forEach(report => {
      console.log(`  - ID: ${report.id}`);
      console.log(`    Actividad/Indicador: ${report.activity?.name || report.indicator?.name}`);
      console.log(`    Reportado por: ${report.reportedBy.firstName} ${report.reportedBy.lastName}`);
      console.log(`    Período: ${report.period}`);
      console.log(`    Enviado: ${report.submittedAt}`);
      console.log('---');
    });
    
    // Verificar usuarios con permisos de aprobación
    const usersWithApprovalPermissions = await prisma.user.findMany({
      where: {
        userPermissions: {
          some: {
            permission: {
              action: 'approve',
              resource: 'progress-report'
            }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: { select: { name: true } },
        department: { select: { name: true } }
      }
    });
    
    console.log(`\n👥 Usuarios con permisos de aprobación (${usersWithApprovalPermissions.length}):`);
    usersWithApprovalPermissions.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.role.name}) - ${user.department?.name || 'Sin departamento'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReports();
