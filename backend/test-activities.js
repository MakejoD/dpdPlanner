// test-activities.js - Script para probar la API de actividades
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Usuario de prueba
const testUser = {
  email: 'admin@poa.gov',
  password: 'admin123'
};

let authToken = null;

// Función para autenticar
async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Autenticación exitosa');
      return true;
    }
  } catch (error) {
    console.error('❌ Error en autenticación:', error.response?.data || error.message);
    return false;
  }
}

// Función para hacer peticiones autenticadas
function createAuthenticatedRequest() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
}

// Probar obtener actividades
async function testGetActivities() {
  console.log('\n🔍 Probando GET /activities...');
  try {
    const api = createAuthenticatedRequest();
    const response = await api.get('/activities');
    
    if (response.data.success) {
      const activities = response.data.data.activities || response.data.data;
      console.log(`✅ ${Array.isArray(activities) ? activities.length : 'Unknown count'} actividades encontradas`);
      console.log('📊 Estructura de respuesta:', {
        success: response.data.success,
        hasData: !!response.data.data,
        message: response.data.message
      });
      
      if (Array.isArray(activities) && activities.length > 0) {
        const activity = activities[0];
        console.log('📝 Ejemplo de actividad:', {
          id: activity.id,
          name: activity.name,
          code: activity.code,
          status: activity.status,
          product: activity.product?.name
        });
      }
    } else {
      console.log('❌ Respuesta no exitosa:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Probar obtener actividades por producto
async function testGetActivitiesByProduct() {
  console.log('\n🎯 Probando filtro por producto...');
  try {
    const api = createAuthenticatedRequest();
    
    // Primero obtener un producto
    const productsResponse = await api.get('/products');
    if (!productsResponse.data.success || productsResponse.data.data.length === 0) {
      console.log('❌ No hay productos para probar el filtro');
      return;
    }
    
    const productId = productsResponse.data.data[0].id;
    console.log(`🔍 Probando filtro con producto: ${productsResponse.data.data[0].name}`);
    
    const response = await api.get(`/activities?productId=${productId}`);
    
    if (response.data.success) {
      const activities = response.data.data.activities || response.data.data;
      console.log(`✅ ${Array.isArray(activities) ? activities.length : 'Unknown count'} actividades encontradas para el producto`);
    } else {
      console.log('❌ Error al filtrar:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Probar crear actividad
async function testCreateActivity() {
  console.log('\n➕ Probando POST /activities...');
  try {
    const api = createAuthenticatedRequest();
    
    // Obtener un producto para asociar
    const productsResponse = await api.get('/products');
    if (!productsResponse.data.success || productsResponse.data.data.length === 0) {
      console.log('❌ No hay productos para crear una actividad');
      return null;
    }
    
    const productId = productsResponse.data.data[0].id;
    
    const newActivity = {
      name: 'Actividad de Prueba API',
      description: 'Actividad creada para probar la API',
      code: `ACT-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`,
      productId: productId,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      order: 100,
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      budgetAllocated: 50000
    };
    
    const response = await api.post('/activities', newActivity);
    
    if (response.data.message === 'Actividad creada exitosamente' || response.data.success) {
      console.log('✅ Actividad creada exitosamente');
      console.log('📝 Actividad creada:', response.data.data.name);
      return response.data.data.id;
    } else {
      console.log('❌ Error al crear:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

// Probar actualizar actividad
async function testUpdateActivity(activityId) {
  if (!activityId) return;
  
  console.log('\n✏️ Probando PUT /activities...');
  try {
    const api = createAuthenticatedRequest();
    
    const updateData = {
      name: 'Actividad de Prueba API Actualizada',
      description: 'Actividad actualizada para probar la API',
      code: 'ACT-999-01-02',
      productId: (await api.get('/products')).data.data[0].id,
      startDate: '2025-02-01',
      endDate: '2025-11-30',
      order: 200,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      budgetAllocated: 75000
    };
    
    const response = await api.put(`/activities/${activityId}`, updateData);
    
    if (response.data.message === 'Actividad actualizada exitosamente' || response.data.success) {
      console.log('✅ Actividad actualizada exitosamente');
      console.log('📝 Actividad actualizada:', response.data.data.name);
    } else {
      console.log('❌ Error al actualizar:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Probar eliminar actividad
async function testDeleteActivity(activityId) {
  if (!activityId) return;
  
  console.log('\n🗑️ Probando DELETE /activities...');
  try {
    const api = createAuthenticatedRequest();
    const response = await api.delete(`/activities/${activityId}`);
    
    if (response.data.message === 'Actividad eliminada exitosamente' || response.data.success) {
      console.log('✅ Actividad eliminada exitosamente');
      console.log('📝 Actividad eliminada:', response.data.data?.name || response.data.message);
    } else {
      console.log('❌ Error al eliminar:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🧪 Iniciando pruebas de API de Actividades\n');
  
  // Autenticar
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('❌ No se pudo autenticar. Terminando pruebas.');
    return;
  }
  
  // Ejecutar pruebas
  await testGetActivities();
  await testGetActivitiesByProduct();
  
  // Pruebas CRUD
  const activityId = await testCreateActivity();
  await testUpdateActivity(activityId);
  await testDeleteActivity(activityId);
  
  console.log('\n🎉 Pruebas de API de Actividades completadas');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  authenticate,
  testGetActivities,
  testCreateActivity,
  testUpdateActivity,
  testDeleteActivity
};
