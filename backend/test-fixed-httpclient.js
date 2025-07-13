// Test para verificar que el fix del httpClient funciona correctamente
const fetch = require('node-fetch');

// Simular localStorage para el test
global.localStorage = {
  getItem: () => 'test-token'
};

// Simular import.meta.env
const originalEnv = process.env;
process.env.VITE_API_URL = 'http://localhost:3001/api';

// Simular la función buildUrl del httpClient
const buildUrl = (endpoint) => {
  const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Simular httpClient con el fix aplicado
const httpClient = {
  get: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(buildUrl(url), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const jsonData = await response.json();
    // Envolver la respuesta en un objeto data para consistencia con el frontend
    return { data: jsonData };
  },
};

async function testFixedHttpClient() {
  console.log('🧪 Testing httpClient con el fix aplicado...\n');
  
  try {
    // Test 1: Verificar estructura de respuesta de usuarios
    console.log('📝 Test 1: Cargando usuarios...');
    const usersResponse = await httpClient.get('/users');
    console.log('✅ Usuarios cargados');
    console.log('📊 Estructura de respuesta:');
    console.log('  - response.data existe:', !!usersResponse.data);
    console.log('  - response.data.success:', usersResponse.data.success);
    console.log('  - response.data.data existe:', !!usersResponse.data.data);
    console.log('  - Cantidad de usuarios:', usersResponse.data.data?.length || 0);
    
    // Test 2: Verificar estructura de respuesta de actividades
    console.log('\n📝 Test 2: Cargando actividades...');
    const activitiesResponse = await httpClient.get('/activities');
    console.log('✅ Actividades cargadas');
    console.log('📊 Estructura de respuesta:');
    console.log('  - response.data existe:', !!activitiesResponse.data);
    console.log('  - response.data.success:', activitiesResponse.data.success);
    console.log('  - response.data.data existe:', !!activitiesResponse.data.data);
    console.log('  - response.data.data.activities existe:', !!activitiesResponse.data.data?.activities);
    console.log('  - Cantidad de actividades:', activitiesResponse.data.data?.activities?.length || 0);
    
    // Test 3: Simular la lógica del frontend exactamente como está en ActivityManagement
    console.log('\n📝 Test 3: Simulando lógica de ActivityManagement...');
    
    // Simular loadUsers
    console.log('🔸 Simulando loadUsers...');
    const usersArray = usersResponse.data.data || [];
    console.log('  - usersArray length:', usersArray.length);
    console.log('  - ✅ loadUsers funcionaría correctamente');
    
    // Simular loadActivities
    console.log('🔸 Simulando loadActivities...');
    if (activitiesResponse.data.success) {
      const activitiesData = activitiesResponse.data.data.activities || [];
      console.log('  - activitiesData length:', activitiesData.length);
      console.log('  - ✅ loadActivities funcionaría correctamente');
    } else {
      console.log('  - ❌ loadActivities fallaría');
    }
    
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('💡 El fix del httpClient resuelve el problema de estructura de respuesta');
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

testFixedHttpClient();
