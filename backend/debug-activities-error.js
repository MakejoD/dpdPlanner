// Debug específico para el error en loadActivities
const axios = require('axios');

async function debugActivitiesError() {
  try {
    console.log('🔐 Login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('📋 Probando endpoint /activities exactamente como en ActivityManagement...');
    const response = await axios.get('http://localhost:3001/api/activities', { headers });
    
    console.log('📊 Análisis de respuesta:');
    console.log('Status HTTP:', response.status);
    console.log('response.data.success:', response.data.success);
    console.log('response.data.message:', response.data.message);
    console.log('response.data.data existente:', !!response.data.data);
    console.log('response.data.data.activities existente:', !!response.data.data?.activities);
    console.log('Cantidad de actividades:', response.data.data?.activities?.length);
    
    // Simular la lógica exacta del frontend
    if (response.data.success) {
      const activitiesData = response.data.data.activities || [];
      console.log('\n✅ Lógica del frontend - SUCCESS PATH:');
      console.log('Actividades cargadas:', activitiesData.length);
    } else {
      console.log('\n❌ Lógica del frontend - ERROR PATH:');
      console.log('Mensaje de error que se mostraría:', response.data.message || 'Error al cargar actividades');
    }

  } catch (error) {
    console.log('\n💥 CATCH BLOCK - Error capturado:');
    console.log('Error message:', error.message);
    console.log('Error response:', error.response?.data);
  }
}

debugActivitiesError();
