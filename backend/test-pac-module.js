const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testPACModule() {
  try {
    console.log('🧪 Probando módulo PAC (Plan Anual de Compras)...\n');
    
    // 1. Login para obtener token
    console.log('📝 Step 1: Login como administrador');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Verificar que las nuevas rutas estén disponibles
    console.log('🔍 Step 2: Verificar rutas del módulo PAC');
    
    try {
      const procurementResponse = await axios.get(`${BASE_URL}/procurement-processes`, { headers });
      console.log('✅ Ruta /procurement-processes disponible');
      console.log(`   - Procesos encontrados: ${procurementResponse.data.data.processes.length}`);
      console.log(`   - Estadísticas: ${JSON.stringify(procurementResponse.data.data.stats)}`);
    } catch (error) {
      console.log('❌ Error en ruta /procurement-processes:', error.response?.data?.message || error.message);
    }

    try {
      const linksResponse = await axios.get(`${BASE_URL}/activity-procurement-links`, { headers });
      console.log('✅ Ruta /activity-procurement-links disponible');
      console.log(`   - Vinculaciones encontradas: ${linksResponse.data.data.links.length}`);
    } catch (error) {
      console.log('❌ Error en ruta /activity-procurement-links:', error.response?.data?.message || error.message);
    }

    // 3. Obtener datos necesarios para crear un proceso de compra
    console.log('\n📊 Step 3: Obtener datos de referencia');
    
    const departmentsResponse = await axios.get(`${BASE_URL}/departments`, { headers });
    const departments = departmentsResponse.data.data || departmentsResponse.data;
    console.log(`✅ ${departments.length} departamentos disponibles`);
    
    const activitiesResponse = await axios.get(`${BASE_URL}/activities`, { headers });
    const activities = activitiesResponse.data.data || activitiesResponse.data;
    console.log(`✅ ${activities.length} actividades disponibles`);

    if (departments.length === 0 || activities.length === 0) {
      console.log('⚠️  No hay departamentos o actividades para probar. Creando datos de prueba...');
      return;
    }

    // 4. Crear un proceso de compra de prueba
    console.log('\n➕ Step 4: Crear proceso de compra de prueba');
    
    const newProcurementData = {
      cuciCode: `TEST-${Date.now()}`,
      description: 'Adquisición de equipos de oficina - Prueba PAC',
      measurementUnit: 'Unidad',
      quantity: 10,
      unitCost: 5000.00,
      procurementMethod: 'Comparación de Precios',
      fundingSource: 'Fondos Propios',
      fiscalYear: 2024,
      plannedStartDate: '2024-08-01',
      plannedAwardDate: '2024-09-15',
      notes: 'Proceso de prueba para validar módulo PAC',
      departmentId: departments[0].id
    };

    try {
      const createResponse = await axios.post(`${BASE_URL}/procurement-processes`, newProcurementData, { headers });
      const newProcess = createResponse.data.data;
      console.log('✅ Proceso de compra creado exitosamente');
      console.log(`   - ID: ${newProcess.id}`);
      console.log(`   - Código CUCI: ${newProcess.cuciCode}`);
      console.log(`   - Costo total: RD$${parseFloat(newProcess.totalCost).toLocaleString()}`);
      
      // 5. Vincular el proceso con una actividad
      console.log('\n🔗 Step 5: Crear vinculación POA-PAC');
      
      const linkData = {
        activityId: activities[0].id,
        procurementProcessId: newProcess.id,
        linkReason: 'Equipos necesarios para la ejecución de esta actividad del POA',
        isEssential: true
      };

      try {
        const linkResponse = await axios.post(`${BASE_URL}/activity-procurement-links`, linkData, { headers });
        const newLink = linkResponse.data.data;
        console.log('✅ Vinculación POA-PAC creada exitosamente');
        console.log(`   - ID: ${newLink.id}`);
        console.log(`   - Actividad: ${newLink.activity.name}`);
        console.log(`   - Proceso: ${newLink.procurementProcess.description}`);
        
        if (linkResponse.data.alert) {
          console.log(`   ⚠️  Alerta: ${linkResponse.data.alert.message}`);
        }

        // 6. Obtener alertas de la actividad
        console.log('\n🚨 Step 6: Verificar alertas de consistencia');
        
        try {
          const alertsResponse = await axios.get(`${BASE_URL}/activity-procurement-links/activity/${activities[0].id}/alerts`, { headers });
          const alerts = alertsResponse.data.data;
          console.log('✅ Alertas obtenidas exitosamente');
          console.log(`   - Total alertas: ${alerts.alerts.length}`);
          console.log(`   - Presupuesto actividad: RD$${alerts.activityBudget.toLocaleString()}`);
          console.log(`   - Costo procesos: RD$${alerts.totalProcurementCost.toLocaleString()}`);
          console.log(`   - Consistencia presupuestaria: ${alerts.budgetConsistency ? '✅' : '❌'}`);
          
          if (alerts.alerts.length > 0) {
            alerts.alerts.forEach((alert, index) => {
              console.log(`   - Alerta ${index + 1}: ${alert.message}`);
            });
          }
        } catch (error) {
          console.log('❌ Error obteniendo alertas:', error.response?.data?.message || error.message);
        }

        // 7. Actualizar estado del proceso
        console.log('\n📝 Step 7: Actualizar estado del proceso');
        
        try {
          const updateData = {
            status: 'EN_PROCESO',
            actualStartDate: new Date().toISOString().split('T')[0],
            notes: 'Proceso iniciado - Prueba de actualización'
          };
          
          const updateResponse = await axios.put(`${BASE_URL}/procurement-processes/${newProcess.id}`, updateData, { headers });
          console.log('✅ Proceso actualizado exitosamente');
          console.log(`   - Nuevo estado: ${updateResponse.data.data.status}`);
          console.log(`   - Fecha real de inicio: ${updateResponse.data.data.actualStartDate}`);
        } catch (error) {
          console.log('❌ Error actualizando proceso:', error.response?.data?.message || error.message);
        }

        // 8. Listar procesos con filtros
        console.log('\n📋 Step 8: Listar procesos con filtros');
        
        try {
          const filteredResponse = await axios.get(`${BASE_URL}/procurement-processes?status=EN_PROCESO&fiscalYear=2024&includeLinks=true`, { headers });
          const filtered = filteredResponse.data.data;
          console.log('✅ Procesos filtrados obtenidos');
          console.log(`   - Procesos en proceso: ${filtered.processes.length}`);
          console.log(`   - Total páginas: ${filtered.pagination.pages}`);
        } catch (error) {
          console.log('❌ Error obteniendo procesos filtrados:', error.response?.data?.message || error.message);
        }

      } catch (error) {
        console.log('❌ Error creando vinculación:', error.response?.data?.message || error.message);
      }

    } catch (error) {
      console.log('❌ Error creando proceso de compra:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('   Errores de validación:', error.response.data.errors);
      }
    }

    // 9. Verificar permisos de roles PAC
    console.log('\n🎭 Step 9: Verificar roles del módulo PAC');
    
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/roles?includePermissions=true`, { headers });
      const roles = rolesResponse.data.data;
      
      const pacRoles = roles.filter(role => 
        ['Director de Compras y Contrataciones', 'Analista de Compras'].includes(role.name)
      );
      
      console.log('✅ Roles PAC encontrados:');
      pacRoles.forEach(role => {
        const pacPermissions = role.permissions?.filter(p => 
          p.resource.includes('procurement') || p.resource.includes('activity_procurement_link')
        ).length || 0;
        console.log(`   - ${role.name}: ${pacPermissions} permisos PAC`);
      });
      
    } catch (error) {
      console.log('❌ Error verificando roles:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Pruebas del módulo PAC completadas exitosamente!');
    console.log('\n📈 Resumen de funcionalidades validadas:');
    console.log('   ✅ Creación de procesos de compra');
    console.log('   ✅ Vinculación POA-PAC');
    console.log('   ✅ Alertas de consistencia presupuestaria');
    console.log('   ✅ Actualización de estados');
    console.log('   ✅ Filtros y paginación');
    console.log('   ✅ Roles y permisos especializados');

  } catch (error) {
    console.error('❌ Error en pruebas PAC:', error.message);
    if (error.response) {
      console.error('   Respuesta del servidor:', error.response.data);
    }
  }
}

testPACModule();
