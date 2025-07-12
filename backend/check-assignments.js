const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignments() {
  try {
    const activity = await prisma.activity.findFirst({
      include: {
        assignments: {
          include: {
            user: true
          }
        }
      }
    });
    
    console.log('🎯 Actividad con asignaciones:');
    console.log(JSON.stringify(activity, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignments();
