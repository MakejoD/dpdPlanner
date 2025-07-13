// Test específico para el endpoint de actividades
const axios = require('axios');

async function testActivitiesEndpoint() {
  try {
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('🔍 Probando endpoint de actividades...');
    const response = await axios.get('http://localhost:3001/api/activities', { headers });
    
    console.log('📊 Respuesta completa del endpoint /activities:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testActivitiesEndpoint();
