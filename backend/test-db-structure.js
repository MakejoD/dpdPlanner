const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectDatabase() {
  try {
    console.log('🔍 Inspeccionando estructura de la base de datos...\n');

    // Verificar la tabla activity_assignments
    console.log('📋 Verificando estructura de activity_assignments...');
    
    // Intentar hacer un query simple
    const assignments = await prisma.activityAssignment.findMany({
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        activity: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`✅ Asignaciones existentes: ${assignments.length}`);
    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.user.firstName} ${assignment.user.lastName} -> ${assignment.activity.name}`);
      console.log(`   isMain: ${assignment.isMain}`);
    });

    // Verificar si podemos crear una asignación
    console.log('\n🧪 Probando creación de asignación...');
    
    // Obtener datos para prueba
    const testActivity = await prisma.activity.findFirst();
    const testUser = await prisma.user.findFirst();
    
    if (!testActivity || !testUser) {
      console.log('❌ No hay datos de prueba disponibles');
      return;
    }

    console.log(`Actividad de prueba: ${testActivity.name}`);
    console.log(`Usuario de prueba: ${testUser.firstName} ${testUser.lastName}`);

    // Verificar si ya existe la asignación
    const existingAssignment = await prisma.activityAssignment.findFirst({
      where: {
        activityId: testActivity.id,
        userId: testUser.id
      }
    });

    if (existingAssignment) {
      console.log('⚠️  La asignación ya existe');
    } else {
      // Intentar crear la asignación
      const newAssignment = await prisma.activityAssignment.create({
        data: {
          activityId: testActivity.id,
          userId: testUser.id,
          isMain: false
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log('✅ Asignación creada exitosamente:', newAssignment);
    }

  } catch (error) {
    console.error('❌ Error al inspeccionar la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase();
