const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixJuanPassword() {
  try {
    // Buscar el usuario juan.perez
    const juan = await prisma.user.findFirst({
      where: {
        email: 'juan.perez@poa.gov'
      }
    });

    if (!juan) {
      console.log('❌ Usuario juan.perez@poa.gov no encontrado');
      return;
    }

    console.log('👤 Usuario encontrado:', juan.firstName, juan.lastName);

    // Actualizar contraseña
    const newPasswordHash = await bcrypt.hash('password123', 12);
    
    await prisma.user.update({
      where: { id: juan.id },
      data: { passwordHash: newPasswordHash }
    });

    console.log('✅ Contraseña actualizada para juan.perez@poa.gov');
    console.log('🔑 Nueva contraseña: password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixJuanPassword();
