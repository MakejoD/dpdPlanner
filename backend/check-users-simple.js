const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });

    console.log(`📊 Total de usuarios: ${users.length}`);
    
    if (users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - Rol: ${user.role?.name || 'Sin rol'} - Estado: ${user.active ? 'Activo' : 'Inactivo'}`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error);
    await prisma.$disconnect();
  }
}

checkUsers();
