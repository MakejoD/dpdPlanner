// Simulación exacta del httpClient tal como está en el frontend
const API_BASE_URL = 'http://localhost:3001/api';

// Función helper para construir URLs correctamente
const buildUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Simulación exacta del httpClient.get
const simulateHttpClientGet = async (url, options = {}) => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWRiNjk4OS1iMTMyLTQzZWItYjhkOS05ZDQxZGFmNzE5MDUiLCJlbWFpbCI6ImFkbWluQHBvYS5nb3YiLCJyb2xlSWQiOiI4ODRjZWU1NS01MmI2LTRkYWYtYTdjZC1jZjE3ODc5NDljMDciLCJpYXQiOjE3NTI0Mzg0MzUsImV4cCI6MTc1MzA0MzIzNX0.ZHSSMTsex7KBhScghk1O98hcI8iTkw1kWg1fwZNeKPY'; // Token de prueba
  
  console.log('🔗 Building URL for:', url);
  const fullUrl = buildUrl(url);
  console.log('🔗 Full URL:', fullUrl);
  
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });
  
  console.log('📡 Response status:', response.status);
  console.log('📡 Response ok:', response.ok);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  const jsonData = await response.json();
  console.log('📄 JSON data received:', JSON.stringify(jsonData, null, 2));
  
  return jsonData;
};

async function simulateLoadActivities() {
  try {
    console.log('🚀 Simulando loadActivities exactamente como en el frontend...\n');
    
    // Simular httpClient.get('/activities')
    const response = await simulateHttpClientGet('/activities');
    
    console.log('\n🔍 Evaluando respuesta:');
    console.log('response.data existe:', !!response.data);
    console.log('response.success:', response.success);
    console.log('response.success type:', typeof response.success);
    
    // Problema: ¡el httpClient devuelve la respuesta directa, no envuelta en .data!
    console.log('\n⚠️ ISSUE DETECTADO:');
    console.log('En el frontend se usa: response.data.success');
    console.log('Pero httpClient devuelve: response.success (directamente)');
    console.log('');
    console.log('response.data.success =', response.data?.success, '(esto es undefined!)');
    console.log('response.success =', response.success, '(esto es lo correcto!)');
    
    // Simular la lógica errónea del frontend
    if (response.data.success) {
      console.log('✅ Path de éxito (NUNCA se ejecuta porque response.data es undefined)');
    } else {
      console.log('❌ Path de error (SIEMPRE se ejecuta)');
      console.log('Mensaje de error que se lanza:', response.data?.message || 'Error al cargar actividades');
    }
    
  } catch (error) {
    console.error('💥 Error capturado:', error.message);
  }
}

simulateLoadActivities();
