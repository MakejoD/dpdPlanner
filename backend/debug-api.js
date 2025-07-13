const axios = require('axios');

async function testApprovalAPI() {
  try {
    console.log('🔐 Autenticando...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Token obtenido');

    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('\n📊 Probando estadísticas...');
    const statsResponse = await axios.get('http://localhost:3001/api/approvals/stats', { headers });
    console.log('Stats response:', JSON.stringify(statsResponse.data, null, 2));

    console.log('\n📋 Probando reportes pendientes...');
    const pendingResponse = await axios.get('http://localhost:3001/api/approvals/pending', { headers });
    console.log('Pending response:', JSON.stringify(pendingResponse.data, null, 2));

    console.log('\n📄 Probando mis reportes...');
    const myReportsResponse = await axios.get('http://localhost:3001/api/approvals/my-reports', { headers });
    console.log('My reports response:', JSON.stringify(myReportsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testApprovalAPI();
