const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingPermissions() {
  try {
    console.log('=== AGREGANDO PERMISOS FALTANTES PARA GESTIÓN DE ROLES ===\n');
    
    // Permisos adicionales necesarios para gestión completa de roles
    const missingPermissions = [
      { action: 'read', resource: 'permission' },
      { action: 'create', resource: 'permission' },
      { action: 'update', resource: 'permission' },
      { action: 'delete', resource: 'permission' },
      { action: 'manage', resource: 'permission' }
    ];
    
    console.log('🔧 Creando permisos faltantes...');
    
    // Crear permisos si no existen
    for (const perm of missingPermissions) {
      const existingPermission = await prisma.permission.findFirst({
        where: {
          action: perm.action,
          resource: perm.resource
        }
      });
      
      if (!existingPermission) {
        await prisma.permission.create({
          data: perm
        });
        console.log(`➕ Permiso creado: ${perm.action}:${perm.resource}`);
      } else {
        console.log(`✅ Permiso ya existe: ${perm.action}:${perm.resource}`);
      }
    }
    
    // Asignar todos los permisos al rol de administrador
    console.log('\n👑 Asignando permisos al rol Administrador...');
    
    const adminRole = await prisma.role.findFirst({
      where: { name: { contains: 'Administrador' } }
    });
    
    if (adminRole) {
      for (const perm of missingPermissions) {
        const permission = await prisma.permission.findFirst({
          where: {
            action: perm.action,
            resource: perm.resource
          }
        });
        
        if (permission) {
          const existingRolePermission = await prisma.rolePermission.findFirst({
            where: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          });
          
          if (!existingRolePermission) {
            await prisma.rolePermission.create({
              data: {
                roleId: adminRole.id,
                permissionId: permission.id
              }
            });
            console.log(`✅ Permiso asignado al admin: ${perm.action}:${perm.resource}`);
          } else {
            console.log(`✅ Permiso ya asignado: ${perm.action}:${perm.resource}`);
          }
        }
      }
    }
    
    // Verificar resultado final
    console.log('\n🔍 Verificación final...');
    
    const adminUser = await prisma.user.findFirst({
      where: { role: { name: { contains: 'Administrador' } } },
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
    
    if (adminUser) {
      const permissions = adminUser.role.rolePermissions.map(rp => 
        `${rp.permission.action}:${rp.permission.resource}`
      );
      
      console.log(`👤 Usuario admin: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`📊 Total permisos: ${adminUser.role.rolePermissions.length}`);
      
      const permissionPermissions = permissions.filter(p => p.includes('permission'));
      console.log('\\n🔑 Permisos para gestión de permisos:');
      permissionPermissions.forEach(perm => {
        console.log(`   ${perm}: ✅`);
      });
      
      // Verificar específicamente el permiso read:permission
      const hasReadPermission = permissions.includes('read:permission');
      console.log(`\\n🎯 Permiso crítico:`);
      console.log(`   read:permission: ${hasReadPermission ? '✅' : '❌'}`);
    }
    
    console.log('\\n✅ Permisos agregados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingPermissions();
