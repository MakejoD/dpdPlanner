const { default: fetch } = require('node-fetch');

async function testProgressReportsEndpoints() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🔐 Iniciando sesión para obtener token...');
    
    // 1. Login para obtener token
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
    
    if (!loginResponse.ok) {
      console.log('❌ Error en login:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('📄 Respuesta completa del login:', JSON.stringify(loginData, null, 2));
    
    // Manejar diferentes estructuras de respuesta
    const token = loginData.token || loginData.data?.token;
    if (!token) {
      console.log('❌ No se pudo obtener el token');
      return;
    }
    console.log('✅ Login exitoso, token obtenido');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Probar endpoint de informes de progreso
    console.log('\n📋 Probando endpoint /progress-reports...');
    const reportsResponse = await fetch(`${baseURL}/progress-reports`, {
      headers
    });
    
    if (!reportsResponse.ok) {
      console.log('❌ Error en progress-reports:', reportsResponse.status);
      const errorText = await reportsResponse.text();
      console.log('Error:', errorText);
      return;
    }
    
    const reportsData = await reportsResponse.json();
    console.log('✅ Respuesta de progress-reports:');
    console.log('Status:', reportsResponse.status);
    console.log('Reports count:', reportsData.data?.length || 0);
    
    if (reportsData.data && reportsData.data.length > 0) {
      console.log('\n📊 Primeros 3 informes:');
      reportsData.data.slice(0, 3).forEach((report, index) => {
        console.log(`${index + 1}. ID: ${report.id}`);
        console.log(`   Estado: ${report.status}`);
        console.log(`   Período: ${report.period} (${report.periodType})`);
        console.log(`   Reportado por: ${report.reportedBy?.firstName} ${report.reportedBy?.lastName}`);
        console.log(`   Fecha: ${report.createdAt}`);
        console.log('---');
      });
      
      // Contar por estado
      const statusCounts = {};
      reportsData.data.forEach(report => {
        statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
      });
      
      console.log('\n📈 Resumen por estado:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }
    
    // 3. Probar endpoint de asignaciones
    console.log('\n🎯 Probando endpoint /activities/list-for-tracking...');
    const activitiesResponse = await fetch(`${baseURL}/activities/list-for-tracking`, {
      headers
    });
    
    if (!activitiesResponse.ok) {
      console.log('❌ Error en activities/list-for-tracking:', activitiesResponse.status);
    } else {
      const activitiesData = await activitiesResponse.json();
      console.log('✅ Actividades para tracking:', activitiesData.data?.length || 0);
    }
    
    // 4. Probar endpoint de aprobaciones pendientes
    console.log('\n⏳ Probando endpoint /approvals/pending...');
    const approvalsResponse = await fetch(`${baseURL}/approvals/pending`, {
      headers
    });
    
    if (!approvalsResponse.ok) {
      console.log('❌ Error en approvals/pending:', approvalsResponse.status);
      const errorText = await approvalsResponse.text();
      console.log('Error:', errorText);
    } else {
      const approvalsData = await approvalsResponse.json();
      console.log('✅ Aprobaciones pendientes:', approvalsData.data?.length || 0);
      
      if (approvalsData.data && approvalsData.data.length > 0) {
        console.log('📋 Informes pendientes de aprobación:');
        approvalsData.data.forEach((report, index) => {
          console.log(`${index + 1}. ${report.period} - ${report.reportedBy?.firstName} ${report.reportedBy?.lastName}`);
        });
      }
    }
    
    // 5. Probar estadísticas de aprobaciones
    console.log('\n📊 Probando endpoint /approvals/stats...');
    const statsResponse = await fetch(`${baseURL}/approvals/stats`, {
      headers
    });
    
    if (!statsResponse.ok) {
      console.log('❌ Error en approvals/stats:', statsResponse.status);
    } else {
      const statsData = await statsResponse.json();
      console.log('✅ Estadísticas de aprobaciones:');
      console.log(JSON.stringify(statsData.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

testProgressReportsEndpoints();
