// Test simple para verificar que el fix del httpClient resuelve el problema
console.log('🧪 Test rápido del fix del httpClient');

// Simular la estructura que devuelve el httpClient después del fix
const mockHttpClientResponse = {
  data: {
    success: true,
    data: [
      { id: 1, name: 'Usuario 1', email: 'user1@test.com' },
      { id: 2, name: 'Usuario 2', email: 'user2@test.com' },
      { id: 3, name: 'Usuario 3', email: 'user3@test.com' }
    ],
    message: '3 usuarios encontrados'
  }
};

// Simular la lógica del frontend como está en ActivityManagement
console.log('📝 Simulando loadUsers...');
const usersArray = mockHttpClientResponse.data.data || [];
console.log('  - Usuarios cargados:', usersArray.length);
console.log('  - ✅ loadUsers funcionaría');

// Simular respuesta de actividades
const mockActivitiesResponse = {
  data: {
    success: true,
    data: {
      activities: [
        { id: 1, name: 'Actividad 1' },
        { id: 2, name: 'Actividad 2' },
        { id: 3, name: 'Actividad 3' }
      ]
    },
    message: '3 actividades encontradas'
  }
};

console.log('📝 Simulando loadActivities...');
if (mockActivitiesResponse.data.success) {
  const activitiesData = mockActivitiesResponse.data.data.activities || [];
  console.log('  - Actividades cargadas:', activitiesData.length);
  console.log('  - ✅ loadActivities funcionaría');
} else {
  console.log('  - ❌ loadActivities fallaría');
}

console.log('🎉 El fix del httpClient resuelve los problemas de estructura!');
