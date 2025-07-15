const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupAdminUser() {
  try {
    console.log('🔧 Configurando usuario administrador...');
    
    // Generar hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Actualizar el usuario admin
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@dpdplanner.com'
      },
      data: {
        isActive: true,
        passwordHash: hashedPassword
      },
      include: {
        role: true,
        department: true
      }
    });

    console.log('✅ Usuario administrador configurado:');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Rol: ${updatedUser.role?.name}`);
    console.log(`   Estado: ${updatedUser.isActive ? 'Activo' : 'Inactivo'}`);
    console.log(`   Departamento: ${updatedUser.department?.name || 'Sin departamento'}`);
    
    await prisma.$disconnect();
    console.log('🎉 Configuración completada');
  } catch (error) {
    console.error('❌ Error al configurar usuario:', error);
    await prisma.$disconnect();
  }
}

setupAdminUser();
