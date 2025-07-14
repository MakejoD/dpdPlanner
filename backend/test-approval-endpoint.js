const httpClient = require('./src/utils/httpClient');

async function testApprovalEndpoint() {
  try {
    console.log('🔐 Probando endpoint de aprobaciones pendientes...');
    
    // Primero obtener un token de administrador
    const loginResponse = await httpClient.post('http://localhost:3001/api/auth/login', {
      email: 'admin@dpdplanner.com',
      password: 'admin123'
    });
    
    console.log('✅ Login exitoso');
    const token = loginResponse.data.data.token;
    
    // Configurar el token en las headers
    httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Probar el endpoint de pendientes
    console.log('📋 Obteniendo informes pendientes...');
    const pendingResponse = await httpClient.get('http://localhost:3001/api/approvals/pending');
    
    console.log('✅ Respuesta del endpoint pending:');
    console.log('Status:', pendingResponse.status);
    console.log('Data:', JSON.stringify(pendingResponse.data, null, 2));
    
    // Probar el endpoint de estadísticas
    console.log('\n📊 Obteniendo estadísticas...');
    const statsResponse = await httpClient.get('http://localhost:3001/api/approvals/stats');
    
    console.log('✅ Respuesta del endpoint stats:');
    console.log('Status:', statsResponse.status);
    console.log('Data:', JSON.stringify(statsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testApprovalEndpoint();
