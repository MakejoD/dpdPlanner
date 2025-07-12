const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    console.log('🔧 Actualizando contraseña de admin...');
    
    // Hash de la contraseña 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Actualizar el usuario admin
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@poa.gov' },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('✅ Contraseña actualizada exitosamente');
    
    // Verificar la actualización
    console.log('🔍 Verificando...');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@poa.gov' }
    });
    
    const isValid = await bcrypt.compare('admin123', user.passwordHash);
    console.log('✅ Verificación:', isValid ? 'CORRECTA' : 'FALLIDA');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
