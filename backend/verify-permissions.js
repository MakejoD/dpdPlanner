const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUserPermissions() {
  try {
    console.log('=== VERIFICANDO PERMISOS DE USUARIOS ===\n');
    
    // Buscar todos los usuarios con sus roles y permisos
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
        },
        department: true
      }
    });
    
    console.log(`📊 Total usuarios encontrados: ${users.length}\n`);
    
    users.forEach(user => {
      const fullName = `${user.firstName} ${user.lastName}`;
      console.log(`👤 Usuario: ${fullName} (${user.email})`);
      console.log(`🔑 Rol: ${user.role.name}`);
      console.log(`🏢 Departamento: ${user.department?.name || 'Sin departamento'}`);
      console.log(`📋 Permisos (${user.role.rolePermissions.length}):`);
      
      const permissions = user.role.rolePermissions.map(rp => 
        `${rp.permission.action}:${rp.permission.resource}`
      );
      
      permissions.forEach(perm => {
        console.log(`   - ${perm}`);
      });
      
      // Verificar permisos específicos para menús
      const hasRolePermission = permissions.includes('read:role');
      const hasObjectivePermission = permissions.includes('read:objective');
      const hasUserPermission = permissions.includes('read:user');
      const hasDepartmentPermission = permissions.includes('read:department');
      
      console.log(`🔍 Permisos para menú:`);
      console.log(`   - Roles: ${hasRolePermission ? '✅' : '❌'}`);
      console.log(`   - Objetivos: ${hasObjectivePermission ? '✅' : '❌'}`);
      console.log(`   - Usuarios: ${hasUserPermission ? '✅' : '❌'}`);
      console.log(`   - Departamentos: ${hasDepartmentPermission ? '✅' : '❌'}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUserPermissions();
