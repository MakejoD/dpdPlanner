const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Actualizando contraseñas de usuarios...');
    
    // Admin user
    console.log('👤 Actualizando admin@poa.gov...');
    const adminHash = await bcrypt.hash('admin123456', 12);
    await prisma.user.update({
      where: { email: 'admin@poa.gov' },
      data: { passwordHash: adminHash }
    });
    console.log('✅ Admin actualizado');
    
    // Planning user
    console.log('👤 Actualizando planificacion@poa.gov...');
    const planningHash = await bcrypt.hash('planning123', 12);
    await prisma.user.update({
      where: { email: 'planificacion@poa.gov' },
      data: { passwordHash: planningHash }
    });
    console.log('✅ Planificacion actualizado');
    
    // Director user
    console.log('👤 Actualizando director@poa.gov...');
    const directorHash = await bcrypt.hash('finance123', 12);
    await prisma.user.update({
      where: { email: 'director@poa.gov' },
      data: { passwordHash: directorHash }
    });
    console.log('✅ Director actualizado');
    
    // Tech user
    console.log('👤 Actualizando tecnico@poa.gov...');
    const techHash = await bcrypt.hash('tecnico123', 12);
    await prisma.user.update({
      where: { email: 'tecnico@poa.gov' },
      data: { passwordHash: techHash }
    });
    console.log('✅ Técnico actualizado');
    
    // Verificar las actualizaciones
    console.log('\n🔍 Verificando actualizaciones...');
    const users = await prisma.user.findMany({
      select: {
        email: true,
        passwordHash: true
      }
    });
    
    users.forEach(user => {
      const hasPassword = user.passwordHash && user.passwordHash.length > 0;
      console.log(`   ${hasPassword ? '✅' : '❌'} ${user.email}: ${hasPassword ? 'Contraseña OK' : 'Sin contraseña'}`);
    });
    
    console.log('\n🎉 Proceso completado!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   admin@poa.gov / admin123456');
    console.log('   planificacion@poa.gov / planning123');
    console.log('   director@poa.gov / finance123');
    console.log('   tecnico@poa.gov / tecnico123');
    
  } catch (error) {
    console.error('❌ Error al actualizar contraseñas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();
