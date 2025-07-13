const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testSpecificComponents() {
  try {
    console.log('🔍 Probando componentes específicos de administración...\n');

    // 1. Login
    console.log('📝 Test 1: Login');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 2. Test UserManagement - verificar estructura de respuesta
    console.log('\n👥 Test 2: UserManagement - GET /users');
    const usersResponse = await axios.get(`${BASE_URL}/users`, config);
    console.log('Estructura completa de usuarios:');
    console.log(JSON.stringify(usersResponse.data, null, 2));
    
    const users = usersResponse.data?.users || usersResponse.data;
    console.log(`Usuarios extraídos: ${Array.isArray(users) ? users.length : 'No es array'}`);

    // 3. Test RoleManagement - verificar roles con permisos
    console.log('\n🎭 Test 3: RoleManagement - GET /roles?includePermissions=true');
    const rolesResponse = await axios.get(`${BASE_URL}/roles?includePermissions=true`, config);
    console.log('Estructura completa de roles:');
    console.log(JSON.stringify(rolesResponse.data, null, 2).substring(0, 1000) + '...');
    
    const roles = rolesResponse.data;
    console.log(`Roles extraídos: ${Array.isArray(roles) ? roles.length : 'No es array'}`);
    
    if (Array.isArray(roles) && roles.length > 0) {
      console.log(`Primer rol tiene permisos: ${roles[0].permissions ? roles[0].permissions.length : 0}`);
    }

    // 4. Test permisos independientes
    console.log('\n🔐 Test 4: Permisos independientes - GET /permissions');
    const permissionsResponse = await axios.get(`${BASE_URL}/permissions`, config);
    console.log('Estructura completa de permisos:');
    console.log(JSON.stringify(permissionsResponse.data, null, 2).substring(0, 1000) + '...');
    
    const permissions = permissionsResponse.data;
    console.log(`Permisos extraídos: ${Array.isArray(permissions) ? permissions.length : 'No es array'}`);

    // 5. Test DepartmentManagement - verificar departamentos
    console.log('\n🏢 Test 5: DepartmentManagement - GET /departments');
    const departmentsResponse = await axios.get(`${BASE_URL}/departments`, config);
    console.log('Estructura completa de departamentos:');
    console.log(JSON.stringify(departmentsResponse.data, null, 2).substring(0, 1000) + '...');
    
    const departments = departmentsResponse.data;
    console.log(`Departamentos extraídos: ${Array.isArray(departments) ? departments.length : 'No es array'}`);

    console.log('\n🎉 Análisis completado');

  } catch (error) {
    console.error('❌ Error en test:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testSpecificComponents();
