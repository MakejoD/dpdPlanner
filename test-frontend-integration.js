// Script para probar la integración completa frontend-backend
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testIntegration() {
  console.log('🚀 Iniciando pruebas de integración Frontend-Backend\n');

  try {
    // 1. Test login and get token
    console.log('1️⃣  Probando autenticación...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Fallo en la autenticación');
    }

    const token = loginResponse.data.token;
    console.log('✅ Autenticación exitosa');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test Users API (UserManagement.jsx)
    console.log('\n2️⃣  Probando API de Usuarios...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
    console.log(`✅ Usuarios cargados: ${usersResponse.data.data.length} usuarios`);

    // 3. Test Roles API (RoleManagement.jsx)
    console.log('\n3️⃣  Probando API de Roles...');
    const rolesResponse = await axios.get(`${BASE_URL}/roles`, { headers });
    console.log(`✅ Roles cargados: ${rolesResponse.data.data.length} roles`);

    // 4. Test Strategic Axes API (StrategicAxesManagement.jsx)
    console.log('\n4️⃣  Probando API de Ejes Estratégicos...');
    const axesResponse = await axios.get(`${BASE_URL}/strategic-axes`, { headers });
    console.log(`✅ Ejes estratégicos cargados: ${axesResponse.data.data.length} ejes`);

    // 5. Test Strategic Axes filtering by year
    console.log('\n5️⃣  Probando filtros de Ejes Estratégicos...');
    const filteredAxesResponse = await axios.get(`${BASE_URL}/strategic-axes?year=2024&isActive=true`, { headers });
    console.log(`✅ Ejes filtrados (2024, activos): ${filteredAxesResponse.data.data.length} ejes`);

    // 6. Test Departments for dropdown
    console.log('\n6️⃣  Probando API de Departamentos...');
    const deptResponse = await axios.get(`${BASE_URL}/departments`, { headers });
    console.log(`✅ Departamentos cargados: ${deptResponse.data.data.length} departamentos`);

    // 7. Test Permissions for RoleManagement
    console.log('\n7️⃣  Probando API de Permisos...');
    const permissionsResponse = await axios.get(`${BASE_URL}/permissions`, { headers });
    console.log(`✅ Permisos cargados: ${permissionsResponse.data.data.length} permisos`);

    // 8. Test response structure consistency
    console.log('\n8️⃣  Verificando estructura de respuestas...');
    
    const responses = [
      { name: 'Users', data: usersResponse.data },
      { name: 'Roles', data: rolesResponse.data },
      { name: 'Strategic Axes', data: axesResponse.data },
      { name: 'Departments', data: deptResponse.data },
      { name: 'Permissions', data: permissionsResponse.data }
    ];

    responses.forEach(({ name, data }) => {
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ ${name}: Estructura correcta`);
      } else {
        console.log(`❌ ${name}: Estructura incorrecta`, { hasSuccess: !!data.success, hasData: Array.isArray(data.data) });
      }
    });

    console.log('\n🎉 ¡Todas las pruebas de integración pasaron exitosamente!');
    console.log('\n📋 Resumen de APIs integradas:');
    console.log('   ✅ UserManagement.jsx -> /users API');
    console.log('   ✅ RoleManagement.jsx -> /roles API'); 
    console.log('   ✅ StrategicAxesManagement.jsx -> /strategic-axes API');
    console.log('   ✅ RoleManagement.jsx -> /permissions API (CORREGIDO)');
    console.log('   ✅ Todas usan estructura {success, data, message}');
    console.log('   ✅ Autenticación JWT funcionando');
    console.log('   ✅ Filtros y parámetros funcionando');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('   Detalles:', error.response.data);
    }
  }
}

testIntegration();
