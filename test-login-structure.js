// Test para verificar la estructura real de respuesta del login
console.log('🔍 Verificando estructura del endpoint /auth/login...\n');

// Simular lo que probablemente devuelve el backend según el error
console.log('❌ PROBLEMA ACTUAL:');
console.log('AuthContext intenta acceder a: data.data.token');
console.log('Pero parece que data.data es undefined\n');

console.log('🔍 Posibles estructuras de respuesta del backend:');
console.log('\n1. Estructura simple:');
console.log(JSON.stringify({
  success: true,
  token: "jwt-token-here",
  user: { id: "123", name: "User" }
}, null, 2));

console.log('\n2. Estructura con data wrapper:');
console.log(JSON.stringify({
  success: true,
  data: {
    token: "jwt-token-here", 
    user: { id: "123", name: "User" }
  }
}, null, 2));

console.log('\n3. Con httpClient fix (envuelve en data):');
const mockBackendResponse = {
  success: true,
  token: "jwt-token-here",
  user: { id: "123", name: "User" }
};

const httpClientResponse = { data: mockBackendResponse };

console.log('Después del fix:', JSON.stringify(httpClientResponse, null, 2));
console.log('\n🔍 Accesos en AuthContext:');
console.log('response.data:', httpClientResponse.data);
console.log('response.data.token:', httpClientResponse.data.token);
console.log('response.data.data:', httpClientResponse.data.data);
console.log('response.data.data?.token:', httpClientResponse.data.data?.token);

console.log('\n💡 SOLUCIÓN:');
console.log('Si data.data.token es undefined, probablemente la estructura correcta es:');
console.log('- data.token (no data.data.token)');
console.log('- data.user (no data.data.user)');
