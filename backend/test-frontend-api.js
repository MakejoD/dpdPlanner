require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');

async function testFrontendAPI() {
  try {
    console.log('🔍 Probando API para frontend...');
    
    // 1. Test login
    console.log('\n📝 Test 1: Login');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    console.log('✅ Login exitoso');
    const token = loginResponse.data.token;
    
    // 2. Test usuarios
    console.log('\n👥 Test 2: Obtener usuarios');
    const usersResponse = await axios.get('http://localhost:3001/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Usuarios obtenidos: ${usersResponse.data.users?.length || 0}`);
    console.log('Estructura de respuesta de usuarios:', JSON.stringify(usersResponse.data, null, 2).substring(0, 500));
    
    // 3. Test roles
    console.log('\n🎭 Test 3: Obtener roles');
    const rolesResponse = await axios.get('http://localhost:3001/api/roles', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Roles obtenidos: ${rolesResponse.data.length}`);
    
    // 4. Test departamentos
    console.log('\n🏢 Test 4: Obtener departamentos');
    const deptsResponse = await axios.get('http://localhost:3001/api/departments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Departamentos obtenidos: ${deptsResponse.data.length}`);
    
    console.log('\n🎉 Todos los endpoints funcionan correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

testFrontendAPI();
