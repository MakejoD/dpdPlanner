const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    console.log('👥 Usuarios en la base de datos:');
    users.forEach(user => {
      console.log(`   ${user.isActive ? '✅' : '❌'} ${user.email} (${user.role})`);
    });
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    }
    
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
