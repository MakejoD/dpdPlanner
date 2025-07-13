const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const prisma = new PrismaClient();

async function checkAdminPassword() {
  try {
    console.log('🔍 Verificando credenciales del administrador...\n');
    
    // Obtener usuario admin
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@poa.gov' },
      include: {
        role: true,
        department: true
      }
    });

    if (!admin) {
      console.log('❌ Usuario admin@poa.gov no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   👤 Nombre: ${admin.firstName} ${admin.lastName}`);
    console.log(`   🏷️ Rol: ${admin.role.name}`);
    console.log(`   🏢 Departamento: ${admin.department.name}`);
    console.log('');

    // Probar diferentes contraseñas comunes
    const possiblePasswords = [
      'admin123',
      'admin123456', 
      'password123',
      '123456',
      'admin',
      'poa123',
      'sistema123'
    ];

    console.log('🔐 Probando contraseñas posibles...\n');

    for (const password of possiblePasswords) {
      try {
        console.log(`   Probando: "${password}"`);
        
        const response = await axios.post('http://localhost:3001/api/auth/login', {
          email: 'admin@poa.gov',
          password: password
        });

        if (response.data.token) {
          console.log(`   ✅ ¡CONTRASEÑA CORRECTA! -> "${password}"`);
          console.log(`   🔑 Token generado: ${response.data.token.substring(0, 50)}...`);
          console.log('');
          console.log('🎯 CREDENCIALES DEL ADMINISTRADOR:');
          console.log('   📧 Email: admin@poa.gov');
          console.log(`   🔐 Contraseña: ${password}`);
          return;
        }
      } catch (error) {
        console.log(`   ❌ Incorrecta: "${password}"`);
      }
    }

    console.log('\n❌ No se pudo determinar la contraseña con las opciones probadas');
    console.log('\n💡 Para restablecer la contraseña, puedes ejecutar:');
    console.log('   node fix-admin-password.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPassword();
