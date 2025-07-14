const { default: fetch } = require('node-fetch');

async function testCorrectedEndpoints() {
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
    
    // Probar endpoint de rechazo con la estructura correcta
    console.log('\n🧪 Probando endpoint de rechazo con estructura corregida...');
    const rejectResponse = await fetch(`${baseURL}/approvals/${testReport.id}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        rejectionReason: 'El informe requiere más información sobre los indicadores utilizados para la medición.',
        comments: 'Por favor, incluir detalles adicionales sobre la metodología.'
      })
    });
    
    console.log(`   Status: ${rejectResponse.status}`);
    
    if (rejectResponse.ok) {
      const rejectData = await rejectResponse.json();
      console.log('   ✅ Rechazo exitoso');
      console.log(`   Mensaje: ${rejectData.message}`);
      
      // Verificar que el estado cambió
      console.log('\n📊 Verificando estado actualizado...');
      const updatedResponse = await fetch(`${baseURL}/progress-reports`, { headers });
      const updatedData = await updatedResponse.json();
      
      const updatedReport = updatedData.data.find(r => r.id === testReport.id);
      if (updatedReport) {
        console.log(`   Estado del informe: ${updatedReport.status}`);
        console.log(`   Razón de rechazo: ${updatedReport.rejectionReason || 'No especificada'}`);
      }
      
    } else {
      const errorText = await rejectResponse.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCorrectedEndpoints();
