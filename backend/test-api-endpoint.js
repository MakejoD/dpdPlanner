const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔗 Probando endpoint /api/progress-reports...');
    
    const response = await axios.get('http://localhost:3001/api/progress-reports');
    console.log('✅ Status:', response.status);
    console.log('📊 Datos recibidos:', response.data.data?.length || 0, 'informes');
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('🔍 Primer informe:');
      const report = response.data.data[0];
      console.log('- ID:', report.id);
      console.log('- Actividad/Indicador:', report.activity?.name || report.indicator?.name);
      console.log('- Estado:', report.status);
      console.log('- Período:', report.periodType, report.period);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
