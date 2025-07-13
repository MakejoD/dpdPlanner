const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';

// Test credentials
const testCredentials = {
  email: 'admin@poa.gov',
  password: 'admin123'
};

async function testLogin() {
  try {
    console.log('🔐 Probando login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login exitoso');
      return true;
    } else {
      console.log('❌ Login fallido: No se recibió token');
      return false;
    }
  } catch (error) {
    console.log('❌ Error en login:', error.response?.data?.message || error.message);
    return false;
  }
}

const headers = () => ({
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
});

async function testGetIndicators() {
  try {
    console.log('\n📋 Probando GET /api/indicators...');
    const response = await axios.get(`${BASE_URL}/indicators`, { headers: headers() });
    
    if (response.data.success) {
      console.log('✅ GET indicadores exitoso');
      const { total, page, totalPages } = response.data.data;
      console.log(`📊 Total: ${total}, Página: ${page}/${totalPages}`);
      return response.data.data.indicators || [];
    } else {
      console.log('❌ GET indicadores fallido:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Error en GET indicadores:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testCreateIndicator() {
  try {
    console.log('\n➕ Probando POST /api/indicators...');
    
    // Primero obtengo las opciones de niveles para usar un ID válido
    const levelsResponse = await axios.get(`${BASE_URL}/indicators/levels/options`, { headers: headers() });
    const { strategicAxes } = levelsResponse.data.data;
    
    const newIndicator = {
      name: 'Indicador de Prueba API',
      description: 'Indicador creado para probar la API',
      type: 'PRODUCT',
      measurementUnit: 'Porcentaje',
      annualTarget: 85.5,
      baseline: 60.0,
      q1Target: 70.0,
      q2Target: 75.0,
      q3Target: 80.0,
      q4Target: 85.5,
      strategicAxisId: strategicAxes[0]?.id // Usar el primer eje estratégico disponible
    };

    const response = await axios.post(`${BASE_URL}/indicators`, newIndicator, { headers: headers() });
    
    if (response.data.success) {
      console.log('✅ POST indicador exitoso');
      console.log(`📝 Creado: "${response.data.data.name}" (ID: ${response.data.data.id})`);
      return response.data.data;
    } else {
      console.log('❌ POST indicador fallido:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error en POST indicador:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.log('🔍 Errores de validación:', error.response.data.errors);
    }
    return null;
  }
}

async function testGetIndicatorById(indicatorId) {
  try {
    console.log(`\n🔍 Probando GET /api/indicators/${indicatorId}...`);
    const response = await axios.get(`${BASE_URL}/indicators/${indicatorId}`, { headers: headers() });
    
    if (response.data.success) {
      console.log('✅ GET indicador por ID exitoso');
      console.log(`📄 Indicador: "${response.data.data.name}"`);
      return response.data.data;
    } else {
      console.log('❌ GET indicador por ID fallido:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error en GET indicador por ID:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUpdateIndicator(indicatorId) {
  try {
    console.log(`\n✏️ Probando PUT /api/indicators/${indicatorId}...`);
    
    const updateData = {
      name: 'Indicador de Prueba API (Actualizado)',
      description: 'Indicador actualizado mediante prueba de API',
      type: 'RESULT',
      measurementUnit: 'Unidades',
      annualTarget: 95.0,
      baseline: 65.0
    };

    const response = await axios.put(`${BASE_URL}/indicators/${indicatorId}`, updateData, { headers: headers() });
    
    if (response.data.success) {
      console.log('✅ PUT indicador exitoso');
      console.log(`📝 Actualizado: "${response.data.data.name}"`);
      return response.data.data;
    } else {
      console.log('❌ PUT indicador fallido:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error en PUT indicador:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.log('🔍 Errores de validación:', error.response.data.errors);
    }
    return null;
  }
}

async function testDeleteIndicator(indicatorId) {
  try {
    console.log(`\n🗑️ Probando DELETE /api/indicators/${indicatorId}...`);
    const response = await axios.delete(`${BASE_URL}/indicators/${indicatorId}`, { headers: headers() });
    
    if (response.data.success) {
      console.log('✅ DELETE indicador exitoso');
      console.log(`🗑️ Eliminado: ${response.data.message}`);
      return true;
    } else {
      console.log('❌ DELETE indicador fallido:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error en DELETE indicador:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testIndicatorLevels() {
  try {
    console.log('\n🏗️ Probando GET /api/indicators/levels/options...');
    const response = await axios.get(`${BASE_URL}/indicators/levels/options`, { headers: headers() });
    
    if (response.data.success) {
      console.log('✅ GET niveles de indicadores exitoso');
      const { strategicAxes, objectives, products, activities } = response.data.data;
      console.log(`📊 Ejes: ${strategicAxes?.length || 0}, Objetivos: ${objectives?.length || 0}, Productos: ${products?.length || 0}, Actividades: ${activities?.length || 0}`);
      return response.data.data;
    } else {
      console.log('❌ GET niveles fallido:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error en GET niveles:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 === PRUEBAS DE API DE INDICADORES ===\n');
  
  // 1. Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ No se puede continuar sin autenticación');
    return;
  }

  // 2. Obtener niveles disponibles
  await testIndicatorLevels();

  // 3. Obtener indicadores existentes
  const existingIndicators = await testGetIndicators();

  // 4. Crear nuevo indicador
  const newIndicator = await testCreateIndicator();
  if (!newIndicator) {
    console.log('\n❌ No se puede continuar sin crear un indicador');
    return;
  }

  // 5. Obtener indicador por ID
  await testGetIndicatorById(newIndicator.id);

  // 6. Actualizar indicador
  await testUpdateIndicator(newIndicator.id);

  // 7. Obtener indicadores nuevamente (para ver cambios)
  await testGetIndicators();

  // 8. Eliminar indicador de prueba
  await testDeleteIndicator(newIndicator.id);

  // 9. Verificar eliminación
  await testGetIndicators();

  console.log('\n🏁 === PRUEBAS COMPLETADAS ===');
}

// Ejecutar las pruebas
runTests().catch(console.error);
