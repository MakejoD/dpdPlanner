// Test objectives API
const axios = require('axios');

async function testObjectives() {
  try {
    console.log('🎯 Probando API de Objetivos...');
    
    // Login first
    const login = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = login.data.token;
    console.log('✅ Login exitoso');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test objectives endpoint
    const response = await axios.get('http://localhost:3001/api/objectives', { headers });
    
    console.log('✅ API de Objetivos funcionando:');
    console.log(`- Encontrados ${response.data.data.length} objetivos`);
    console.log(`- Mensaje: ${response.data.message || 'Sin mensaje'}`);
    console.log(`- Estructura: success=${response.data.success}`);
    
    if (response.data.data.length > 0) {
      console.log('\n📋 Primer objetivo:');
      const firstObjective = response.data.data[0];
      console.log(`- ID: ${firstObjective.id}`);
      console.log(`- Nombre: ${firstObjective.name}`);
      console.log(`- Código: ${firstObjective.code}`);
      console.log(`- Eje estratégico: ${firstObjective.strategicAxis?.name || 'N/A'}`);
      console.log(`- Productos: ${firstObjective._count?.products || 0}`);
      console.log(`- Indicadores: ${firstObjective._count?.indicators || 0}`);
    }
    
    // Test by strategic axis
    if (response.data.data.length > 0) {
      const firstAxisId = response.data.data[0].strategicAxisId;
      const byAxisResponse = await axios.get(`http://localhost:3001/api/objectives/by-strategic-axis/${firstAxisId}`, { headers });
      console.log(`\n✅ Objetivos por eje estratégico: ${byAxisResponse.data.data.length} objetivos`);
    }
    
    console.log('\n🎉 ¡API de Objetivos funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

testObjectives();
