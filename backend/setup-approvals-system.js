const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupApprovalsSystem() {
  try {
    console.log('🔧 Configurando sistema de aprobaciones...');

    // 1. Crear el permiso approve:progress_report si no existe
    console.log('\n📋 Verificando permisos...');
    let approvePermission = await prisma.permission.findFirst({
      where: {
        action: 'approve',
        resource: 'progress_report'
      }
    });

    if (!approvePermission) {
      approvePermission = await prisma.permission.create({
        data: {
          action: 'approve',
          resource: 'progress_report',
          description: 'Aprobar y rechazar informes de avance'
        }
      });
      console.log('✅ Permiso approve:progress_report creado');
    } else {
      console.log('✅ Permiso approve:progress_report ya existe');
    }

    // 2. Asignar permiso al rol admin si no lo tiene
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (adminRole) {
      const existingRolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: adminRole.id,
          permissionId: approvePermission.id
        }
      });

      if (!existingRolePermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: approvePermission.id
          }
        });
        console.log('✅ Permiso asignado al rol admin');
      } else {
        console.log('✅ Rol admin ya tiene el permiso');
      }
    }

    // 3. Verificar reportes existentes
    console.log('\n📊 Verificando informes de progreso...');
    const totalReports = await prisma.progressReport.count();
    console.log(`📈 Total de informes: ${totalReports}`);

    if (totalReports === 0) {
      console.log('⚠️  No hay informes de progreso. Creando ejemplos...');
      
      // Obtener actividades e indicadores
      const activities = await prisma.activity.findMany({ take: 3 });
      const indicators = await prisma.indicator.findMany({ take: 2 });
      const users = await prisma.user.findMany({ take: 2 });

      if (activities.length === 0 || users.length === 0) {
        console.log('⚠️  No hay actividades o usuarios suficientes. Ejecute primero create-complete-example-data-v2.js');
        return;
      }

      // Crear reportes de ejemplo con diferentes estados
      const reportStatuses = ['SUBMITTED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DRAFT'];
      
      for (let i = 0; i < 5; i++) {
        const isActivity = i < 3;
        const targetData = isActivity ? activities[i % activities.length] : indicators[i % indicators.length];
        const user = users[i % users.length];
        
        const reportData = {
          period: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
          currentValue: Math.floor(Math.random() * 80) + 10,
          targetValue: 100,
          executionPercentage: Math.floor(Math.random() * 90) + 10,
          status: reportStatuses[i],
          reportedById: user.id,
          description: `Reporte de ejemplo ${i + 1} - ${isActivity ? 'Actividad' : 'Indicador'}: ${targetData.name}`,
          evidences: `Evidencia ${i + 1}: Documentación y registros del progreso`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        };

        if (isActivity) {
          reportData.activityId = targetData.id;
        } else {
          reportData.indicatorId = targetData.id;
        }

        // Si está aprobado o rechazado, agregar datos de aprobación
        if (reportStatuses[i] === 'SUBMITTED') {
          reportData.submittedAt = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);
        } else if (reportStatuses[i] === 'APPROVED') {
          reportData.submittedAt = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
          reportData.approvedAt = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);
          reportData.approvedById = users[0].id; // Admin aprueba
          reportData.approvalComments = `Reporte aprobado - Progreso satisfactorio en ${targetData.name}`;
        } else if (reportStatuses[i] === 'REJECTED') {
          reportData.submittedAt = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
          reportData.rejectedAt = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);
          reportData.rejectedById = users[0].id; // Admin rechaza
          reportData.rejectionReason = 'Faltan evidencias adicionales y la documentación no está completa. Se requiere más detalle en el progreso reportado.';
        }

        await prisma.progressReport.create({ data: reportData });
      }

      console.log('✅ 5 reportes de ejemplo creados con diferentes estados');
    }

    // 4. Mostrar estadísticas actuales
    console.log('\n📊 Estadísticas del sistema:');
    const stats = await prisma.progressReport.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    stats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.id} reportes`);
    });

    // 5. Verificar reportes pendientes específicamente
    const pendingReports = await prisma.progressReport.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        activity: { select: { name: true } },
        indicator: { select: { name: true } },
        reportedBy: { select: { firstName: true, lastName: true } }
      }
    });

    console.log(`\n⏳ Reportes pendientes de aprobación: ${pendingReports.length}`);
    pendingReports.forEach(report => {
      const itemName = report.activity?.name || report.indicator?.name;
      console.log(`   - ${itemName} (${report.reportedBy.firstName} ${report.reportedBy.lastName}) - ${report.period}`);
    });

    console.log('\n✅ Sistema de aprobaciones configurado exitosamente');

  } catch (error) {
    console.error('❌ Error configurando sistema de aprobaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupApprovalsSystem();
