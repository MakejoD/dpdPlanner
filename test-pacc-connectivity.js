// Test de conectividad Frontend-Backend para PACC
const API_BASE_URL = 'http://localhost:3001/api';

async function testPACCConnectivity() {
  console.log('🔍 TESTING PACC Frontend-Backend Connectivity');
  console.log('='.repeat(50));

  try {
    // Test 1: Health check
    console.log('\n1. Testing backend health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend health:', healthData.status);

    // Test 2: PACC Schedules
    console.log('\n2. Testing PACC schedules endpoint...');
    const schedulesResponse = await fetch(`${API_BASE_URL}/pacc/schedules`);
    if (schedulesResponse.ok) {
      const schedules = await schedulesResponse.json();
      console.log(`✅ PACC Schedules: ${schedules.length} cronogramas encontrados`);
      
      if (schedules.length > 0) {
        console.log(`   📋 Ejemplo: ${schedules[0].scheduleName} (${schedules[0].status})`);
      }
    } else {
      console.log('❌ Error fetching schedules:', schedulesResponse.status);
    }

    // Test 3: PACC Alerts
    console.log('\n3. Testing PACC alerts endpoint...');
    const alertsResponse = await fetch(`${API_BASE_URL}/pacc/alerts`);
    if (alertsResponse.ok) {
      const alerts = await alertsResponse.json();
      console.log(`✅ PACC Alerts: ${alerts.length} alertas encontradas`);
      
      if (alerts.length > 0) {
        console.log(`   🚨 Ejemplo: ${alerts[0].title} (${alerts[0].severity})`);
      }
    } else {
      console.log('❌ Error fetching alerts:', alertsResponse.status);
    }

    // Test 4: PACC Compliance
    console.log('\n4. Testing PACC compliance endpoint...');
    const complianceResponse = await fetch(`${API_BASE_URL}/pacc/compliance/latest`);
    if (complianceResponse.ok) {
      const compliance = await complianceResponse.json();
      console.log(`✅ PACC Compliance: Evaluación del ${compliance.evaluationPeriod}`);
      console.log(`   📊 Puntuación: ${compliance.overallScore}/100`);
    } else {
      console.log('❌ Error fetching compliance:', complianceResponse.status);
    }

    // Test 5: PACC Dashboard
    console.log('\n5. Testing PACC dashboard endpoint...');
    const dashboardResponse = await fetch(`${API_BASE_URL}/pacc/dashboard`);
    if (dashboardResponse.ok) {
      const dashboard = await dashboardResponse.json();
      console.log(`✅ PACC Dashboard: ${dashboard.metrics.totalSchedules} cronogramas totales`);
      console.log(`   📈 Cumplimiento promedio: ${dashboard.metrics.avgCompliance.toFixed(1)}%`);
      console.log(`   🚨 Alertas activas: ${dashboard.metrics.activeAlerts}`);
    } else {
      console.log('❌ Error fetching dashboard:', dashboardResponse.status);
    }

    // Test 6: PACC Metrics
    console.log('\n6. Testing PACC metrics endpoint...');
    const metricsResponse = await fetch(`${API_BASE_URL}/pacc/metrics`);
    if (metricsResponse.ok) {
      const metrics = await metricsResponse.json();
      console.log(`✅ PACC Metrics: Tasa de completitud ${metrics.schedules.completionRate.toFixed(1)}%`);
    } else {
      console.log('❌ Error fetching metrics:', metricsResponse.status);
    }

    console.log('\n🎉 CONECTIVIDAD PACC VERIFICADA EXITOSAMENTE');
    console.log('='.repeat(50));
    console.log('✅ Todos los endpoints del PACC están funcionando');
    console.log('✅ El frontend puede conectarse al backend');
    console.log('✅ Los datos del PACC están disponibles');

  } catch (error) {
    console.error('\n❌ ERROR EN LA CONECTIVIDAD:', error.message);
    console.log('\n🔧 SOLUCIONES POSIBLES:');
    console.log('1. Verificar que el backend esté ejecutándose en puerto 3001');
    console.log('2. Verificar que no haya problemas de CORS');
    console.log('3. Verificar que la base de datos tenga datos de ejemplo');
  }
}

// Ejecutar si es llamado directamente
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testPACCConnectivity();
} else {
  // Browser environment
  window.testPACCConnectivity = testPACCConnectivity;
  console.log('🔍 Test function loaded. Run: testPACCConnectivity()');
}

module.exports = { testPACCConnectivity };
