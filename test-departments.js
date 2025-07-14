const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testDepartments() {
  try {
    console.log('🧪 Probando API de Departamentos');
    console.log('================================');

    // Login
    console.log('🔐 Iniciando sesión...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // Obtener departamentos
    console.log('📋 Obteniendo departamentos...');
    const departmentsResponse = await axios.get(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Departamentos obtenidos:');
    console.log(JSON.stringify(departmentsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDepartments();
