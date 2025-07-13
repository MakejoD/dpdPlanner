const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgressQuery() {
  try {
    console.log('🔍 Probando consulta de reportes de progreso...');
    
    const reports = await prisma.progressReport.findMany({
      where: {},
      include: {
        activity: {
          include: {
            product: {
              include: {
                objective: {
                  include: {
                    strategicAxis: true
                  }
                }
              }
            }
          }
        },
        indicator: true,
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        attachments: true
      },
      take: 5
    });

    console.log(`✅ Consulta exitosa. Encontrados ${reports.length} reportes`);
    if (reports.length > 0) {
      console.log('📋 Primer reporte:', JSON.stringify(reports[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error en consulta:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testProgressQuery();
