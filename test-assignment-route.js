const API_BASE = 'http://localhost:3001/api';

async function testAssignmentRoute() {
  console.log('🔐 Obteniendo token...');
  
  // Primero obtener token
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@poa.gov', password: 'admin123' })
  });
  
  const loginData = await loginResponse.json();
  if (!loginResponse.ok) {
    console.log('❌ Error en login:', loginData.message);
    return;
  }
  
  const token = loginData.token;
  console.log('✅ Token obtenido');
  
  // Obtener una actividad
  console.log('📋 Obteniendo actividades...');
  const activitiesResponse = await fetch(`${API_BASE}/activities`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const activitiesData = await activitiesResponse.json();
  if (!activitiesResponse.ok) {
    console.log('❌ Error obteniendo actividades:', activitiesData.message);
    return;
  }
  
  const activities = activitiesData.data || activitiesData;
  if (activities.length === 0) {
    console.log('❌ No hay actividades');
    return;
  }
  
  const activityId = activities[0].id;
  console.log(`✅ Actividad seleccionada: ${activities[0].name} (${activityId})`);
  
  // Probar la ruta de asignaciones directamente
  console.log('🔍 Probando ruta de asignaciones...');
  
  const assignmentData = {
    userId: '2197529f-a161-4b42-a303-b6cfaab33e37', // Usar un ID cualquiera para probar
    role: 'RESPONSIBLE',
    estimatedHours: 40
  };
  
  const assignmentResponse = await fetch(`${API_BASE}/activities/${activityId}/assign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assignmentData)
  });
  
  console.log(`📊 Status: ${assignmentResponse.status}`);
  console.log(`📊 Status Text: ${assignmentResponse.statusText}`);
  
  const assignmentResult = await assignmentResponse.text();
  console.log(`📋 Respuesta:`, assignmentResult);
  
  // Probar también estadísticas
  console.log('\n📊 Probando estadísticas...');
  const statsResponse = await fetch(`${API_BASE}/activities/${activityId}/statistics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log(`📊 Status: ${statsResponse.status}`);
  const statsResult = await statsResponse.text();
  console.log(`📊 Respuesta:`, statsResult);
}

testAssignmentRoute().catch(console.error);
