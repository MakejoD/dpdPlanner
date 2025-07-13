const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestReportsForApproval() {
  console.log('📄 Creando reportes de prueba para el sistema de aprobaciones...\n');

  try {
    // Obtener usuarios y actividades
    const users = await prisma.user.findMany();
    const activities = await prisma.activity.findMany();

    if (users.length === 0 || activities.length === 0) {
      console.log('❌ No hay usuarios o actividades disponibles');
      return;
    }

    // Crear varios reportes en diferentes estados
    const newReports = [
      {
        activityId: activities[0].id,
        reportedById: users[1].id, // Director
        periodType: 'mensual',
        period: '2025-07',
        currentValue: 30,
        targetValue: 100,
        executionPercentage: 30,
        qualitativeComments: 'Avance satisfactorio en el mes de julio',
        challenges: 'Algunos retrasos por vacaciones del personal',
        nextSteps: 'Acelerar actividades en agosto',
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      {
        activityId: activities[1].id,
        reportedById: users[2].id, // Técnico
        periodType: 'trimestral',
        period: '2025-Q3',
        currentValue: 85,
        targetValue: 100,
        executionPercentage: 85,
        qualitativeComments: 'Excelente progreso en el tercer trimestre',
        challenges: 'Ninguna dificultad mayor',
        nextSteps: 'Finalizar actividades pendientes',
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      {
        activityId: activities[2].id,
        reportedById: users[1].id, // Director
        periodType: 'trimestral',
        period: '2025-Q2',
        currentValue: 60,
        targetValue: 100,
        executionPercentage: 60,
        qualitativeComments: 'Avance moderado con algunos obstáculos',
        challenges: 'Retrasos en la entrega de materiales',
        nextSteps: 'Coordinar con proveedores para acelerar entregas',
        status: 'SUBMITTED',
        submittedAt: new Date()
      },
      {
        activityId: activities[0].id,
        reportedById: users[2].id, // Técnico
        periodType: 'mensual',
        period: '2025-06',
        currentValue: 45,
        targetValue: 100,
        executionPercentage: 45,
        qualitativeComments: 'Progreso según cronograma establecido',
        challenges: 'Necesidad de capacitación adicional del equipo',
        nextSteps: 'Implementar programa de capacitación',
        status: 'DRAFT'
      },
      {
        activityId: activities[1].id,
        reportedById: users[2].id, // Técnico
        periodType: 'mensual',
        period: '2025-05',
        currentValue: 25,
        targetValue: 100,
        executionPercentage: 25,
        qualitativeComments: 'Inicio lento pero progreso constante',
        challenges: 'Falta de recursos tecnológicos',
        nextSteps: 'Solicitar equipamiento adicional',
        status: 'DRAFT'
      }
    ];

    console.log('📋 Creando reportes...');
    for (let i = 0; i < newReports.length; i++) {
      const reportData = newReports[i];
      const report = await prisma.progressReport.create({
        data: reportData
      });
      console.log(`✅ Reporte ${i + 1} creado - Estado: ${report.status} - Actividad: ${reportData.activityId}`);
    }

    // Obtener estadísticas actualizadas
    const totalReports = await prisma.progressReport.count();
    const submittedReports = await prisma.progressReport.count({
      where: { status: 'SUBMITTED' }
    });
    const draftReports = await prisma.progressReport.count({
      where: { status: 'DRAFT' }
    });
    const approvedReports = await prisma.progressReport.count({
      where: { status: 'APPROVED' }
    });

    console.log('\n📊 Estadísticas actualizadas:');
    console.log(`   📋 Total de reportes: ${totalReports}`);
    console.log(`   📝 Borradores: ${draftReports}`);
    console.log(`   ⏳ Enviados (pendientes): ${submittedReports}`);
    console.log(`   ✅ Aprobados: ${approvedReports}`);

    console.log('\n🎉 Reportes de prueba creados exitosamente!');
    console.log('\n📋 Ahora puedes probar:');
    console.log('   1. Frontend en http://localhost:5174');
    console.log('   2. Login con admin@poa.gov / admin123');
    console.log('   3. Ir a "Seguimiento" > "Aprobaciones"');
    console.log('   4. Ver reportes pendientes y aprobar/rechazar');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestReportsForApproval();
