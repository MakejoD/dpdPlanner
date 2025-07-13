const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAdminModules() {
  try {
    console.log('🔍 Probando endpoints específicos de módulos de administración...\n');

    // 1. Login para obtener token
    console.log('📝 Test 1: Login');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 2. Test endpoint de usuarios
    console.log('\n👥 Test 2: GET /users');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`, config);
    console.log('✅ Usuarios obtenidos:', usersResponse.data?.users?.length || usersResponse.data?.length || 'Estructura desconocida');
    console.log('Estructura de respuesta de usuarios:');
    console.log(JSON.stringify(usersResponse.data, null, 2).substring(0, 500) + '...');

    // 3. Test endpoint de roles
    console.log('\n🎭 Test 3: GET /roles');
    const rolesResponse = await axios.get(`${BASE_URL}/api/roles`, config);
    console.log('✅ Roles obtenidos:', rolesResponse.data?.length || 'Estructura desconocida');
    console.log('Estructura de respuesta de roles:');
    console.log(JSON.stringify(rolesResponse.data, null, 2).substring(0, 500) + '...');

    // 4. Test endpoint de roles con permisos
    console.log('\n🎭 Test 4: GET /roles?includePermissions=true');
    const rolesWithPermissionsResponse = await axios.get(`${BASE_URL}/api/roles?includePermissions=true`, config);
    console.log('✅ Roles con permisos obtenidos:', rolesWithPermissionsResponse.data?.length || 'Estructura desconocida');
    console.log('Estructura de respuesta de roles con permisos:');
    console.log(JSON.stringify(rolesWithPermissionsResponse.data, null, 2).substring(0, 500) + '...');

    // 5. Test endpoint de permisos
    console.log('\n🔐 Test 5: GET /permissions');
    const permissionsResponse = await axios.get(`${BASE_URL}/api/permissions`, config);
    console.log('✅ Permisos obtenidos:', permissionsResponse.data?.length || 'Estructura desconocida');
    console.log('Estructura de respuesta de permisos:');
    console.log(JSON.stringify(permissionsResponse.data, null, 2).substring(0, 500) + '...');

    // 6. Test endpoint de departamentos
    console.log('\n🏢 Test 6: GET /departments');
    const departmentsResponse = await axios.get(`${BASE_URL}/api/departments`, config);
    console.log('✅ Departamentos obtenidos:', departmentsResponse.data?.length || 'Estructura desconocida');
    console.log('Estructura de respuesta de departamentos:');
    console.log(JSON.stringify(departmentsResponse.data, null, 2).substring(0, 500) + '...');

    console.log('\n🎉 Todos los endpoints de módulos de administración funcionan correctamente');

  } catch (error) {
    console.error('❌ Error en test:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAdminModules();
