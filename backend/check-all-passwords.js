const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAllPasswords() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        department: true
      }
    });

    const commonPasswords = ['123456', 'admin123', 'password', 'juan123', 'maria123'];
    
    console.log('🔍 Verificando contraseñas para todos los usuarios:\n');
    
    for (const user of users) {
      console.log(`👤 Usuario: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`🏷️ Rol: ${user.role?.name}`);
      
      let foundPassword = null;
      
      for (const testPassword of commonPasswords) {
        try {
          if (user.password) {
            const isValid = await bcrypt.compare(testPassword, user.password);
            if (isValid) {
              foundPassword = testPassword;
              break;
            }
          }
        } catch (error) {
          // Ignore comparison errors
        }
      }
      
      if (foundPassword) {
        console.log(`✅ Contraseña encontrada: ${foundPassword}`);
      } else {
        console.log(`❌ Contraseña no encontrada en las opciones comunes`);
      }
      console.log('---');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllPasswords();
