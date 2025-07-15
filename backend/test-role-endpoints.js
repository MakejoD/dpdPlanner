const fetch = require('node-fetch');

async function testRoleManagementEndpoints() {
  try {
    console.log('=== PROBANDO ENDPOINTS DE GESTIÓN DE ROLES ===\n');
    
    const baseUrl = 'http://localhost:3001/api';
    
    // Simular login para obtener token
    console.log('🔐 Obteniendo token de autenticación...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@poa.gov',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Token obtenido exitosamente');
    
    // Probar endpoint de roles
    console.log('\n📊 Probando endpoint /roles...');
    const rolesResponse = await fetch(`${baseUrl}/roles?includePermissions=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!rolesResponse.ok) {
      const errorText = await rolesResponse.text();
      console.error(`❌ Error en /roles: ${rolesResponse.status} - ${errorText}`);
    } else {
      const rolesData = await rolesResponse.json();
      console.log('✅ Endpoint /roles respondió correctamente');
      console.log(`   - Success: ${rolesData.success}`);
      console.log(`   - Total roles: ${rolesData.data?.length || 0}`);
      console.log(`   - Primer rol: ${rolesData.data?.[0]?.name || 'N/A'}`);
      console.log(`   - Permisos del primer rol: ${rolesData.data?.[0]?.permissions?.length || 0}`);
    }
    
    // Probar endpoint de permisos
    console.log('\n🔑 Probando endpoint /permissions...');
    const permissionsResponse = await fetch(`${baseUrl}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!permissionsResponse.ok) {
      const errorText = await permissionsResponse.text();
      console.error(`❌ Error en /permissions: ${permissionsResponse.status} - ${errorText}`);
    } else {
      const permissionsData = await permissionsResponse.json();
      console.log('✅ Endpoint /permissions respondió correctamente');
      console.log(`   - Success: ${permissionsData.success}`);
      console.log(`   - Total permisos: ${permissionsData.data?.length || 0}`);
      console.log(`   - Primer permiso: ${permissionsData.data?.[0]?.action}:${permissionsData.data?.[0]?.resource || 'N/A'}`);
      
      // Mostrar algunos permisos agrupados
      const groupedPerms = {};
      if (permissionsData.data) {
        permissionsData.data.forEach(perm => {
          if (!groupedPerms[perm.resource]) groupedPerms[perm.resource] = [];
          groupedPerms[perm.resource].push(perm.action);
        });
        
        console.log('   - Recursos con permisos:');
        Object.entries(groupedPerms).slice(0, 5).forEach(([resource, actions]) => {
          console.log(`     * ${resource}: [${actions.join(', ')}]`);
        });
      }
    }
    
    console.log('\n✅ Prueba de endpoints completada!');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

testRoleManagementEndpoints();
