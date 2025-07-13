// Test específico para el endpoint de productos
const axios = require('axios');

async function testProductsEndpoint() {
  try {
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('🔍 Probando endpoint de productos...');
    const response = await axios.get('http://localhost:3001/api/products?isActive=true', { headers });
    
    console.log('📊 Respuesta del endpoint /products:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testProductsEndpoint();
