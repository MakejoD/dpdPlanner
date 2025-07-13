const axios = require('axios');

async function debugEndpoint() {
  try {
    // Login primero
    console.log('🔐 Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido');
    
    // Hacer llamada con más detalles
    console.log('📋 Probando endpoint /activities/for-tracking...');
    try {
      const response = await axios.get('http://localhost:3001/api/activities/for-tracking', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Response status:', response.status);
      console.log('📊 Response keys:', Object.keys(response.data));
      if (response.data.data) {
        console.log('📋 Activities count:', response.data.data.length);
        if (response.data.data.length > 0) {
          console.log('🎯 First activity:', response.data.data[0].name);
          console.log('📊 Has tracking info:', !!response.data.data[0].tracking);
        }
      }
      
    } catch (error) {
      console.log('❌ Error details:');
      console.log('   Status:', error.response?.status);
      console.log('   Error message:', error.response?.data?.message);
      console.log('   Full error data:', error.response?.data);
      console.log('   Request URL:', error.config?.url);
    }
    
  } catch (loginError) {
    console.error('❌ Login failed:', loginError.message);
  }
}

debugEndpoint();
