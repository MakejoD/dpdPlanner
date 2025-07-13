const axios = require('axios');

async function testUsersEndpoint() {
  try {
    console.log('🔍 Probando el endpoint de usuarios...\n');

    // Primero hacer login para obtener el token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');

    // Probar el endpoint de usuarios
    const usersResponse = await axios.get('http://localhost:3001/api/users?isActive=true', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📊 Respuesta del endpoint /api/users:');
    console.log('Status:', usersResponse.status);
    console.log('Total usuarios:', usersResponse.data.users.length);
    
    console.log('\n👥 Lista de usuarios:');
    usersResponse.data.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Rol: ${user.role?.name || 'Sin rol'}`);
      console.log(`   - Departamento: ${user.department?.name || 'Sin departamento'}`);
      console.log(`   - Activo: ${user.isActive}`);
      console.log('');
    });

    // Probar con diferentes parámetros
    console.log('\n🔍 Probando con parámetros específicos...');
    const filteredResponse = await axios.get('http://localhost:3001/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Total usuarios (sin filtro isActive):', filteredResponse.data.users.length);

  } catch (error) {
    console.error('❌ Error al probar el endpoint:', error.response?.data || error.message);
  }
}

testUsersEndpoint();
