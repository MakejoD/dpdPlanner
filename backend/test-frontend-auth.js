// Test para verificar autenticación y carga de usuarios desde el frontend
const axios = require('axios');

async function testFrontendAuth() {
  try {
    console.log('🔐 Probando autenticación del frontend...\n');

    // Simular login como admin
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    console.log('✅ Login exitoso');
    console.log('🎫 Token:', loginResponse.data.token.substring(0, 50) + '...');

    // Crear cliente como en el frontend
    const frontendClient = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`,
        'Content-Type': 'application/json'
      }
    });

    // Probar endpoint de usuarios exactamente como lo hace el frontend
    console.log('\n📊 Probando endpoint /users?isActive=true...');
    const usersResponse = await frontendClient.get('/users?isActive=true');
    
    console.log('✅ Respuesta exitosa');
    console.log('📋 Status:', usersResponse.status);
    console.log('🔑 Keys en response.data:', Object.keys(usersResponse.data));
    console.log('👥 Usuarios en response.data.users:', usersResponse.data.users?.length || 0);

    if (usersResponse.data.users && usersResponse.data.users.length > 0) {
      console.log('\n👤 Lista de usuarios:');
      usersResponse.data.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Activo: ${user.isActive}`);
      });
    } else {
      console.log('⚠️  No se encontraron usuarios en response.data.users');
    }

    // Probar también el endpoint de actividades
    console.log('\n📋 Probando endpoint /activities...');
    const activitiesResponse = await frontendClient.get('/activities');
    console.log('✅ Actividades - Status:', activitiesResponse.status);
    console.log('📊 Actividades encontradas:', activitiesResponse.data.data?.length || 0);

    if (activitiesResponse.data.data?.length > 0) {
      const firstActivity = activitiesResponse.data.data[0];
      console.log('\n🎯 Primera actividad para testing:');
      console.log(`   Nombre: ${firstActivity.name}`);
      console.log(`   ID: ${firstActivity.id}`);
      console.log(`   Asignaciones: ${firstActivity.assignments?.length || 0}`);
      
      if (firstActivity.assignments?.length > 0) {
        console.log('   Usuarios asignados:');
        firstActivity.assignments.forEach(assignment => {
          console.log(`     - ${assignment.user.firstName} ${assignment.user.lastName}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('🔍 Headers:', error.response.headers);
    }
  }
}

testFrontendAuth();
