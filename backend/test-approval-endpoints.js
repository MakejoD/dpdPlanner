const { default: fetch } = require('node-fetch');

async function testApprovalEndpoints() {
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
    
    // Obtener un informe pendiente para probar
    console.log('\n📋 Obteniendo informes pendientes...');
    const pendingResponse = await fetch(`${baseURL}/approvals/pending`, { headers });
    const pendingData = await pendingResponse.json();
    
    const reports = pendingData.data?.reports || [];
    if (reports.length === 0) {
      console.log('❌ No hay informes pendientes para probar');
      return;
    }
    
    const testReport = reports[0];
    console.log(`📝 Usando informe de prueba: ${testReport.id}`);
    console.log(`   Período: ${testReport.period}`);
    console.log(`   Reportado por: ${testReport.reportedBy.firstName} ${testReport.reportedBy.lastName}`);
    
    // Probar endpoint de aprobación (sin ejecutar realmente)
    console.log('\n🧪 Probando estructura de endpoints...');
    
    // 1. Verificar que el endpoint de rechazo existe
    console.log('1. Verificando endpoint POST /approvals/{id}/reject...');
    const rejectResponse = await fetch(`${baseURL}/approvals/${testReport.id}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        comments: 'Comentario de prueba para verificar endpoint'
      })
    });
    
    console.log(`   Status: ${rejectResponse.status}`);
    
    if (rejectResponse.ok) {
      const rejectData = await rejectResponse.json();
      console.log('   ✅ Endpoint funcionando correctamente');
      console.log(`   Resultado: ${JSON.stringify(rejectData, null, 2)}`);
    } else {
      const errorText = await rejectResponse.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
    
    // 2. Verificar endpoint de aprobación (estructuralmente)
    console.log('\n2. Verificando disponibilidad de endpoint approve...');
    const approveTestResponse = await fetch(`${baseURL}/approvals/${testReport.id}/approve`, {
      method: 'HEAD', // Solo verificar que existe
      headers
    });
    
    console.log(`   Status HEAD: ${approveTestResponse.status}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApprovalEndpoints();
