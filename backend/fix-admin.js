const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔄 Actualizando contraseña del administrador...');
    
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@poa.gov' },
      data: { passwordHash: hashedPassword },
      include: { role: true, department: true }
    });
    
    console.log('✅ Contraseña actualizada para:', {
      id: updatedAdmin.id,
      email: updatedAdmin.email,
      nombre: updatedAdmin.firstName + ' ' + updatedAdmin.lastName,
      rol: updatedAdmin.role?.name
    });
    
    // Verificar que la contraseña funciona
    const isValid = await bcrypt.compare('admin123456', updatedAdmin.passwordHash);
    console.log('🔐 Verificación de contraseña:', isValid);
    
    console.log('\n🎯 Credenciales confirmadas:');
    console.log('   Email: admin@poa.gov');
    console.log('   Password: admin123456');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
