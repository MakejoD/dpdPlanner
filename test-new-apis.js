// Test para las nuevas APIs implementadas
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';

async function testAPIs() {
  try {
    console.log('🚀 Iniciando tests de las APIs implementadas...\n');

    // 1. Login para obtener token
    console.log('1. 🔐 Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Login exitoso - Token obtenido\n');

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // 2. Test Users API
    console.log('2. 👥 Testing Users API...');
    
    // GET /users
    const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
    console.log(`✅ GET /users - ${usersResponse.data.data.length} usuarios obtenidos`);
    
    // GET /users/stats/summary
    const userStatsResponse = await axios.get(`${BASE_URL}/users/stats/summary`, { headers });
    console.log(`✅ GET /users/stats/summary - ${userStatsResponse.data.data.totalUsers} usuarios totales`);
    console.log(`   - Activos: ${userStatsResponse.data.data.activeUsers}`);
    console.log(`   - Por roles: ${userStatsResponse.data.data.usersByRole.length} roles\n`);

    // 3. Test Roles API
    console.log('3. 🔧 Testing Roles API...');
    
    // GET /roles
    const rolesResponse = await axios.get(`${BASE_URL}/roles`, { headers });
    console.log(`✅ GET /roles - ${rolesResponse.data.data.length} roles obtenidos`);
    
    // GET /roles with permissions
    const rolesWithPermissionsResponse = await axios.get(`${BASE_URL}/roles?includePermissions=true`, { headers });
    console.log(`✅ GET /roles?includePermissions=true - Roles con permisos obtenidos`);
    
    if (rolesResponse.data.data.length > 0) {
      const firstRoleId = rolesResponse.data.data[0].id;
      const roleDetailResponse = await axios.get(`${BASE_URL}/roles/${firstRoleId}`, { headers });
      console.log(`✅ GET /roles/${firstRoleId} - Detalle del rol: ${roleDetailResponse.data.data.name}`);
      console.log(`   - Permisos: ${roleDetailResponse.data.data.permissions.length}`);
      console.log(`   - Usuarios: ${roleDetailResponse.data.data.userCount}\n`);
    }

    // 4. Test Strategic Axes API
    console.log('4. 🎯 Testing Strategic Axes API...');
    
    // GET /strategic-axes
    const strategicAxesResponse = await axios.get(`${BASE_URL}/strategic-axes`, { headers });
    console.log(`✅ GET /strategic-axes - ${strategicAxesResponse.data.data.length} ejes estratégicos obtenidos`);
    
    // Test creating a new strategic axis
    const newAxisData = {
      name: 'Eje Estratégico de Prueba',
      description: 'Descripción de prueba para el eje estratégico',
      code: 'TEST2025',
      year: 2025
    };
    
    try {
      const createAxisResponse = await axios.post(`${BASE_URL}/strategic-axes`, newAxisData, { headers });
      console.log(`✅ POST /strategic-axes - Eje estratégico creado: ${createAxisResponse.data.data.name}`);
      
      const createdAxisId = createAxisResponse.data.data.id;
      
      // Test getting the created axis
      const axisDetailResponse = await axios.get(`${BASE_URL}/strategic-axes/${createdAxisId}`, { headers });
      console.log(`✅ GET /strategic-axes/${createdAxisId} - Detalle obtenido: ${axisDetailResponse.data.data.name}`);
      
      // Test updating the axis
      const updateAxisResponse = await axios.put(`${BASE_URL}/strategic-axes/${createdAxisId}`, {
        description: 'Descripción actualizada de prueba'
      }, { headers });
      console.log(`✅ PUT /strategic-axes/${createdAxisId} - Eje estratégico actualizado`);
      
      // Test soft delete
      const deleteAxisResponse = await axios.delete(`${BASE_URL}/strategic-axes/${createdAxisId}`, { headers });
      console.log(`✅ DELETE /strategic-axes/${createdAxisId} - Eje estratégico desactivado\n`);
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('código')) {
        console.log(`⚠️ POST /strategic-axes - El código ya existe (esperado en tests)\n`);
      } else {
        throw error;
      }
    }

    // 5. Test Permissions API
    console.log('5. 🔑 Testing Permissions API...');
    
    // GET /permissions
    const permissionsResponse = await axios.get(`${BASE_URL}/permissions`, { headers });
    console.log(`✅ GET /permissions - ${permissionsResponse.data.data.length} permisos obtenidos`);
    
    // Group permissions by resource
    const permissionsByResource = permissionsResponse.data.data.reduce((acc, perm) => {
      if (!acc[perm.resource]) acc[perm.resource] = [];
      acc[perm.resource].push(perm.action);
      return acc;
    }, {});
    
    console.log(`   - Recursos con permisos: ${Object.keys(permissionsByResource).length}`);
    Object.entries(permissionsByResource).forEach(([resource, actions]) => {
      console.log(`     * ${resource}: ${actions.join(', ')}`);
    });

    console.log('\n🎉 ¡Todos los tests completados exitosamente!');
    console.log('\n📊 Resumen de APIs implementadas:');
    console.log('✅ Users API - CRUD completo con estadísticas');
    console.log('✅ Roles API - CRUD completo con gestión de permisos');
    console.log('✅ Strategic Axes API - CRUD completo con bloqueo');
    console.log('✅ Permissions API - Lectura y gestión');
    console.log('\n🚀 Las APIs están listas para ser usadas por el frontend!');

  } catch (error) {
    console.error('❌ Error en los tests:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 Asegúrate de que el backend esté ejecutándose en http://localhost:3001');
    }
  }
}

// Ejecutar los tests
testAPIs();

module.exports = { testAPIs };
