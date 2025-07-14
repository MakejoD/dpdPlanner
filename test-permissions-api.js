const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testPermissionsAPI() {
  try {
    console.log('🧪 Probando API de Permisos');
    console.log('===========================');

    // 1. Login
    console.log('🔐 1. Haciendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');

    // 2. Obtener permisos
    console.log('🔑 2. Obteniendo permisos...');
    const permissionsResponse = await axios.get(`${baseURL}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📋 Respuesta de permisos:');
    console.log(`- Total permisos: ${permissionsResponse.data.data.length}`);
    console.log('- Permisos encontrados:');
    
    permissionsResponse.data.data.forEach((permission, index) => {
      console.log(`  ${index + 1}. ${permission.action}:${permission.resource} (ID: ${permission.id})`);
    });

    // 3. Obtener permisos agrupados
    console.log('\n🔑 3. Obteniendo permisos agrupados...');
    const groupedPermissionsResponse = await axios.get(`${baseURL}/permissions?groupBy=resource`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Permisos agrupados por recurso:');
    Object.keys(groupedPermissionsResponse.data.data).forEach(resource => {
      console.log(`\n  📁 ${resource}:`);
      groupedPermissionsResponse.data.data[resource].forEach(permission => {
        console.log(`    - ${permission.action} (ID: ${permission.id})`);
      });
    });

    // 4. Probar endpoint de roles
    console.log('\n👥 4. Probando endpoint de roles...');
    const rolesResponse = await axios.get(`${baseURL}/roles?includePermissions=true`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📋 Respuesta de roles:');
    console.log(`- Total roles: ${rolesResponse.data.data.length}`);
    rolesResponse.data.data.forEach(role => {
      console.log(`  - ${role.name}: ${role.permissions?.length || 0} permisos`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPermissionsAPI();
