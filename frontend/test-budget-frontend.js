// Función de prueba para verificar la conectividad del frontend con el backend
// Para usar en la consola del navegador

const testBudgetExecutionFrontend = async () => {
  console.log('🚀 Probando conectividad del frontend con la API de ejecución presupuestaria...');
  
  try {
    // 1. Verificar que httpClient esté disponible
    if (typeof httpClient === 'undefined') {
      console.log('❌ httpClient no está disponible globalmente');
      console.log('💡 Esto es normal - httpClient se importa en los componentes React');
      return;
    }

    // 2. Probar endpoint de actividades (requisito para el presupuesto)
    console.log('🔍 Probando endpoint de actividades...');
    const activitiesResponse = await fetch('http://localhost:3001/api/activities', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (activitiesResponse.ok) {
      const activitiesData = await activitiesResponse.json();
      console.log(`✅ Actividades disponibles: ${activitiesData.data?.activities?.length || 0}`);
    } else {
      console.log('❌ Error al obtener actividades:', activitiesResponse.status);
    }

    // 3. Probar endpoint de ejecución presupuestaria
    console.log('💰 Probando endpoint de ejecución presupuestaria...');
    const budgetResponse = await fetch('http://localhost:3001/api/budget-execution', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (budgetResponse.ok) {
      const budgetData = await budgetResponse.json();
      console.log(`✅ Ejecuciones presupuestarias encontradas: ${budgetData.data?.budgetExecutions?.length || 0}`);
      
      if (budgetData.data?.budgetExecutions?.length > 0) {
        const firstExecution = budgetData.data.budgetExecutions[0];
        console.log('📊 Primera ejecución:', {
          codigo: firstExecution.budgetCode,
          nombre: firstExecution.budgetName,
          asignado: firstExecution.assignedAmount,
          ejecucion: `${firstExecution.executionPercent}%`
        });
      }
    } else {
      console.log('❌ Error al obtener ejecuciones presupuestarias:', budgetResponse.status);
    }

    console.log('🎉 Prueba de conectividad completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
};

// Instrucciones para el usuario
console.log(`
🔧 INSTRUCCIONES PARA PROBAR EL MÓDULO PRESUPUESTARIO:

1. Abrir la aplicación en: http://localhost:5173
2. Hacer login con: admin@poa.gov / admin123
3. Navegar a "Ejecución Presupuestaria" en el menú lateral
4. Ejecutar esta función en la consola: testBudgetExecutionFrontend()

📋 FUNCIONALIDADES A PROBAR:
✅ Crear nueva ejecución presupuestaria
✅ Ver lista de ejecuciones con filtros
✅ Editar montos (comprometido, devengado, pagado)
✅ Ver cálculos automáticos de porcentajes
✅ Filtrar por actividad, año fiscal, departamento
✅ Ver resumen en tarjetas superiores

🎯 VALIDACIONES IMPLEMENTADAS:
• Monto comprometido ≤ monto asignado
• Monto devengado ≤ monto comprometido  
• Monto pagado ≤ monto devengado
• Códigos presupuestarios únicos por actividad/año
• Permisos por rol de usuario
`);

// Ejecutar automáticamente si hay token
if (localStorage.getItem('token')) {
  testBudgetExecutionFrontend();
} else {
  console.log('⚠️ No hay token de autenticación. Por favor haga login primero.');
}
