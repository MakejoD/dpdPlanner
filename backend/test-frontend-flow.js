const { default: fetch } = require('node-fetch');

async function testFrontendFlow() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🔐 Simulando flujo completo del frontend...');
    
    // Login
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
    
    console.log('✅ Login exitoso');
    
    // Simular carga del módulo de aprobaciones
    console.log('\n📋 === MÓDULO DE APROBACIONES ===');
    
    // 1. Cargar informes pendientes
    console.log('1. Cargando informes pendientes...');
    const pendingResponse = await fetch(`${baseURL}/approvals/pending`, { headers });
    const pendingData = await pendingResponse.json();
    
    console.log(`   Estructura esperada por frontend: response.data.data.reports`);
    console.log(`   Estructura real: response.data =>`);
    console.log(`   - success: ${pendingData.success}`);
    console.log(`   - data.reports.length: ${pendingData.data?.reports?.length || 0}`);
    console.log(`   - data.pagination: ${JSON.stringify(pendingData.data?.pagination || {})}`);
    
    const reports = pendingData.data?.reports || [];
    console.log(`   ✅ Informes encontrados: ${reports.length}`);
    
    if (reports.length > 0) {
      console.log('   📋 Primer informe:');
      const first = reports[0];
      console.log(`      - ID: ${first.id}`);
      console.log(`      - Período: ${first.period}`);
      console.log(`      - Estado: ${first.status}`);
      console.log(`      - Reportado por: ${first.reportedBy.firstName} ${first.reportedBy.lastName}`);
    }
    
    // 2. Cargar estadísticas
    console.log('\n2. Cargando estadísticas...');
    const statsResponse = await fetch(`${baseURL}/approvals/stats`, { headers });
    const statsData = await statsResponse.json();
    
    console.log(`   Estructura esperada por frontend: response.data.data.summary`);
    console.log(`   Estructura real: response.data =>`);
    console.log(`   - success: ${statsData.success}`);
    console.log(`   - data.summary: ${JSON.stringify(statsData.data?.summary || {})}`);
    
    // 3. Cargar mis reportes
    console.log('\n3. Cargando mis reportes...');
    const myReportsResponse = await fetch(`${baseURL}/approvals/my-reports`, { headers });
    const myReportsData = await myReportsResponse.json();
    
    console.log(`   Status: ${myReportsResponse.status}`);
    if (myReportsResponse.ok) {
      console.log(`   Mis reportes: ${myReportsData.data?.length || 0}`);
    } else {
      console.log(`   Error: ${await myReportsResponse.text()}`);
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log(`   - Informes pendientes disponibles: ${reports.length}`);
    console.log(`   - Frontend debería mostrar estos informes`);
    console.log(`   - Si no se ven, revisar console.log en el navegador`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFrontendFlow();
