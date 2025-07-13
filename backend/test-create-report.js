const axios = require('axios');

async function testCreateReport() {
  try {
    console.log('🔍 Probando creación de reporte...');
    
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'juan.perez@poa.gov',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // Crear reporte
    const reportData = {
      activityId: 'f46dd88b-860c-469e-bf0f-abaf05eee475',
      periodType: 'trimestral',
      period: '2024-Q3',
      currentValue: 15,
      targetValue: 25,
      executionPercentage: 60,
      qualitativeComments: 'Se ha iniciado el proceso de capacitación',
      challenges: 'Algunos usuarios requieren más tiempo',
      nextSteps: 'Continuar con las capacitaciones'
    };

    const reportResponse = await axios.post(
      'http://localhost:3001/api/progress-reports',
      reportData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Reporte creado exitosamente:');
    console.log(`🆔 ID: ${reportResponse.data.id}`);
    console.log(`📊 Progreso: ${reportResponse.data.executionPercentage}%`);
    console.log(`📋 Estado: ${reportResponse.data.status}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCreateReport();
