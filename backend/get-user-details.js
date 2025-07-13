const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getUserDetails() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        department: true
      }
    });

    console.log('👥 Detalles de usuarios en la base de datos:\n');
    
    users.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Nombre: ${user.firstName} ${user.lastName}`);
      console.log(`🏷️ Rol: ${user.role?.name || 'Sin rol'}`);
      console.log(`🏢 Departamento: ${user.department?.name || 'Sin departamento'}`);
      console.log(`🔐 Activo: ${user.isActive ? 'Sí' : 'No'}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUserDetails();
