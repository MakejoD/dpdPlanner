const { default: fetch } = require('node-fetch');

async function debugProgressReportsEndpoint() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🔐 Iniciando sesión como admin...');
    
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@poa.gov',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Probar diferentes variaciones del endpoint
    console.log('\n🔍 Probando diferentes variaciones del endpoint...');
    
    // 1. Sin parámetros
    console.log('1. Sin parámetros:');
    const response1 = await fetch(`${baseURL}/progress-reports`, { headers });
    const data1 = await response1.json();
    console.log(`   Status: ${response1.status}`);
    console.log(`   Count: ${data1.data?.length || 0}`);
    if (data1.data?.length > 0) {
      console.log(`   Primer informe: ${data1.data[0].id} - ${data1.data[0].status}`);
    }
    
    // 2. Con limite mayor
    console.log('2. Con limit=50:');
    const response2 = await fetch(`${baseURL}/progress-reports?limit=50`, { headers });
    const data2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    console.log(`   Count: ${data2.data?.length || 0}`);
    
    // 3. Sin filtros, solo paginación
    console.log('3. Con page=1&limit=100:');
    const response3 = await fetch(`${baseURL}/progress-reports?page=1&limit=100`, { headers });
    const data3 = await response3.json();
    console.log(`   Status: ${response3.status}`);
    console.log(`   Count: ${data3.data?.length || 0}`);
    
    // 4. Verificar si los datos están llegando pero la estructura es diferente
    if (data3.data?.length === 0) {
      console.log('4. Verificando estructura completa de respuesta:');
      console.log(JSON.stringify(data3, null, 2));
    }
    
    // 5. Probar endpoint específico que sabemos que funciona en stats
    console.log('5. Comparando con stats que sí funcionan:');
    const statsResponse = await fetch(`${baseURL}/approvals/stats`, { headers });
    const statsData = await statsResponse.json();
    console.log(`   Stats total: ${statsData.data?.summary?.total || 0}`);
    console.log(`   Stats pending: ${statsData.data?.summary?.pending || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugProgressReportsEndpoint();
