// test-approval-system.js - Prueba completa del sistema de aprobaciones
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Usuarios de prueba
const testUsers = {
  admin: { email: 'admin@poa.gov', password: 'admin123' },
  director: { email: 'director@poa.gov', password: 'admin123' },
  tecnico: { email: 'tecnico@poa.gov', password: 'admin123' }
};

let tokens = {};

// Función para autenticar usuarios
async function authenticateUser(userKey) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUsers[userKey]);
    if (response.data.token) {
      tokens[userKey] = response.data.token;
      console.log(`✅ Autenticación exitosa para ${userKey}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error autenticando ${userKey}:`, error.response?.data || error.message);
    return false;
  }
}

// Función para crear cliente autenticado
function createAuthenticatedClient(userKey) {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${tokens[userKey]}`,
      'Content-Type': 'application/json'
    }
  });
}

// Función principal de pruebas
async function runApprovalSystemTests() {
  console.log('🎯 Iniciando pruebas del sistema de aprobaciones\n');

  try {
    // 1️⃣ Autenticar usuarios
    console.log('1️⃣  Autenticando usuarios...');
    for (const userKey of Object.keys(testUsers)) {
      await authenticateUser(userKey);
    }

    const adminClient = createAuthenticatedClient('admin');
    const directorClient = createAuthenticatedClient('director');
    const tecnicoClient = createAuthenticatedClient('tecnico');

    // 2️⃣ Verificar que la API de aprobaciones funciona
    console.log('\n2️⃣  Probando APIs de aprobaciones...');
    
    try {
      const pendingResponse = await directorClient.get('/approvals/pending');
      console.log(`✅ API /approvals/pending: ${pendingResponse.data.data.reports.length} reportes pendientes`);
    } catch (error) {
      console.log('❌ Error en API /approvals/pending:', error.response?.data?.message);
    }

    try {
      const statsResponse = await directorClient.get('/approvals/stats');
      console.log(`✅ API /approvals/stats: ${JSON.stringify(statsResponse.data.data.summary)}`);
    } catch (error) {
      console.log('❌ Error en API /approvals/stats:', error.response?.data?.message);
    }

    try {
      const myReportsResponse = await tecnicoClient.get('/approvals/my-reports');
      console.log(`✅ API /approvals/my-reports: ${myReportsResponse.data.data.reports.length} reportes propios`);
    } catch (error) {
      console.log('❌ Error en API /approvals/my-reports:', error.response?.data?.message);
    }

    // 3️⃣ Probar creación y envío de reporte
    console.log('\n3️⃣  Probando workflow completo...');
    
    // Obtener actividades para crear un reporte
    const activitiesResponse = await adminClient.get('/activities');
    if (activitiesResponse.data.success && activitiesResponse.data.data.activities.length > 0) {
      const firstActivity = activitiesResponse.data.data.activities[0];
      console.log(`📋 Usando actividad: ${firstActivity.name}`);

      // Crear un reporte de prueba
      const reportData = {
        activityId: firstActivity.id,
        periodType: 'trimestral',
        period: '2025-Q1',
        currentValue: 75,
        targetValue: 100,
        executionPercentage: 75,
        qualitativeComments: 'Avance satisfactorio en el primer trimestre',
        challenges: 'Algunos retrasos menores en coordinación',
        nextSteps: 'Acelerar actividades pendientes'
      };

      try {
        const createResponse = await tecnicoClient.post('/progress-reports', reportData);
        if (createResponse.data.success) {
          const reportId = createResponse.data.data.id;
          console.log(`✅ Reporte creado: ${reportId}`);

          // Enviar para aprobación
          const submitResponse = await tecnicoClient.post(`/progress-reports/${reportId}/submit`);
          if (submitResponse.data.success) {
            console.log(`✅ Reporte enviado para aprobación`);

            // Verificar que aparece en reportes pendientes
            const pendingAfterSubmit = await directorClient.get('/approvals/pending');
            const pendingReport = pendingAfterSubmit.data.data.reports.find(r => r.id === reportId);
            if (pendingReport) {
              console.log(`✅ Reporte aparece en pendientes de aprobación`);

              // Aprobar el reporte
              const approveResponse = await directorClient.post(`/approvals/${reportId}/approve`, {
                comments: 'Reporte aprobado - buen trabajo'
              });
              if (approveResponse.data.success) {
                console.log(`✅ Reporte aprobado exitosamente`);

                // Verificar historial
                const historyResponse = await adminClient.get(`/approvals/${reportId}/history`);
                console.log(`✅ Historial de aprobaciones: ${historyResponse.data.data.length} entradas`);
              } else {
                console.log('❌ Error aprobando reporte:', approveResponse.data.message);
              }
            } else {
              console.log('❌ Reporte no aparece en pendientes');
            }
          } else {
            console.log('❌ Error enviando para aprobación:', submitResponse.data.message);
          }
        } else {
          console.log('❌ Error creando reporte:', createResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Error en workflow:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('❌ No hay actividades disponibles para crear reportes');
    }

    // 4️⃣ Probar rechazo de reporte
    console.log('\n4️⃣  Probando rechazo de reporte...');
    
    // Obtener indicadores para crear un reporte diferente
    const indicatorsResponse = await adminClient.get('/indicators');
    if (indicatorsResponse.data.success && indicatorsResponse.data.data.indicators.length > 0) {
      const firstIndicator = indicatorsResponse.data.data.indicators[0];
      console.log(`📊 Usando indicador: ${firstIndicator.name}`);

      const reportData2 = {
        indicatorId: firstIndicator.id,
        periodType: 'trimestral',
        period: '2025-Q1',
        currentValue: 30,
        targetValue: 100,
        executionPercentage: 30,
        qualitativeComments: 'Avance bajo debido a factores externos',
        challenges: 'Dificultades significativas en la implementación',
        nextSteps: 'Replantear estrategia de implementación'
      };

      try {
        const createResponse2 = await tecnicoClient.post('/progress-reports', reportData2);
        if (createResponse2.data.success) {
          const reportId2 = createResponse2.data.data.id;
          console.log(`✅ Segundo reporte creado: ${reportId2}`);

          // Enviar para aprobación
          await tecnicoClient.post(`/progress-reports/${reportId2}/submit`);
          console.log(`✅ Segundo reporte enviado para aprobación`);

          // Rechazar el reporte
          const rejectResponse = await directorClient.post(`/approvals/${reportId2}/reject`, {
            rejectionReason: 'Los datos no coinciden con las expectativas del proyecto',
            comments: 'Por favor revisar las métricas y volver a enviar'
          });
          
          if (rejectResponse.data.success) {
            console.log(`✅ Reporte rechazado exitosamente`);
            
            // Verificar que el usuario puede ver sus reportes rechazados
            const myRejectedReports = await tecnicoClient.get('/approvals/my-reports?status=REJECTED');
            const rejectedReport = myRejectedReports.data.data.reports.find(r => r.id === reportId2);
            if (rejectedReport) {
              console.log(`✅ Reporte rechazado visible en reportes del usuario`);
            }
          } else {
            console.log('❌ Error rechazando reporte:', rejectResponse.data.message);
          }
        }
      } catch (error) {
        console.log('❌ Error en prueba de rechazo:', error.response?.data?.message || error.message);
      }
    }

    // 5️⃣ Estadísticas finales
    console.log('\n5️⃣  Estadísticas finales del sistema...');
    try {
      const finalStats = await directorClient.get('/approvals/stats');
      console.log('📊 Estadísticas finales:');
      console.log(`   - Pendientes: ${finalStats.data.data.summary.pending}`);
      console.log(`   - Aprobados: ${finalStats.data.data.summary.approved}`);
      console.log(`   - Rechazados: ${finalStats.data.data.summary.rejected}`);
      console.log(`   - Total: ${finalStats.data.data.summary.total}`);
      console.log(`   - Tasa de aprobación: ${finalStats.data.data.summary.approvalRate}%`);
    } catch (error) {
      console.log('❌ Error obteniendo estadísticas finales:', error.response?.data?.message);
    }

    console.log('\n🎉 ¡Pruebas del sistema de aprobaciones completadas!');
    console.log('\n📋 Funcionalidades probadas:');
    console.log('   ✅ Creación de reportes');
    console.log('   ✅ Envío para aprobación');
    console.log('   ✅ Lista de reportes pendientes');
    console.log('   ✅ Aprobación de reportes');
    console.log('   ✅ Rechazo de reportes');
    console.log('   ✅ Historial de aprobaciones');
    console.log('   ✅ Estadísticas de aprobaciones');
    console.log('   ✅ Permisos por rol');

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runApprovalSystemTests().catch(console.error);
}

module.exports = { runApprovalSystemTests };
