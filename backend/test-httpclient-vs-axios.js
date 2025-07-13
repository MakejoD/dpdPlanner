// Test para verificar si httpClient está modificando las respuestas
const axios = require('axios');

async function testHttpClientVsDirectAxios() {
  try {
    console.log('🔐 Login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;

    // Test 1: Axios directo
    console.log('\n📋 Test 1 - Axios directo:');
    const axiosResponse = await axios.get('http://localhost:3001/api/activities', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Axios - success:', axiosResponse.data.success);
    console.log('Axios - success type:', typeof axiosResponse.data.success);
    console.log('Axios - message:', axiosResponse.data.message);

    // Test 2: Simular httpClient
    console.log('\n📋 Test 2 - Simulando httpClient (fetch):');
    const fetchResponse = await fetch('http://localhost:3001/api/activities', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!fetchResponse.ok) {
      console.log('Fetch - HTTP Error:', fetchResponse.status);
    } else {
      const fetchData = await fetchResponse.json();
      console.log('Fetch - success:', fetchData.success);
      console.log('Fetch - success type:', typeof fetchData.success);
      console.log('Fetch - message:', fetchData.message);
      
      // Verificar condición del frontend
      console.log('\n🔍 Evaluando condición if (response.data.success):');
      console.log('fetchData.success === true:', fetchData.success === true);
      console.log('Boolean(fetchData.success):', Boolean(fetchData.success));
      console.log('!!fetchData.success:', !!fetchData.success);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testHttpClientVsDirectAxios();
