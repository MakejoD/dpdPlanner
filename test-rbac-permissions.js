const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testPermissionsAPI() {
  try {
    console.log('🧪 Probando API de Permisos (POST-FIX)');
    console.log('=====================================');

    // 1. Login
    console.log('🔐 Haciendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // 2. Obtener permisos
    console.log('🔑 Obteniendo permisos...');
    const permissionsResponse = await axios.get(`${baseURL}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`📋 Total permisos encontrados: ${permissionsResponse.data.data.length}`);
    
    // Agrupar por recurso para mostrar mejor
    const grouped = {};
    permissionsResponse.data.data.forEach(p => {
      if (!grouped[p.resource]) grouped[p.resource] = [];
      grouped[p.resource].push(p.action);
    });

    console.log('\n📊 Permisos por recurso:');
    Object.keys(grouped).sort().forEach(resource => {
      console.log(`  📁 ${resource}: ${grouped[resource].sort().join(', ')}`);
    });

    console.log(`\n✅ Sistema RBAC tiene ${permissionsResponse.data.data.length} permisos disponibles`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPermissionsAPI();
