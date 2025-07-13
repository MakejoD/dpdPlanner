// Test script to verify frontend API calls
const axios = require('axios');

async function testFrontendAPI() {
  try {
    console.log('🔍 Simulando las llamadas del frontend...\n');

    // Login para obtener token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // Crear cliente axios como en el frontend
    const apiClient = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Probar cargar usuarios
    console.log('\n📊 Probando carga de usuarios...');
    const usersResponse = await apiClient.get('/users?isActive=true');
    console.log('Estructura de respuesta:', {
      status: usersResponse.status,
      dataKeys: Object.keys(usersResponse.data),
      usersCount: usersResponse.data.users?.length || 0
    });

    if (usersResponse.data.users) {
      console.log('\n👥 Usuarios encontrados:');
      usersResponse.data.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      });
    }

    // Probar cargar actividades
    console.log('\n📋 Probando carga de actividades...');
    const activitiesResponse = await apiClient.get('/activities');
    console.log('Estructura de actividades:', {
      status: activitiesResponse.status,
      dataKeys: Object.keys(activitiesResponse.data),
      activitiesCount: activitiesResponse.data.data?.length || 0
    });

    if (activitiesResponse.data.data && activitiesResponse.data.data.length > 0) {
      const firstActivity = activitiesResponse.data.data[0];
      console.log('\n📝 Primera actividad (para probar asignaciones):');
      console.log('ID:', firstActivity.id);
      console.log('Nombre:', firstActivity.name);
      console.log('Asignaciones:', firstActivity.assignments?.length || 0);
      
      if (firstActivity.assignments) {
        console.log('Usuarios asignados:');
        firstActivity.assignments.forEach(assignment => {
          console.log(`- ${assignment.user?.firstName} ${assignment.user?.lastName} (ID: ${assignment.userId})`);
        });
      }
      
      // Simular filtrado de usuarios disponibles
      const availableUsers = usersResponse.data.users.filter(user => {
        return !firstActivity.assignments.some(assignment => 
          assignment.userId === user.id
        );
      });
      
      console.log('\n👥 Usuarios disponibles para asignar:');
      availableUsers.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      });
      
      if (availableUsers.length === 0) {
        console.log('⚠️  Todos los usuarios ya están asignados a esta actividad');
      }
    } else {
      console.log('ℹ️  No hay actividades para probar asignaciones');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendAPI();
