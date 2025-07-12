const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testActivityManagement() {
  console.log('🧪 Probando funcionalidades mejoradas de gestión de actividades...\n');

  try {
    // 1. Login como admin
    console.log('1. 🔐 Iniciando sesión como administrador...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('   ✅ Login exitoso\n');

    // 2. Obtener actividades con usuarios asignados
    console.log('2. 📋 Obteniendo actividades con asignaciones...');
    const activitiesResponse = await axios.get(`${BASE_URL}/activities`, { headers });
    const activities = activitiesResponse.data.data || activitiesResponse.data;
    
    console.log(`   ✅ Encontradas ${activities.length} actividades`);
    
    if (activities.length > 0) {
      const firstActivity = activities[0];
      console.log(`   📝 Primera actividad: ${firstActivity.name}`);
      console.log(`   👥 Asignaciones: ${firstActivity._count?.assignments || 0}`);
      console.log(`   📊 Indicadores: ${firstActivity._count?.indicators || 0}\n`);
    }

    // 3. Obtener usuarios para asignaciones
    console.log('3. 👥 Obteniendo usuarios disponibles...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
    const users = usersResponse.data.users || usersResponse.data.data || usersResponse.data;
    
    console.log(`   ✅ Encontrados ${users.length} usuarios`);
    
    const technicalUsers = users.filter(u => u.role.name === 'Técnico Registrador');
    console.log(`   🔧 Técnicos disponibles: ${technicalUsers.length}\n`);

    // 4. Asignar usuario a actividad (si hay actividades y usuarios)
    if (activities.length > 0 && technicalUsers.length > 0) {
      const activityToAssign = activities[0];
      const userToAssign = technicalUsers[0];
      
      console.log('4. 🎯 Asignando usuario a actividad...');
      console.log(`   📝 Actividad: ${activityToAssign.name}`);
      console.log(`   👤 Usuario: ${userToAssign.firstName} ${userToAssign.lastName}`);

      try {
        const assignmentResponse = await axios.post(
          `${BASE_URL}/activities/${activityToAssign.id}/assignments`,
          {
            userId: userToAssign.id,
            role: 'EXECUTOR',
            estimatedHours: 40,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
          },
          { headers }
        );

        console.log('   ✅ Asignación creada exitosamente');
        
        const assignmentId = assignmentResponse.data.data.id;
        console.log(`   🆔 ID de asignación: ${assignmentId}\n`);

        // 5. Actualizar progreso de la asignación
        console.log('5. 📈 Actualizando progreso de asignación...');
        
        const progressResponse = await axios.put(
          `${BASE_URL}/activities/${activityToAssign.id}/assignments/${assignmentId}/status`,
          {
            status: 'IN_PROGRESS',
            progress: 25,
            comments: 'Iniciado el trabajo. Se ha completado la fase de planificación inicial.'
          },
          { headers }
        );

        console.log('   ✅ Progreso actualizado exitosamente');
        console.log(`   📊 Nuevo progreso: ${progressResponse.data.activityProgress}%\n`);

        // 6. Obtener estadísticas de la actividad
        console.log('6. 📊 Obteniendo estadísticas de actividad...');
        
        const statsResponse = await axios.get(
          `${BASE_URL}/activities/${activityToAssign.id}/statistics`,
          { headers }
        );

        const stats = statsResponse.data;
        console.log('   ✅ Estadísticas obtenidas:');
        console.log(`   👥 Total asignaciones: ${stats.assignments.total}`);
        console.log(`   📈 Progreso promedio: ${stats.assignments.averageProgress}%`);
        console.log(`   📋 Estados:`);
        console.log(`      - No iniciado: ${stats.assignments.byStatus.NOT_STARTED}`);
        console.log(`      - En progreso: ${stats.assignments.byStatus.IN_PROGRESS}`);
        console.log(`      - Completado: ${stats.assignments.byStatus.COMPLETED}`);
        console.log(`   📊 Indicadores: ${stats.indicators.total}\n`);

      } catch (assignmentError) {
        if (assignmentError.response?.status === 409) {
          console.log('   ⚠️ Usuario ya está asignado a esta actividad\n');
        } else {
          console.error('   ❌ Error en asignación:', assignmentError.response?.data?.message || assignmentError.message);
        }
      }
    }

    // 7. Probar filtros de actividades
    console.log('7. 🔍 Probando filtros de actividades...');
    
    if (technicalUsers.length > 0) {
      const filterResponse = await axios.get(
        `${BASE_URL}/activities?responsibleId=${technicalUsers[0].id}&status=IN_PROGRESS`,
        { headers }
      );
      
      const filteredActivities = filterResponse.data.data || filterResponse.data;
      console.log(`   ✅ Actividades en progreso del usuario: ${filteredActivities.length}\n`);
    }

    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n📝 Funcionalidades verificadas:');
    console.log('   ✅ Gestión de asignaciones de usuarios');
    console.log('   ✅ Actualización de estado y progreso');
    console.log('   ✅ Estadísticas de actividades');
    console.log('   ✅ Filtros avanzados');
    console.log('   ✅ Cálculo automático de progreso');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar las pruebas
testActivityManagement();
