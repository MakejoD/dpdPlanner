// Test permissions API
const axios = require('axios');

async function testPermissions() {
  try {
    console.log('🔍 Probando API de Permisos...');
    
    // Login first
    const login = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = login.data.token;
    console.log('✅ Login exitoso');
    
    // Test permissions endpoint
    const response = await axios.get('http://localhost:3001/api/permissions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ API de Permisos funcionando:');
    console.log(`- Encontrados ${response.data.data.length} permisos`);
    console.log(`- Mensaje: ${response.data.message}`);
    console.log(`- Estructura: success=${response.data.success}`);
    console.log('\n📋 Primeros 3 permisos:');
    response.data.data.slice(0, 3).forEach((perm, i) => {
      console.log(`${i+1}. ${perm.action} -> ${perm.resource}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

testPermissions();
