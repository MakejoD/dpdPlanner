const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showLoginInfo() {
  try {
    const admin = await prisma.user.findFirst({
      where: { email: { contains: 'admin' } },
      include: { role: true }
    });
    
    if (admin) {
      console.log('✅ Usuario administrador encontrado:');
      console.log('📧 Email:', admin.email);
      console.log('👤 Nombre:', admin.firstName, admin.lastName);
      console.log('🎯 Rol:', admin.role.name);
      console.log('🔒 Activo:', admin.isActive);
      console.log('');
      console.log('🔑 Para hacer login usar:');
      console.log('Email:', admin.email);
      console.log('Password: admin123');
    } else {
      console.log('❌ No se encontró usuario administrador');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showLoginInfo();
