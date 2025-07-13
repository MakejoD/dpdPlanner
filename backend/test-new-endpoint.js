const axios = require('axios');

async function testNewTrackingEndpoint() {
  console.log('🔧 Probando el nuevo endpoint list-for-tracking...\n');
  
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');
    
    // Probar nuevo endpoint
    console.log('🆕 Probando /api/activities/list-for-tracking...');
    const response = await axios.get('http://localhost:3001/api/activities/list-for-tracking', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Respuesta exitosa!');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Actividades encontradas:', response.data.data?.length || 0);
    
    if (response.data.data?.length > 0) {
      const activity = response.data.data[0];
      console.log('\n🎯 Ejemplo de actividad:');
      console.log('  - Nombre:', activity.name);
      console.log('  - ID:', activity.id);
      console.log('  - Indicadores:', activity.indicators?.length || 0);
      console.log('  - Tracking info:', !!activity.tracking);
      
      if (activity.tracking) {
        console.log('  - Período actual:', activity.tracking.currentPeriod);
        console.log('  - Meta recomendada:', activity.tracking.recommendedTargetValue);
        console.log('  - Reportes previos:', activity.tracking.hasRecentReport ? 'Sí' : 'No');
      }
    }
    
    console.log('\n📊 Metadata:');
    console.log(response.data.metadata);
    
    console.log('\n✅ ¡Test completado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testNewTrackingEndpoint();
