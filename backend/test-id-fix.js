const axios = require('axios');

async function testSpecificID() {
  console.log('🔧 Probando un ID específico para verificar el fix...\n');
  
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');
    
    // Primero obtener lista de actividades para un ID válido
    console.log('📋 Obteniendo lista de actividades...');
    const listResponse = await axios.get('http://localhost:3001/api/activities', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (listResponse.data.data?.length > 0) {
      const firstActivity = listResponse.data.data[0];
      const activityId = firstActivity.id;
      console.log('🎯 Probando con ID válido:', activityId);
      
      // Probar endpoint /:id con ID válido
      const specificResponse = await axios.get(`http://localhost:3001/api/activities/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Endpoint /:id funciona! Status:', specificResponse.status);
      console.log('📊 Actividad:', specificResponse.data.name);
      
      // Ahora probar nuestro endpoint específico
      console.log('\n🆕 Probando /api/activities/list-for-tracking...');
      const trackingResponse = await axios.get('http://localhost:3001/api/activities/list-for-tracking', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ List-for-tracking funciona! Status:', trackingResponse.status);
      console.log('📊 Actividades:', trackingResponse.data.data?.length);
      
    } else {
      console.log('❌ No hay actividades disponibles');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSpecificID();
