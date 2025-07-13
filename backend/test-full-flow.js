const axios = require('axios');

async function testCredentials() {
  const baseURL = 'http://localhost:3001/api';
  const credentialsCombinations = [
    { email: 'admin@poa.gov', password: 'admin123' },
    { email: 'admin@poa.gov', password: 'Admin123!' },
    { email: 'admin@poa.gov', password: 'admin123456' },
    { email: 'admin@poa.gov', password: 'password' }
  ];
  
  console.log('🔐 Testando múltiples combinaciones de credenciales...\n');
  
  for (const credentials of credentialsCombinations) {
    try {
      console.log(`Probando: ${credentials.email} / ${credentials.password}`);
      
      const loginResponse = await axios.post(`${baseURL}/auth/login`, credentials);
      
      console.log('✅ LOGIN EXITOSO!');
      console.log('🔑 Token obtenido:', loginResponse.data.token.substring(0, 50) + '...');
      
      // Test indicators with this token
      const authHeaders = {
        'Authorization': `Bearer ${loginResponse.data.token}`,
        'Content-Type': 'application/json'
      };
      
      try {
        const indicatorsResponse = await axios.get(`${baseURL}/indicators?isActive=true`, {
          headers: authHeaders
        });
        console.log('✅ Indicadores API funcionando correctamente');
        console.log('📈 Cantidad:', indicatorsResponse.data.indicators?.length || 0);
      } catch (indError) {
        console.log('❌ Error en indicadores:', indError.response?.data?.message || indError.message);
      }
      
      return credentials; // Return successful credentials
      
    } catch (error) {
      console.log('❌ Falló:', error.response?.data?.message || error.message);
    }
    console.log('');
  }
  
  console.log('❌ Ninguna combinación de credenciales funcionó');
  return null;
}

async function testFullFlow() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🔐 Testando login...');
    
    // 1. Login para obtener token
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    console.log('✅ Login exitoso');
    const token = loginResponse.data.token;
    console.log('🔑 Token obtenido:', token.substring(0, 50) + '...');
    
    // 2. Configurar headers para requests autenticados
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 3. Test indicators endpoint
    console.log('📊 Testando endpoint de indicadores...');
    try {
      const indicatorsResponse = await axios.get(`${baseURL}/indicators?isActive=true`, {
        headers: authHeaders
      });
      
      console.log('✅ Indicadores obtenidos correctamente');
      console.log('📈 Cantidad de indicadores:', indicatorsResponse.data.indicators?.length || 0);
      
      if (indicatorsResponse.data.indicators?.length > 0) {
        console.log('📋 Primer indicador:', {
          id: indicatorsResponse.data.indicators[0].id,
          name: indicatorsResponse.data.indicators[0].name,
          type: indicatorsResponse.data.indicators[0].type
        });
      }
      
    } catch (error) {
      console.log('❌ Error en indicadores:', error.response?.data || error.message);
      console.log('📄 Status:', error.response?.status);
    }
    
    // 4. Test progress reports endpoint
    console.log('📊 Testando endpoint de reportes de progreso...');
    try {
      const reportsResponse = await axios.get(`${baseURL}/progress-reports`, {
        headers: authHeaders
      });
      
      console.log('✅ Reportes obtenidos correctamente');
      console.log('📈 Cantidad de reportes:', reportsResponse.data.reports?.length || 0);
      
    } catch (error) {
      console.log('❌ Error en reportes:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ Error en login:', error.response?.data || error.message);
    console.log('📄 Status:', error.response?.status);
  }
}

async function runTests() {
  console.log('==============================');
  console.log('Iniciando prueba de credenciales');
  console.log('==============================');
  await testCredentials();
  
  console.log('\n==============================');
  console.log('Iniciando prueba de flujo completo');
  console.log('==============================');
  await testFullFlow();
}

runTests();

testCredentials().then(workingCredentials => {
  if (workingCredentials) {
    console.log('\n🎯 CREDENCIALES CONFIRMADAS:');
    console.log(`📧 Email: ${workingCredentials.email}`);
    console.log(`🔐 Password: ${workingCredentials.password}`);
  }
});
