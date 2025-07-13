const axios = require('axios');

async function testTrackingInfo() {
  console.log('🔧 Iniciando prueba del endpoint tracking-info...\n');
  
  try {
    // 1. Login
    console.log('🔐 Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');
    
    // 2. Probar endpoint original (para comparar)
    console.log('📋 Probando endpoint original /activities...');
    const originalResponse = await axios.get('http://localhost:3001/api/activities', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Original: ${originalResponse.data.data?.length || 0} actividades\n`);
    
    // 3. Probar nuevo endpoint
    console.log('🆕 Probando nuevo endpoint /activities/tracking-info...');
    const trackingResponse = await axios.get('http://localhost:3001/api/activities/tracking-info', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Tracking-info funciona! Status:', trackingResponse.status);
    console.log('📊 Actividades encontradas:', trackingResponse.data.data?.length || 0);
    
    if (trackingResponse.data.data?.length > 0) {
      const activity = trackingResponse.data.data[0];
      console.log('\n🎯 Ejemplo de actividad:');
      console.log('  - Nombre:', activity.name);
      console.log('  - ID:', activity.id);
      console.log('  - Indicadores:', activity.indicators?.length || 0);
      console.log('  - Tracking data:', !!activity.tracking);
      
      if (activity.tracking) {
        console.log('  - Período actual:', activity.tracking.currentPeriod);
        console.log('  - Meta recomendada:', activity.tracking.recommendedTargetValue);
        console.log('  - Reportes previos:', activity.tracking.previousReports?.length || 0);
      }
      
      if (activity.indicators?.length > 0) {
        const indicator = activity.indicators[0];
        console.log('\n📈 Primer indicador:');
        console.log('  - Nombre:', indicator.name);
        console.log('  - Metas trimestrales:', indicator.quarterlyTargets?.length || 0);
      }
    }
    
    console.log('\n📊 Metadata:', trackingResponse.data.metadata);
    console.log('\n✅ ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error durante la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testTrackingInfo();
