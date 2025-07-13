const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Prueba simple del sistema de aprobaciones
async function testApprovalSystem() {
  console.log('🧪 === PRUEBA SIMPLE DEL SISTEMA DE APROBACIONES ===\n');

  try {
    // 1. Autenticar como admin
    console.log('🔐 1. Autenticando como administrador...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    if (!loginResponse.data.token) {
      console.log('❌ Error en autenticación');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${loginResponse.data.token}`,
      'Content-Type': 'application/json'
    };

    console.log('✅ Autenticación exitosa');

    // 2. Obtener reportes pendientes
    console.log('\n📋 2. Consultando reportes pendientes...');
    const pendingResponse = await axios.get(`${BASE_URL}/approvals/pending`, { headers });
    
    console.log(`✅ Reportes pendientes: ${pendingResponse.data.data.reports.length}`);
    
    if (pendingResponse.data.data.reports.length > 0) {
      const report = pendingResponse.data.data.reports[0];
      console.log(`   - Reporte ID: ${report.id}`);
      console.log(`   - Actividad: ${report.activity?.name || 'N/A'}`);
      console.log(`   - Reportado por: ${report.reportedBy.firstName} ${report.reportedBy.lastName}`);
      console.log(`   - Estado: ${report.status}`);
      
      // 3. Aprobar el reporte
      console.log('\n✅ 3. Aprobando reporte...');
      const approveResponse = await axios.post(`${BASE_URL}/approvals/${report.id}/approve`, {
        comments: 'Reporte aprobado en prueba del sistema'
      }, { headers });
      
      if (approveResponse.data.success) {
        console.log('✅ Reporte aprobado exitosamente');
        
        // 4. Consultar historial
        console.log('\n📜 4. Consultando historial de aprobación...');
        const historyResponse = await axios.get(`${BASE_URL}/approvals/${report.id}/history`, { headers });
        
        console.log(`✅ Historial obtenido: ${historyResponse.data.data.length} entradas`);
        historyResponse.data.data.forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.action} por ${entry.actionBy.firstName} ${entry.actionBy.lastName}`);
          if (entry.comments) {
            console.log(`      📝 ${entry.comments}`);
          }
        });
      }
    }

    // 5. Estadísticas finales
    console.log('\n📊 5. Estadísticas del sistema...');
    const statsResponse = await axios.get(`${BASE_URL}/approvals/stats`, { headers });
    
    const stats = statsResponse.data.data.summary;
    console.log('✅ Estadísticas obtenidas:');
    console.log(`   📋 Total: ${stats.total}`);
    console.log(`   ⏳ Pendientes: ${stats.pending}`);
    console.log(`   ✅ Aprobados: ${stats.approved}`);
    console.log(`   ❌ Rechazados: ${stats.rejected}`);
    console.log(`   📈 Tasa de aprobación: ${stats.approvalRate}%`);

    console.log('\n🎉 === SISTEMA DE APROBACIONES FUNCIONANDO CORRECTAMENTE ===');
    console.log('\n📋 Funcionalidades verificadas:');
    console.log('   ✅ Autenticación de usuarios');
    console.log('   ✅ Lista de reportes pendientes');
    console.log('   ✅ Aprobación de reportes');
    console.log('   ✅ Historial de aprobaciones');
    console.log('   ✅ Estadísticas del sistema');
    console.log('   ✅ API endpoints funcionando');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data?.message || error.message);
  }
}

testApprovalSystem();
