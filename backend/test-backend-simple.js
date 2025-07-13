// Test simplificado para verificar que el backend responde
const fetch = require('node-fetch');

async function testBackend() {
  try {
    console.log('🔍 Verificando backend...');
    const response = await fetch('http://localhost:3001/api/users', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4Mzk3OTU2Ny01MmJlLTRlODktODI0Ni1kYmI5MzA3MTc0MzciLCJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc0MjEyODE0MCwiZXhwIjoxNzQyMjE0NTQwfQ.FWkBtVGfGo3bWBJrQ50WrQYSPR3CuwAJ8VfYGlI7H4c'
      }
    });
    
    console.log('📡 Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend funcionando');
      console.log('📄 Estructura de respuesta:', {
        success: data.success,
        dataExists: !!data.data,
        usersCount: data.data?.length || 0
      });
    } else {
      console.log('❌ Backend no responde correctamente');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testBackend();
