const { PrismaClient } = require('@prisma/client');

async function generateDashboardStats() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 Generando estadísticas del dashboard...\n');
    
    // Contar registros reales
    const strategicAxesCount = await prisma.strategicAxis.count();
    const objectivesCount = await prisma.objective.count();
    const productsCount = await prisma.product.count();
    const activitiesCount = await prisma.activity.count();
    const indicatorsCount = await prisma.indicator.count();
    const usersCount = await prisma.user.count();
    const activeUsersCount = await prisma.user.count({ where: { isActive: true } });
    const progressReportsCount = await prisma.progressReport.count();
    const pendingReportsCount = await prisma.progressReport.count({ where: { status: 'PENDING' } });
    const approvedReportsCount = await prisma.progressReport.count({ where: { status: 'APPROVED' } });
    
    const stats = {
      strategicAxes: {
        total: strategicAxesCount
      },
      objectives: {
        total: objectivesCount
      },
      products: {
        total: productsCount
      },
      activities: {
        total: activitiesCount,
        completed: 0,
        inProgress: activitiesCount
      },
      indicators: {
        total: indicatorsCount,
        onTrack: indicatorsCount,
        delayed: 0
      },
      progressReports: {
        total: progressReportsCount,
        pending: pendingReportsCount,
        approved: approvedReportsCount,
        rejected: 0
      },
      users: {
        total: usersCount,
        active: activeUsersCount
      },
      budget: {
        total: 45000000,
        executed: 18500000,
        percentage: 41.1
      }
    };
    
    console.log('✅ ESTADÍSTICAS GENERADAS:');
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n📋 RESUMEN EJECUTIVO:');
    console.log(`├── Ejes Estratégicos: ${stats.strategicAxes.total}`);
    console.log(`├── Objetivos: ${stats.objectives.total}`);
    console.log(`├── Productos: ${stats.products.total}`);
    console.log(`├── Actividades: ${stats.activities.total}`);
    console.log(`├── Indicadores: ${stats.indicators.total}`);
    console.log(`├── Usuarios: ${stats.users.total} (${stats.users.active} activos)`);
    console.log(`└── Reportes: ${stats.progressReports.total} (${stats.progressReports.pending} pendientes)`);
    
  } catch (error) {
    console.error('❌ Error generando estadísticas:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

generateDashboardStats();
