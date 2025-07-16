const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserPermissions() {
  console.log('🔍 VERIFICANDO PERMISOS DE USUARIOS\n');
  
  try {
    // Obtener todos los usuarios con roles y permisos
    const users = await prisma.user.findMany({
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });
    
    console.log('👥 USUARIOS Y PERMISOS:');
    console.log('======================\n');
    
    for (const user of users) {
      console.log(`📧 ${user.email}`);
      console.log(`👤 ${user.firstName} ${user.lastName}`);
      console.log(`🎭 Rol: ${user.role.name}`);
      console.log(`📋 Permisos (${user.role.rolePermissions.length}):`);
      
      const permissions = user.role.rolePermissions.map(rp => 
        `  • ${rp.permission.action}:${rp.permission.resource}`
      );
      
      console.log(permissions.join('\n'));
      
      // Verificar permisos específicos que están fallando
      const hasReadRole = user.role.rolePermissions.some(rp => 
        rp.permission.action === 'read' && rp.permission.resource === 'role'
      );
      const hasReadDepartment = user.role.rolePermissions.some(rp => 
        rp.permission.action === 'read' && rp.permission.resource === 'department'
      );
      
      console.log(`✅ Puede leer roles: ${hasReadRole ? 'SÍ' : 'NO'}`);
      console.log(`✅ Puede leer departamentos: ${hasReadDepartment ? 'SÍ' : 'NO'}`);
      console.log('─'.repeat(50));
    }
    
    // Verificar permisos disponibles
    console.log('\n🔐 PERMISOS DISPONIBLES EN EL SISTEMA:');
    console.log('=====================================\n');
    
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });
    
    let currentResource = '';
    for (const permission of permissions) {
      if (permission.resource !== currentResource) {
        console.log(`\n📂 ${permission.resource.toUpperCase()}:`);
        currentResource = permission.resource;
      }
      console.log(`  • ${permission.action}:${permission.resource}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions();
