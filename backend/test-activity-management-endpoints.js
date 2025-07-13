// Test para verificar las estructuras de respuesta de todos los endpoints usados por ActivityManagement
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testActivityManagementEndpoints() {
  try {
    console.log('🔐 Probando login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login exitoso');

    // Test endpoints usados por ActivityManagement
    const endpoints = [
      { path: '/users?isActive=true', name: 'Usuarios Activos', expectedPath: 'data' },
      { path: '/products?isActive=true', name: 'Productos Activos', expectedPath: 'data' },
      { path: '/activities', name: 'Actividades', expectedPath: 'data' }
    ];

    console.log('\n📋 Probando endpoints de ActivityManagement...\n');

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Probando ${endpoint.name} (${endpoint.path})...`);
        const response = await axios.get(`${API_BASE}${endpoint.path}`, { headers });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${response.data.success}`);
        
        if (response.data[endpoint.expectedPath]) {
          const data = response.data[endpoint.expectedPath];
          const count = Array.isArray(data) ? data.length : 'No es array';
          console.log(`   ✅ Datos en response.data.${endpoint.expectedPath}: ${count} elementos`);
          
          if (Array.isArray(data) && data.length > 0) {
            const sample = data[0];
            console.log(`   📝 Ejemplo: ${sample.name || sample.firstName + ' ' + sample.lastName || 'Sin nombre'}`);
          }
        } else {
          console.log(`   ❌ No se encontró response.data.${endpoint.expectedPath}`);
          console.log(`   📊 Propiedades disponibles:`, Object.keys(response.data));
        }
        
        console.log('');
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}\n`);
      }
    }

    console.log('🎯 Resumen de correcciones necesarias:');
    console.log('   - Usuarios: response.data.data (array directo)');
    console.log('   - Productos: response.data.data (estructura típica)');
    console.log('   - Actividades: response.data.data (estructura típica)');
    console.log('   - Estructura general: response.data.success + response.data.data');

  } catch (error) {
    console.error('❌ Error en el test:', error.response?.data || error.message);
  }
}

testActivityManagementEndpoints();
