// Script para probar la conectividad frontend-backend
console.log('🔍 Probando conectividad frontend-backend...');

// Configurar la base URL de la API
const API_BASE_URL = 'http://localhost:3001/api';

// Función para hacer login
async function testLogin() {
  try {
    console.log('📝 Probando login...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@poa.gov',
        password: 'admin123'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Login exitoso:', data);
    
    // Guardar token
    localStorage.setItem('token', data.token);
    
    return data.token;
  } catch (error) {
    console.error('❌ Error en login:', error);
    return null;
  }
}

// Función para probar endpoints
async function testEndpoints(token) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const endpoints = [
    { name: 'Usuarios', url: '/users' },
    { name: 'Roles', url: '/roles' },
    { name: 'Roles con permisos', url: '/roles?includePermissions=true' },
    { name: 'Permisos', url: '/permissions' },
    { name: 'Departamentos', url: '/departments' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Probando ${endpoint.name}...`);
      const response = await fetch(`${API_BASE_URL}${endpoint.url}`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${endpoint.name} obtenidos:`, Array.isArray(data) ? data.length : 'Estructura no array');
      console.log(`   Estructura:`, typeof data, Array.isArray(data) ? 'Array' : 'Object');
      
      if (endpoint.url === '/users') {
        console.log('   Usuarios - estructura detallada:', {
          isArray: Array.isArray(data),
          hasUsers: data.hasOwnProperty('users'),
          usersLength: data.users ? data.users.length : 'N/A',
          firstUser: data.users ? data.users[0] : data[0] || 'N/A'
        });
      }
      
    } catch (error) {
      console.error(`❌ Error en ${endpoint.name}:`, error);
    }
  }
}

// Ejecutar pruebas
async function runTests() {
  const token = await testLogin();
  if (token) {
    await testEndpoints(token);
    console.log('🎉 Pruebas completadas');
  }
}

// Ejecutar cuando se cargue la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runTests);
} else {
  runTests();
}
