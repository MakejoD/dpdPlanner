const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Probando login...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    console.log('✅ Login exitoso!');
    console.log('📄 Respuesta completa:', JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('🔑 Token encontrado:', response.data.token.substring(0, 50) + '...');
    } else if (response.data.data?.token) {
      console.log('🔑 Token encontrado en data:', response.data.data.token.substring(0, 50) + '...');
    } else {
      console.log('❌ No se encontró token en la respuesta');
    }
    
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
  }
}

testLogin();
