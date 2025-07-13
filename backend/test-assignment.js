const axios = require('axios');

async function testAssignment() {
  try {
    console.log('🧪 Probando asignación de usuario a actividad...\n');

    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    const apiClient = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Obtener primera actividad
    const activitiesResponse = await apiClient.get('/activities');
    const activities = activitiesResponse.data.data;
    
    if (activities.length === 0) {
      console.log('❌ No hay actividades para probar');
      return;
    }

    const testActivity = activities[0];
    console.log(`📋 Actividad de prueba: ${testActivity.name}`);
    console.log(`🆔 ID: ${testActivity.id}`);

    // Obtener usuarios
    const usersResponse = await apiClient.get('/users?isActive=true');
    const users = usersResponse.data.users;
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios para probar');
      return;
    }

    // Buscar un usuario que no esté asignado
    let availableUser = null;
    for (const user of users) {
      const isAssigned = testActivity.assignments?.some(assignment => 
        assignment.userId === user.id
      );
      if (!isAssigned) {
        availableUser = user;
        break;
      }
    }

    if (!availableUser) {
      console.log('⚠️  Todos los usuarios ya están asignados a esta actividad');
      return;
    }

    console.log(`👤 Usuario a asignar: ${availableUser.firstName} ${availableUser.lastName}`);
    console.log(`🆔 User ID: ${availableUser.id}`);

    // Hacer la asignación
    console.log('\n🔗 Asignando usuario...');
    const assignmentData = {
      userId: availableUser.id,
      isMain: false
    };

    const assignResponse = await apiClient.post(`/activities/${testActivity.id}/assign`, assignmentData);
    
    console.log('✅ Asignación exitosa!');
    console.log('📊 Respuesta:', assignResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('🔍 Status:', error.response.status);
      console.error('🔍 Data:', error.response.data);
    }
  }
}

testAssignment();
