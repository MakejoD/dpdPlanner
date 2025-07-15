const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserNamesAndPermissions() {
  try {
    console.log('=== CORRIGIENDO NOMBRES DE USUARIOS Y PERMISOS ===\n');
    
    // 1. Primero corregir los nombres de usuarios que aparecen como undefined
    const users = await prisma.user.findMany();
    
    console.log('📝 Corrigiendo nombres de usuarios...');
    for (const user of users) {
      if (!user.firstName || !user.lastName) {
        const nameParts = user.email.split('@')[0].split('.');
        const firstName = nameParts[0] || 'Usuario';
        const lastName = nameParts[1] || 'Sistema';
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
            lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1)
          }
        });
        
        console.log(`✅ Usuario actualizado: ${firstName} ${lastName} (${user.email})`);
      }
    }
    
    // 2. Agregar permisos faltantes
    console.log('\n🔑 Verificando y agregando permisos faltantes...');
    
    // Permisos que deben existir
    const requiredPermissions = [
      { action: 'read', resource: 'role' },
      { action: 'read', resource: 'objective' },
      { action: 'read', resource: 'department' },
      { action: 'read', resource: 'product' },
      { action: 'create', resource: 'role' },
      { action: 'update', resource: 'role' },
      { action: 'delete', resource: 'role' },
      { action: 'create', resource: 'objective' },
      { action: 'update', resource: 'objective' },
      { action: 'delete', resource: 'objective' },
      { action: 'read', resource: 'product' },
      { action: 'create', resource: 'product' },
      { action: 'update', resource: 'product' },
      { action: 'delete', resource: 'product' },
      { action: 'create', resource: 'department' },
      { action: 'update', resource: 'department' },
      { action: 'delete', resource: 'department' }
    ];
    
    // Crear permisos si no existen
    for (const perm of requiredPermissions) {
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
      }
    }
    
    // 3. Asignar permisos al rol de administrador
    console.log('\n👑 Asignando permisos al rol Administrador...');
    
    const adminRole = await prisma.role.findFirst({
      where: { name: { contains: 'Administrador' } }
    });
    
    if (adminRole) {
      for (const perm of requiredPermissions) {
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
          }
        }
      }
    }
    
    // 4. Verificar resultado final
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
      console.log(`👤 Usuario admin: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`📊 Total permisos: ${adminUser.role.rolePermissions.length}`);
      
      const permissions = adminUser.role.rolePermissions.map(rp => 
        `${rp.permission.action}:${rp.permission.resource}`
      );
      
      const criticalPermissions = ['read:role', 'read:objective', 'read:department', 'read:product'];
      console.log('\n🎯 Permisos críticos para menú:');
      criticalPermissions.forEach(perm => {
        const hasPermission = permissions.includes(perm);
        console.log(`   ${perm}: ${hasPermission ? '✅' : '❌'}`);
      });
    }
    
    console.log('\n✅ Corrección completada!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserNamesAndPermissions();
