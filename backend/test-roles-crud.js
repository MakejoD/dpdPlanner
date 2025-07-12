require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const axios = require('axios');

async function testRolesCRUD() {
  try {
    console.log('🔧 Probando CRUD de Roles y Permisos...\n');
    
    // 1. Login
    console.log('📝 Step 1: Login');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Obtener roles existentes
    console.log('👥 Step 2: Obtener roles existentes');
    const rolesResponse = await axios.get('http://localhost:3001/api/roles?includePermissions=true', { headers });
    console.log(`✅ ${rolesResponse.data.length} roles encontrados:`);
    rolesResponse.data.forEach(role => {
      console.log(`   - ${role.name}: ${role.permissions?.length || 0} permisos`);
    });
    console.log('');

    // 3. Obtener permisos disponibles
    console.log('🔑 Step 3: Obtener permisos disponibles');
    const permissionsResponse = await axios.get('http://localhost:3001/api/permissions', { headers });
    console.log(`✅ ${permissionsResponse.data.length} permisos encontrados`);
    
    // Agrupar por recurso para mostrar estructura
    const permissionsByResource = {};
    permissionsResponse.data.forEach(perm => {
      if (!permissionsByResource[perm.resource]) {
        permissionsByResource[perm.resource] = [];
      }
      permissionsByResource[perm.resource].push(perm.action);
    });
    
    console.log('📋 Permisos agrupados por recurso:');
    Object.entries(permissionsByResource).forEach(([resource, actions]) => {
      console.log(`   - ${resource}: [${actions.join(', ')}]`);
    });
    console.log('');

    // 4. Crear un nuevo rol de prueba
    console.log('➕ Step 4: Crear nuevo rol de prueba');
    const testPermissions = permissionsResponse.data
      .filter(p => p.resource === 'user' && ['create', 'read', 'update'].includes(p.action))
      .map(p => p.id);
    
    const newRoleData = {
      name: `Gestor de Usuarios Test ${Date.now()}`,
      description: 'Rol de prueba para gestión básica de usuarios',
      permissions: testPermissions
    };

    try {
      const createResponse = await axios.post('http://localhost:3001/api/roles', newRoleData, { headers });
      console.log(`✅ Rol creado: ${createResponse.data.message}`);
      const newRoleId = createResponse.data.role.id;
      
      // 5. Editar el rol recién creado
      console.log('\n✏️ Step 5: Editar rol recién creado');
      const updateData = {
        name: 'Gestor de Usuarios Test - Editado',
        description: 'Rol de prueba editado para gestión completa de usuarios',
        permissions: permissionsResponse.data
          .filter(p => p.resource === 'user')
          .map(p => p.id)
      };
      
      const updateResponse = await axios.put(`http://localhost:3001/api/roles/${newRoleId}`, updateData, { headers });
      console.log(`✅ Rol actualizado: ${updateResponse.data.message}`);
      
      // 6. Verificar cambios
      console.log('\n🔍 Step 6: Verificar cambios');
      const updatedRoleResponse = await axios.get(`http://localhost:3001/api/roles/${newRoleId}?includePermissions=true`, { headers });
      const updatedRole = updatedRoleResponse.data;
      console.log(`✅ Rol verificado: ${updatedRole.name}`);
      console.log(`   - Descripción: ${updatedRole.description}`);
      console.log(`   - Permisos: ${updatedRole.permissions.length}`);
      
      // 7. Eliminar el rol de prueba
      console.log('\n🗑️ Step 7: Eliminar rol de prueba');
      const deleteResponse = await axios.delete(`http://localhost:3001/api/roles/${newRoleId}`, { headers });
      console.log(`✅ Rol eliminado: ${deleteResponse.data.message}`);
      
    } catch (createError) {
      if (createError.response?.status === 400 && createError.response?.data?.message?.includes('ya existe')) {
        console.log('⚠️ El rol ya existe, saltando creación');
      } else {
        throw createError;
      }
    }

    console.log('\n🎉 Todas las pruebas CRUD completadas exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

testRolesCRUD();
