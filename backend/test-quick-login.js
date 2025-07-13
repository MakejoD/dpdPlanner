const axios = require('axios');

async function testAllQuickLoginCredentials() {
  const baseURL = 'http://localhost:3001/api';
  const users = [
    { name: 'Administrador', email: 'admin@poa.gov', password: 'admin123' },
    { name: 'Director de Planificación', email: 'planificacion@poa.gov', password: 'planificacion123' },
    { name: 'Técnico', email: 'juan.perez@poa.gov', password: '123456' }
  ];
  
  console.log('🔐 Testando credenciales para login rápido...\n');
  
  for (const user of users) {
    try {
      console.log(`👤 Probando: ${user.name}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔐 Password: ${user.password}`);
      
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      console.log('✅ LOGIN EXITOSO!');
      console.log(`🔑 Token: ${loginResponse.data.token.substring(0, 30)}...`);
      
    } catch (error) {
      console.log('❌ LOGIN FALLÓ:', error.response?.data?.message || error.message);
    }
    console.log('---');
  }
}

testAllQuickLoginCredentials();
