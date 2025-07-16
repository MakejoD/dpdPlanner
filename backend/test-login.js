const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testLogin() {
  try {
    console.log('🔐 Probando login de administrador...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@sistema.gob.do',
      password: 'admin123'
    });

    if (response.data.success) {
      console.log('✅ Login exitoso');
      console.log('👤 Usuario:', response.data.data.user.firstName, response.data.data.user.lastName);
      console.log('🎯 Rol:', response.data.data.user.role.name);
      console.log('🔑 Token:', response.data.data.token.substring(0, 50) + '...');
      
      // Probar una llamada autenticada
      const token = response.data.data.token;
      const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Llamada autenticada exitosa');
      console.log('👥 Usuarios encontrados:', usersResponse.data.data.users.length);
      
    } else {
      console.log('❌ Login fallido:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Verificando usuarios en base de datos...');
      
      // Verificar usuarios en BD
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      try {
        const admin = await prisma.user.findUnique({
          where: { email: 'admin@sistema.gob.do' },
          include: { role: true }
        });
        
        if (admin) {
          console.log('👤 Usuario admin encontrado en BD:', admin.firstName, admin.lastName);
          console.log('🔒 Está activo:', admin.isActive);
          console.log('🎯 Rol:', admin.role.name);
        } else {
          console.log('❌ Usuario admin no encontrado en BD');
        }
      } catch (dbError) {
        console.error('❌ Error consultando BD:', dbError.message);
      } finally {
        await prisma.$disconnect();
      }
    }
  }
}

testLogin();
