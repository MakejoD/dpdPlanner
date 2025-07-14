const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testReportsFlow() {
  try {
    console.log('🧪 Probando flujo completo de Reports');
    console.log('====================================');

    // 1. Login
    console.log('🔐 1. Iniciando sesión...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // 2. Obtener departamentos
    console.log('📋 2. Obteniendo departamentos...');
    const departmentsResponse = await axios.get(`${baseURL}/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Departamentos obtenidos:');
    console.log('- Total:', departmentsResponse.data.data.length);
    departmentsResponse.data.data.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.code}) - ID: ${dept.id}`);
    });

    // 3. Probar vista previa POA institucional
    console.log('📊 3. Probando vista previa POA institucional...');
    const previewInstitucional = await axios.post(`${baseURL}/reports/poa-preview`, {
      type: 'institutional',
      year: '2025',
      includeIndicators: true,
      includeBudget: true,
      includeResponsibles: true
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Vista previa institucional exitosa:');
    console.log(JSON.stringify(previewInstitucional.data, null, 2));

    // 4. Probar vista previa POA departamental
    if (departmentsResponse.data.data.length > 0) {
      const departmentId = departmentsResponse.data.data[0].id;
      console.log(`📊 4. Probando vista previa POA departamental (${departmentId})...`);
      
      const previewDepartamental = await axios.post(`${baseURL}/reports/poa-preview`, {
        type: 'departmental',
        departmentId: departmentId,
        year: '2025',
        includeIndicators: true,
        includeBudget: true,
        includeResponsibles: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Vista previa departamental exitosa:');
      console.log(JSON.stringify(previewDepartamental.data, null, 2));
    }

    console.log('🎉 Todas las pruebas exitosas!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testReportsFlow();
