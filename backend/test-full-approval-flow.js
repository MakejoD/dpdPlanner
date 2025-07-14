const { PrismaClient } = require('@prisma/client');

async function testFullApprovalFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Probando flujo completo de aprobaciones...');
    
    // 1. Verificar usuarios y permisos
    console.log('\n1️⃣ Verificando usuarios...');
    const users = await prisma.user.findMany({
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Usuarios encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`  ${user.firstName} ${user.lastName} (${user.email}) - Rol: ${user.role.name}`);
    });
    
    // 2. Obtener una actividad para crear el informe
    console.log('\n2️⃣ Buscando actividades disponibles...');
    const activity = await prisma.activity.findFirst({
      include: {
        indicators: true,
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
    });
    
    if (!activity) {
      console.log('❌ No se encontraron actividades');
      return;
    }
    
    console.log(`✅ Actividad encontrada: ${activity.name}`);
    
    // 3. Crear un nuevo informe de progreso
    console.log('\n3️⃣ Creando nuevo informe de progreso...');
    const testUser = users.find(u => u.role.name !== 'Administrador'); // Usuario no admin
    
    if (!testUser) {
      console.log('❌ No se encontró un usuario no administrador');
      return;
    }
    
    const newReport = await prisma.progressReport.create({
      data: {
        activityId: activity.id,
        periodType: 'trimestral',
        period: 'T3',
        currentValue: 75.0,
        targetValue: 100.0,
        executionPercentage: 75.0,
        qualitativeComments: 'Informe de prueba para verificar el sistema de aprobaciones',
        challenges: 'Ningún desafío identificado',
        nextSteps: 'Continuar con el seguimiento',
        status: 'SUBMITTED', // Estado que debe aparecer en aprobaciones
        reportedById: testUser.id
      }
    });
    
    console.log(`✅ Informe creado con ID: ${newReport.id}`);
    console.log(`   Estado: ${newReport.status}`);
    
    // 4. Crear registro en historial de aprobaciones
    console.log('\n4️⃣ Creando registro en historial...');
    const historyRecord = await prisma.reportApprovalHistory.create({
      data: {
        progressReportId: newReport.id,
        action: 'SUBMITTED',
        comments: 'Informe enviado para aprobación',
        actionById: testUser.id
      }
    });
    
    console.log(`✅ Registro de historial creado: ${historyRecord.id}`);
    
    // 5. Verificar que aparece en consultas de aprobación
    console.log('\n5️⃣ Verificando consultas de aprobación...');
    
    // Consulta similar a la del endpoint /approvals/pending
    const pendingReports = await prisma.progressReport.findMany({
      where: {
        status: 'SUBMITTED'
      },
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📋 Informes pendientes encontrados: ${pendingReports.length}`);
    
    const ourReport = pendingReports.find(r => r.id === newReport.id);
    if (ourReport) {
      console.log('✅ Nuestro informe aparece en la lista de pendientes');
      console.log(`   Reportado por: ${ourReport.reportedBy.firstName} ${ourReport.reportedBy.lastName}`);
      console.log(`   Actividad: ${ourReport.activity.name}`);
    } else {
      console.log('❌ Nuestro informe NO aparece en la lista de pendientes');
    }
    
    // 6. Verificar estadísticas
    console.log('\n6️⃣ Verificando estadísticas...');
    const totalReports = await prisma.progressReport.count();
    const submittedCount = await prisma.progressReport.count({
      where: { status: 'SUBMITTED' }
    });
    const approvedCount = await prisma.progressReport.count({
      where: { status: 'APPROVED' }
    });
    
    console.log(`Total informes: ${totalReports}`);
    console.log(`Enviados: ${submittedCount}`);
    console.log(`Aprobados: ${approvedCount}`);
    
    console.log('\n🎉 Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullApprovalFlow();
