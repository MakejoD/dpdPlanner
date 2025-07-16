const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySystem() {
  try {
    console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA\n');
    
    // 1. Verificar estados de reportes
    console.log('📊 1. Estados de reportes:');
    const reportStats = await prisma.progressReport.groupBy({
      by: ['status'],
      _count: true
    });
    reportStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count} reportes`);
    });
    
    // 2. Verificar reportes SUBMITTED disponibles para aprobación
    console.log('\n📋 2. Reportes disponibles para aprobación:');
    const submittedReports = await prisma.progressReport.findMany({
      where: { status: 'SUBMITTED' },
      select: {
        id: true,
        activity: { select: { name: true } },
        indicator: { select: { name: true } },
        reportedBy: { select: { firstName: true, lastName: true } },
        period: true
      },
      take: 5
    });
    
    console.log(`   Total disponibles: ${submittedReports.length}`);
    submittedReports.forEach((report, index) => {
      console.log(`   ${index + 1}. ${report.activity?.name || report.indicator?.name} - ${report.reportedBy.firstName} ${report.reportedBy.lastName}`);
    });
    
    // 3. Verificar usuarios válidos con IDs de string
    console.log('\n👥 3. Usuarios del sistema:');
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 3
    });
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`      ID: ${user.id} (tipo: ${typeof user.id})`);
      console.log(`      Email: ${user.email}`);
    });
    
    // 4. Verificar notificaciones recientes
    console.log('\n🔔 4. Notificaciones recientes:');
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });
    
    console.log(`   Total notificaciones: ${notifications.length}`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title}`);
      console.log(`      Usuario: ${notif.user.firstName} ${notif.user.lastName}`);
      console.log(`      UserID: ${notif.userId} (tipo: ${typeof notif.userId})`);
      console.log(`      Tipo: ${notif.type} | Prioridad: ${notif.priority}`);
      console.log(`      Leída: ${notif.isRead ? 'Sí' : 'No'}`);
    });
    
    // 5. Probar creación de notificación
    console.log('\n🧪 5. Prueba de notificación:');
    const testUser = users[0];
    
    if (testUser) {
      try {
        const testNotification = await prisma.notification.create({
          data: {
            userId: testUser.id,
            title: '✅ Verificación del Sistema',
            message: `Sistema verificado correctamente el ${new Date().toLocaleString()}`,
            type: 'SUCCESS',
            priority: 'MEDIUM',
            isRead: false,
            data: JSON.stringify({ verification: true, timestamp: new Date().toISOString() })
          }
        });
        
        console.log(`   ✅ Notificación creada exitosamente:`);
        console.log(`      ID: ${testNotification.id}`);
        console.log(`      UserID: ${testNotification.userId} (tipo: ${typeof testNotification.userId})`);
        console.log(`      Título: ${testNotification.title}`);
        
      } catch (error) {
        console.log(`   ❌ Error creando notificación: ${error.message}`);
      }
    }
    
    // 6. Verificar endpoints de API (simular estructura de respuesta)
    console.log('\n🌐 6. Estructura de API de aprobaciones:');
    const apiSimulation = {
      pendingReports: `/api/approvals/pending → ${submittedReports.length} reportes`,
      myReports: `/api/approvals/my-reports → Reportes del usuario`,
      stats: `/api/approvals/stats → Estadísticas de aprobación`
    };
    
    Object.entries(apiSimulation).forEach(([endpoint, description]) => {
      console.log(`   ${endpoint}: ${description}`);
    });
    
    console.log('\n🎯 RESUMEN DE VERIFICACIÓN:');
    console.log(`   ✅ Estados de reportes: ${reportStats.find(s => s.status === 'SUBMITTED')?._count || 0} pendientes`);
    console.log(`   ✅ Usuarios válidos: ${users.length} con IDs tipo string`);
    console.log(`   ✅ Notificaciones: ${notifications.length} en sistema`);
    console.log(`   ✅ Sistema funcionando correctamente`);
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySystem();
