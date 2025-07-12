const API_BASE = 'http://localhost:3001/api';

// Datos de prueba
const testCredentials = {
  email: 'admin@poa.gov',
  password: 'admin123'
};

let authToken = '';

async function testLogin() {
  console.log('🔐 Probando login...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });

    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      console.log('✅ Login exitoso');
      console.log(`👤 Usuario: ${data.user.firstName} ${data.user.lastName}`);
      console.log(`🎭 Rol: ${data.user.role.name}`);
      return true;
    } else {
      console.log('❌ Error en login:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

async function testActivitiesAPI() {
  console.log('\n📋 Probando API de actividades...');
  
  try {
    const response = await fetch(`${API_BASE}/activities`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      const activities = data.data || data;
      console.log(`✅ Se encontraron ${activities.length} actividades`);
      
      if (activities.length > 0) {
        const activity = activities[0];
        console.log(`📝 Primera actividad: ${activity.name}`);
        console.log(`📊 Asignaciones: ${activity._count?.assignments || 0}`);
        console.log(`🎯 Indicadores: ${activity._count?.indicators || 0}`);
        
        // Probar estadísticas de actividad
        await testActivityStatistics(activity.id);
      }
    } else {
      console.log('❌ Error obteniendo actividades:', data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testActivityStatistics(activityId) {
  console.log(`\n📊 Probando estadísticas de actividad ${activityId}...`);
  
  try {
    const response = await fetch(`${API_BASE}/activities/${activityId}/statistics`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Estadísticas obtenidas:');
      console.log(`   📋 Asignaciones totales: ${data.assignments.total}`);
      console.log(`   📈 Progreso promedio: ${data.assignments.averageProgress}%`);
      console.log(`   🎯 Indicadores: ${data.indicators.total}`);
      console.log(`   📊 Estados:`, data.assignments.byStatus);
    } else {
      console.log('❌ Error obteniendo estadísticas:', data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testUsersAPI() {
  console.log('\n👥 Probando API de usuarios...');
  
  try {
    const response = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      const users = data.users || data.data || data;
      console.log(`✅ Se encontraron ${users.length} usuarios`);
      
      if (users.length > 0) {
        console.log('👤 Usuarios disponibles para asignación:');
        users.slice(0, 5).forEach(user => {
          console.log(`   - ${user.firstName} ${user.lastName} (${user.role?.name || 'Sin rol'})`);
        });
      }
    } else {
      console.log('❌ Error obteniendo usuarios:', data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testIndicatorsAPI() {
  console.log('\n🎯 Probando API de indicadores...');
  
  try {
    const response = await fetch(`${API_BASE}/indicators`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      const indicators = data.data || data;
      console.log(`✅ Se encontraron ${indicators.length} indicadores`);
      
      if (indicators.length > 0) {
        const indicator = indicators[0];
        console.log(`📊 Primer indicador: ${indicator.name}`);
        console.log(`📈 Tipo: ${indicator.type}`);
        console.log(`🎯 Nivel: ${indicator.level}`);
        console.log(`💯 Meta: ${indicator.targetValue}`);
        console.log(`📋 Actual: ${indicator.currentValue}`);
      }
    } else {
      console.log('❌ Error obteniendo indicadores:', data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testCreateAssignment() {
  console.log('\n👥 Probando crear asignación...');
  
  try {
    // Primero obtener una actividad y un usuario
    const [activitiesRes, usersRes] = await Promise.all([
      fetch(`${API_BASE}/activities`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }),
      fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
    ]);

    const activitiesData = await activitiesRes.json();
    const usersData = await usersRes.json();
    
    const activities = activitiesData.data || activitiesData;
    const users = usersData.users || usersData.data || usersData;
    
    if (activities.length > 0 && users.length > 1) {
      const activity = activities[0];
      const user = users.find(u => u.email !== 'admin@poa.gov'); // No asignar al admin
      
      if (user) {
        console.log(`📋 Asignando ${user.firstName} ${user.lastName} a "${activity.name}"`);
        
        const assignmentData = {
          userId: user.id,
          role: 'RESPONSIBLE',
          estimatedHours: 40,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 semana
        };

        const response = await fetch(`${API_BASE}/activities/${activity.id}/assign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(assignmentData)
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log('✅ Asignación creada exitosamente');
          console.log(`📋 ID de asignación: ${data.data.id}`);
          
          // Probar actualizar progreso
          await testUpdateProgress(activity.id, data.data.id);
        } else {
          console.log('❌ Error creando asignación:', data.message);
        }
      }
    } else {
      console.log('⚠️ No hay suficientes actividades o usuarios para crear asignación');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testUpdateProgress(activityId, assignmentId) {
  console.log('\n📈 Probando actualización de progreso...');
  
  try {
    const progressData = {
      status: 'IN_PROGRESS',
      progress: 50,
      comments: 'Progreso del 50% completado en la primera semana'
    };

    const response = await fetch(`${API_BASE}/activities/${activityId}/assignments/${assignmentId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(progressData)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Progreso actualizado exitosamente');
      console.log(`📊 Nuevo progreso de actividad: ${data.activityProgress}%`);
    } else {
      console.log('❌ Error actualizando progreso:', data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de funcionalidad de gestión de actividades\n');
  
  const loginSuccess = await testLogin();
  
  if (!loginSuccess) {
    console.log('❌ No se pudo autenticar. Abortando pruebas.');
    return;
  }
  
  await testActivitiesAPI();
  await testUsersAPI();
  await testIndicatorsAPI();
  await testCreateAssignment();
  
  console.log('\n🎉 Pruebas completadas!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Abre http://localhost:5174 en tu navegador');
  console.log('   2. Inicia sesión con admin@poa.gov / admin123');
  console.log('   3. Ve a Planificación > Gestión de Actividades');
  console.log('   4. Prueba las nuevas funcionalidades:');
  console.log('      - Asignación de usuarios');
  console.log('      - Actualización de progreso');
  console.log('      - Gestión de fechas');
  console.log('      - Visualización de estadísticas');
}

// Ejecutar pruebas
runTests().catch(console.error);
