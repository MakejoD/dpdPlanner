const axios = require('axios');

async function simpleTest() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // Test users endpoint
    const usersResponse = await axios.get('http://localhost:3001/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('📋 Respuesta de usuarios:', typeof usersResponse.data);
    console.log('📋 Estructura:', Object.keys(usersResponse.data));
    
    if (usersResponse.data.data) {
      console.log('✅ users.data encontrado, cantidad:', usersResponse.data.data.length);
    } else if (Array.isArray(usersResponse.data)) {
      console.log('✅ Array directo, cantidad:', usersResponse.data.length);
    } else {
      console.log('❌ Estructura inesperada');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

simpleTest();
