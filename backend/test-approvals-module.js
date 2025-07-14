const { default: fetch } = require('node-fetch');

async function testApprovalsModule() {
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
    
    console.log('✅ Login exitoso');
    
    // 1. Probar endpoint específico de aprobaciones pendientes
    console.log('\n⏳ Probando /approvals/pending...');
    const pendingResponse = await fetch(`${baseURL}/approvals/pending`, { headers });
    
    if (!pendingResponse.ok) {
      console.log(`❌ Error ${pendingResponse.status}:`, await pendingResponse.text());
      return;
    }
    
    const pendingData = await pendingResponse.json();
    console.log('📊 Estructura de respuesta:');
    console.log(JSON.stringify(pendingData, null, 2));
    
    // 2. Probar endpoint de mis reportes
    console.log('\n📋 Probando /approvals/my-reports...');
    const myReportsResponse = await fetch(`${baseURL}/approvals/my-reports`, { headers });
    
    if (myReportsResponse.ok) {
      const myReportsData = await myReportsResponse.json();
      console.log('📊 Mis reportes:', myReportsData.data?.length || 0);
    } else {
      console.log(`❌ Error en my-reports: ${myReportsResponse.status}`);
    }
    
    // 3. Verificar directamente con progress-reports filtrando por SUBMITTED
    console.log('\n🔍 Comparando con progress-reports status=SUBMITTED...');
    const submittedResponse = await fetch(`${baseURL}/progress-reports?status=SUBMITTED`, { headers });
    
    if (submittedResponse.ok) {
      const submittedData = await submittedResponse.json();
      console.log('📊 Progress reports SUBMITTED:', submittedData.data?.length || 0);
      
      if (submittedData.data && submittedData.data.length > 0) {
        console.log('📋 Informes SUBMITTED encontrados:');
        submittedData.data.forEach((report, index) => {
          console.log(`${index + 1}. ID: ${report.id}`);
          console.log(`   Periodo: ${report.period} (${report.periodType})`);
          console.log(`   Estado: ${report.status}`);
          console.log(`   Reportado por: ${report.reportedBy.firstName} ${report.reportedBy.lastName}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApprovalsModule();
