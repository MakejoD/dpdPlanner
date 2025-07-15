const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardLogic() {
  try {
    console.log('🧪 Probando la lógica del dashboard directamente...\n');

    // Probar cada query individualmente
    console.log('📊 Contando actividades...');
    const activitiesCount = await prisma.activity.count();
    console.log('   ✅ Actividades:', activitiesCount);

    console.log('📊 Contando indicadores...');
    const indicatorsCount = await prisma.indicator.count();
    console.log('   ✅ Indicadores:', indicatorsCount);

    console.log('📊 Contando reportes de progreso...');
    const progressReportsCount = await prisma.progressReport.count();
    console.log('   ✅ Reportes:', progressReportsCount);

    console.log('📊 Contando usuarios...');
    const usersCount = await prisma.user.count();
    console.log('   ✅ Usuarios:', usersCount);

    console.log('📊 Contando usuarios activos...');
    const activeUsersCount = await prisma.user.count({ where: { isActive: true } });
    console.log('   ✅ Usuarios activos:', activeUsersCount);

    console.log('📊 Contando ejes estratégicos...');
    const strategicAxesCount = await prisma.strategicAxis.count();
    console.log('   ✅ Ejes estratégicos:', strategicAxesCount);

    console.log('📊 Contando objetivos...');
    const objectivesCount = await prisma.objective.count();
    console.log('   ✅ Objetivos:', objectivesCount);

    console.log('📊 Contando productos...');
    const productsCount = await prisma.product.count();
    console.log('   ✅ Productos:', productsCount);

    // Probar consultas con filtros
    console.log('📊 Contando actividades completadas...');
    const activitiesCompleted = await prisma.activity.count({
      where: { status: 'COMPLETED' }
    });
    console.log('   ✅ Actividades completadas:', activitiesCompleted);

    console.log('📊 Contando actividades en progreso...');
    const activitiesInProgress = await prisma.activity.count({
      where: { status: 'IN_PROGRESS' }
    });
    console.log('   ✅ Actividades en progreso:', activitiesInProgress);

    console.log('📊 Contando reportes aprobados...');
    const reportsApproved = await prisma.progressReport.count({
      where: { status: 'APPROVED' }
    });
    console.log('   ✅ Reportes aprobados:', reportsApproved);

    console.log('📊 Contando reportes pendientes...');
    const reportsPending = await prisma.progressReport.count({
      where: { status: 'PENDING' }
    });
    console.log('   ✅ Reportes pendientes:', reportsPending);

    // Construir objeto de estadísticas
    const stats = {
      activities: {
        total: activitiesCount,
        completed: activitiesCompleted,
        inProgress: activitiesInProgress
      },
      indicators: {
        total: indicatorsCount,
        onTrack: Math.floor(indicatorsCount * 0.8),
        delayed: Math.floor(indicatorsCount * 0.2)
      },
      progressReports: {
        total: progressReportsCount,
        pending: reportsPending,
        approved: reportsApproved,
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
      },
      strategicAxes: {
        total: strategicAxesCount
      },
      objectives: {
        total: objectivesCount
      },
      products: {
        total: productsCount
      }
    };

    console.log('\n✅ Estadísticas generadas exitosamente:');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('\n❌ Error en la lógica del dashboard:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardLogic();
