const axios = require('axios');

async function debugEndpoint() {
  console.log('🔧 DEBUG: Probando endpoints específicos...\n');
  
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Login exitoso\n');
    
    // Probar diferentes endpoints
    const endpoints = [
      '/api/activities',
      '/api/activities/1',
      '/api/activities/tracking-info',
      '/api/activities/for-tracking'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Probando: ${endpoint}`);
        const response = await axios.get(`http://localhost:3001${endpoint}`, { headers });
        console.log(`✅ Status: ${response.status}, Data length: ${response.data.data?.length || 'N/A'}`);
      } catch (error) {
        console.log(`❌ Error: ${error.response?.status || 'NO_RESPONSE'} - ${error.response?.data?.message || error.message}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error en login:', error.message);
  }
}

debugEndpoint();
