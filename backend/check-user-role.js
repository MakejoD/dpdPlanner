const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@poa.gov' },
      include: { role: true }
    });

    if (user) {
      console.log('Usuario:', user.email);
      console.log('Rol:', user.role.name);
      console.log('Descripción del rol:', user.role.description);
    } else {
      console.log('Usuario no encontrado');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkUser();
