const { default: fetch } = require('node-fetch');

async function testIndicatorPeriodicity() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🔐 Iniciando sesión...');
    
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
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Login exitoso');
    
    // Crear un indicador mensual de prueba
    console.log('\n📝 Creando indicador mensual de prueba...');
    const newIndicator = {
      name: 'Indicador Mensual de Prueba',
      description: 'Indicador con periodicidad mensual para testing',
      type: 'PRODUCT',
      measurementUnit: 'Unidades',
      baseline: 0,
      annualTarget: 1200,
      reportingFrequency: 'MONTHLY',
      jan_target: 100,
      feb_target: 100,
      mar_target: 100,
      apr_target: 100,
      may_target: 100,
      jun_target: 100,
      jul_target: 100,
      aug_target: 100,
      sep_target: 100,
      oct_target: 100,
      nov_target: 100,
      dec_target: 100,
      strategicAxisId: '', // Necesitaremos obtener un ID válido
      isActive: true
    };
    
    // Primero obtener un eje estratégico para vincular
    console.log('🔍 Obteniendo ejes estratégicos...');
    const axesResponse = await fetch(`${baseURL}/strategic-axes`, { headers });
    const axesData = await axesResponse.json();
    
    if (axesData.success && axesData.data.length > 0) {
      newIndicator.strategicAxisId = axesData.data[0].id;
      console.log(`📌 Vinculando al eje: ${axesData.data[0].name}`);
      
      // Crear el indicador
      const createResponse = await fetch(`${baseURL}/indicators`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newIndicator)
      });
      
      console.log(`Status: ${createResponse.status}`);
      
      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log('✅ Indicador mensual creado exitosamente');
        console.log(`   ID: ${createData.data.id}`);
        console.log(`   Frecuencia: ${createData.data.reportingFrequency}`);
        console.log(`   Meta Enero: ${createData.data.jan_target}`);
        console.log(`   Meta Anual: ${createData.data.annualTarget}`);
        
        // Probar la obtención de indicadores con los nuevos campos
        console.log('\n📊 Obteniendo todos los indicadores...');
        const indicatorsResponse = await fetch(`${baseURL}/indicators`, { headers });
        const indicatorsData = await indicatorsResponse.json();
        
        if (indicatorsData.success) {
          const indicators = indicatorsData.data.indicators || [];
          console.log(`📈 Total de indicadores: ${indicators.length}`);
          
          const monthlyIndicators = indicators.filter(ind => ind.reportingFrequency === 'MONTHLY');
          const quarterlyIndicators = indicators.filter(ind => ind.reportingFrequency === 'QUARTERLY');
          
          console.log(`   📅 Mensuales: ${monthlyIndicators.length}`);
          console.log(`   📅 Trimestrales: ${quarterlyIndicators.length}`);
          
          if (monthlyIndicators.length > 0) {
            console.log('\n🔍 Ejemplo de indicador mensual:');
            const monthlyExample = monthlyIndicators[0];
            console.log(`   Nombre: ${monthlyExample.name}`);
            console.log(`   Frecuencia: ${monthlyExample.reportingFrequency}`);
            console.log(`   Metas mensuales: Ene=${monthlyExample.jan_target}, Feb=${monthlyExample.feb_target}, Mar=${monthlyExample.mar_target}`);
          }
        }
        
      } else {
        const errorText = await createResponse.text();
        console.log(`❌ Error al crear indicador: ${errorText}`);
      }
      
    } else {
      console.log('❌ No se encontraron ejes estratégicos para vincular el indicador');
    }
    
    console.log('\n🎯 Prueba de periodicidad completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testIndicatorPeriodicity();
