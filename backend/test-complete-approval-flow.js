const { default: fetch } = require('node-fetch');

async function testCompleteApprovalFlow() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🔐 Iniciando sesión...');
    
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
    
    // Obtener informes pendientes
    console.log('\n📋 Obteniendo informes pendientes...');
    const pendingResponse = await fetch(`${baseURL}/approvals/pending`, { headers });
    const pendingData = await pendingResponse.json();
    
    const reports = pendingData.data?.reports || [];
    if (reports.length === 0) {
      console.log('❌ No hay informes pendientes para probar');
      return;
    }
    
    const testReport = reports[0];
    console.log(`📝 Usando informe: ${testReport.id} (${testReport.period})`);
    
    // Probar endpoint de aprobación
    console.log('\n✅ Probando endpoint de aprobación...');
    const approveResponse = await fetch(`${baseURL}/approvals/${testReport.id}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        comments: 'Informe aprobado. Excelente trabajo en el análisis de los indicadores.'
      })
    });
    
    console.log(`   Status: ${approveResponse.status}`);
    
    if (approveResponse.ok) {
      const approveData = await approveResponse.json();
      console.log('   ✅ Aprobación exitosa');
      console.log(`   Mensaje: ${approveData.message}`);
      
      // Verificar que el estado cambió
      console.log('\n📊 Verificando estado actualizado...');
      const updatedResponse = await fetch(`${baseURL}/progress-reports`, { headers });
      const updatedData = await updatedResponse.json();
      
      const updatedReport = updatedData.data.find(r => r.id === testReport.id);
      if (updatedReport) {
        console.log(`   Estado del informe: ${updatedReport.status}`);
        console.log(`   Comentarios: ${updatedReport.comments || 'No especificados'}`);
      }
      
    } else {
      const errorText = await rejectResponse.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
    
    // Mostrar resumen final
    console.log('\n📈 Resumen final de estados:');
    const finalResponse = await fetch(`${baseURL}/progress-reports`, { headers });
    const finalData = await finalResponse.json();
    
    const statusCounts = finalData.data.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Estados de informes:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} informes`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCompleteApprovalFlow();
