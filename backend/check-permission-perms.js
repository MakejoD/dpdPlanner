const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermissionPermissions() {
  try {
    console.log('🔍 Verificando permisos relacionados con "permission"...');
    
    // Buscar todos los permisos relacionados con permission
    const permissionPerms = await prisma.permission.findMany({
      where: { resource: 'permission' }
    });
    
    console.log('📋 Permisos encontrados para resource "permission":');
    permissionPerms.forEach(perm => {
      console.log(`- ${perm.action}:${perm.resource} (ID: ${perm.id})`);
    });
    
    if (permissionPerms.length === 0) {
      console.log('❌ No existen permisos para el resource "permission"');
      console.log('🔧 Creando permisos faltantes...');
      
      const permissionsToCreate = [
        { action: 'create', resource: 'permission' },
        { action: 'read', resource: 'permission' },
        { action: 'update', resource: 'permission' },
        { action: 'delete', resource: 'permission' }
      ];
      
      for (const perm of permissionsToCreate) {
        try {
          await prisma.permission.create({
            data: perm
          });
          console.log(`✅ Creado: ${perm.action}:${perm.resource}`);
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`⚠️ Ya existe: ${perm.action}:${perm.resource}`);
          } else {
            console.error(`❌ Error creando ${perm.action}:${perm.resource}:`, error.message);
          }
        }
      }
      
      // Obtener el rol de administrador
      const adminRole = await prisma.role.findFirst({
        where: { name: 'Administrador del Sistema' }
      });
      
      if (adminRole) {
        // Asignar los nuevos permisos al rol de administrador
        const newPermissions = await prisma.permission.findMany({
          where: { resource: 'permission' }
        });
        
        for (const perm of newPermissions) {
          try {
            await prisma.rolePermission.create({
              data: {
                roleId: adminRole.id,
                permissionId: perm.id
              }
            });
            console.log(`✅ Asignado al admin: ${perm.action}:${perm.resource}`);
          } catch (error) {
            if (error.code === 'P2002') {
              console.log(`⚠️ Ya asignado: ${perm.action}:${perm.resource}`);
            }
          }
        }
      }
    }
    
    // Verificar permisos finales del admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@poa.gov' },
      include: { 
        role: { 
          include: { 
            rolePermissions: { 
              include: { permission: true },
              where: { permission: { resource: 'permission' } }
            } 
          } 
        } 
      }
    });
    
    console.log('📊 Permisos de "permission" asignados al admin:');
    admin.role.rolePermissions.forEach(rp => {
      console.log(`- ${rp.permission.action}:${rp.permission.resource}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissionPermissions();
