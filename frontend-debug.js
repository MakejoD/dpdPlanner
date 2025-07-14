// Script para debugging del frontend - ejecutar en la consola del navegador

// 1. Hacer login y obtener token
async function setupAuth() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@poa.gov',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('✅ Token guardado en localStorage');
      return data.token;
    }
  } catch (error) {
    console.error('❌ Error en login:', error);
  }
}

// 2. Probar carga de departamentos
async function testDepartments() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:3001/api/departments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📋 Respuesta departamentos:', data);
    
    if (data.success) {
      console.log('✅ Departamentos encontrados:', data.data.length);
      data.data.forEach(dept => {
        console.log(`  - ${dept.name} (${dept.code})`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error cargando departamentos:', error);
  }
}

// 3. Ejecutar ambos
async function runTests() {
  console.log('🧪 Iniciando tests de frontend...');
  await setupAuth();
  await testDepartments();
  
  console.log('📄 Recargar la página de Reports ahora...');
}

// Ejecutar
runTests();
