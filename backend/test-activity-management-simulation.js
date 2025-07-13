// Simulación completa del flujo de ActivityManagement para verificar correcciones
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function simulateActivityManagementFlow() {
  try {
    console.log('🔐 Simulando login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login exitoso');

    // Simular loadUsers (para el dropdown de asignación)
    console.log('\n👥 Simulando loadUsers...');
    const usersResponse = await axios.get(`${API_BASE}/users?isActive=true`, { headers });
    console.log(`   Response structure: response.data.success = ${usersResponse.data.success}`);
    
    if (usersResponse.data.success) {
      const usersArray = usersResponse.data.data || [];
      console.log(`   ✅ Usuarios encontrados: ${usersArray.length}`);
      usersArray.forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      });
    }

    // Simular loadProducts (para el dropdown de productos)
    console.log('\n📦 Simulando loadProducts...');
    const productsResponse = await axios.get(`${API_BASE}/products?isActive=true`, { headers });
    console.log(`   Response structure: response.data.success = ${productsResponse.data.success}`);
    
    if (productsResponse.data.success) {
      const productsArray = productsResponse.data.data || [];
      console.log(`   ✅ Productos encontrados: ${productsArray.length}`);
      productsArray.forEach((product, index) => {
        console.log(`      ${index + 1}. ${product.name} (${product.code})`);
      });
    }

    // Simular loadActivities (para la tabla principal)
    console.log('\n📋 Simulando loadActivities...');
    const activitiesResponse = await axios.get(`${API_BASE}/activities`, { headers });
    console.log(`   Response structure: response.data.success = ${activitiesResponse.data.success}`);
    
    if (activitiesResponse.data.success) {
      const activitiesArray = activitiesResponse.data.data.activities || [];
      console.log(`   ✅ Actividades encontradas: ${activitiesArray.length}`);
      activitiesArray.forEach((activity, index) => {
        console.log(`      ${index + 1}. ${activity.name} (${activity.code})`);
        console.log(`         - Asignaciones: ${activity.assignments?.length || 0}`);
        console.log(`         - Indicadores: ${activity._count?.indicators || 0}`);
      });

      // Calcular estadísticas como en el componente
      const total = activitiesArray.length;
      const active = activitiesArray.filter(a => a.isActive).length;
      const withAssignments = activitiesArray.filter(a => a.assignments?.length > 0).length;
      const withIndicators = activitiesArray.filter(a => a._count?.indicators > 0).length;
      
      console.log(`\n   📊 Estadísticas calculadas:`);
      console.log(`      - Total: ${total}`);
      console.log(`      - Activas: ${active}`);
      console.log(`      - Con asignaciones: ${withAssignments}`);
      console.log(`      - Con indicadores: ${withIndicators}`);
    }

    console.log('\n🎉 ¡Simulación completada! Los datos ahora deberían cargarse correctamente en ActivityManagement.');
    console.log('\n📋 Correcciones aplicadas:');
    console.log('   ✅ loadUsers: response.data.data (array directo)');
    console.log('   ✅ loadProducts: response.data.data (array directo)'); 
    console.log('   ✅ loadActivities: response.data.data.activities (array en objeto data)');
    console.log('   ✅ Estructura general: response.data.success + datos en la estructura correcta');

  } catch (error) {
    console.error('❌ Error en simulación:', error.response?.data || error.message);
  }
}

simulateActivityManagementFlow();
