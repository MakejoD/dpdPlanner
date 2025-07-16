const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApprovalsData() {
  try {
    console.log('🔍 Probando datos para el módulo de aprobaciones...\n');
    
    // 1. Simular la consulta que hace el endpoint /api/approvals/pending
    const pendingReports = await prisma.progressReport.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        activity: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        indicator: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimetype: true
          }
        }
      },
      orderBy: [
        { createdAt: 'asc' }
      ]
    });
    
    console.log(`📋 REPORTES PENDIENTES (${pendingReports.length}):`);
    pendingReports.forEach((report, index) => {
      console.log(`  ${index + 1}. ID: ${report.id}`);
      console.log(`     Actividad/Indicador: ${report.activity?.name || report.indicator?.name}`);
      console.log(`     Reportado por: ${report.reportedBy.firstName} ${report.reportedBy.lastName}`);
      console.log(`     Período: ${report.period}`);
      console.log(`     Progreso: ${report.currentValue}/${report.targetValue} (${report.executionPercentage}%)`);
      console.log(`     Estado: ${report.status}`);
      console.log(`     Adjuntos: ${report.attachments.length}`);
      console.log(`---`);
    });
    
    // 2. Simular estructura de respuesta del endpoint
    const apiResponse = {
      success: true,
      data: {
        reports: pendingReports,
        pagination: {
          page: 1,
          limit: 20,
          total: pendingReports.length,
          pages: 1
        }
      },
      message: `${pendingReports.length} reportes pendientes de aprobación`
    };
    
    console.log('\n📄 ESTRUCTURA DE RESPUESTA API:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // 3. Verificar estadísticas
    const stats = await Promise.all([
      prisma.progressReport.count({ where: { status: 'SUBMITTED' } }),
      prisma.progressReport.count({ where: { status: 'APPROVED' } }),
      prisma.progressReport.count({ where: { status: 'REJECTED' } }),
      prisma.progressReport.count()
    ]);
    
    const [pending, approved, rejected, total] = stats;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`  Pendientes: ${pending}`);
    console.log(`  Aprobados: ${approved}`);
    console.log(`  Rechazados: ${rejected}`);
    console.log(`  Total: ${total}`);
    console.log(`  Tasa de aprobación: ${approvalRate}%`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApprovalsData();
