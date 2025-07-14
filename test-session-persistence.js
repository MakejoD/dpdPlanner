const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testSessionPersistence() {
  try {
    console.log('🧪 Probando Persistencia de Sesión');
    console.log('=================================');

    // 1. Login inicial
    console.log('🔐 1. Haciendo login inicial...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');

    // 2. Verificar endpoint /auth/me
    console.log('👤 2. Verificando /auth/me...');
    const meResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Datos del usuario obtenidos:');
    console.log(`   - Email: ${meResponse.data.email}`);
    console.log(`   - Nombre: ${meResponse.data.firstName} ${meResponse.data.lastName}`);
    console.log(`   - Rol: ${meResponse.data.role.name}`);
    console.log(`   - Departamento: ${meResponse.data.department?.name || 'N/A'}`);
    console.log(`   - Permisos: ${meResponse.data.permissions.length}`);

    // 3. Simular recarga de página (verificar token nuevamente)
    console.log('🔄 3. Simulando recarga de página...');
    const meResponse2 = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Token sigue siendo válido después de "recarga"');

    // 4. Probar una API protegida
    console.log('📋 4. Probando API protegida (departamentos)...');
    const deptResponse = await axios.get(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ API protegida funciona correctamente');
    console.log(`   - Departamentos encontrados: ${deptResponse.data.data.length}`);

    console.log('');
    console.log('🎉 ¡Persistencia de sesión funciona correctamente!');
    console.log('');
    console.log('📝 Resumen:');
    console.log('   ✅ Login inicial exitoso');
    console.log('   ✅ Endpoint /auth/me funcional');
    console.log('   ✅ Token persiste correctamente');
    console.log('   ✅ APIs protegidas accesibles');

  } catch (error) {
    console.error('❌ Error en prueba de persistencia:', error.response?.data || error.message);
  }
}

testSessionPersistence();
