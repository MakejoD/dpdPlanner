const axios = require('axios');

async function testEndpoint() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Token obtenido:', token.substring(0, 50) + '...');

    // Probar endpoint for-tracking
    console.log('\nProbando /activities/for-tracking...');
    const response = await axios.get('http://localhost:3001/api/activities/for-tracking', { 
      headers,
      timeout: 10000 
    });

    console.log('Status:', response.status);
    console.log('Data keys:', Object.keys(response.data));
    console.log('Total activities:', response.data.data?.length || 0);

  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
  }
}

testEndpoint();
