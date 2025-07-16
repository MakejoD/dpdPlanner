const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addObjectivePermissions() {
  try {
    console.log('🔧 Verificando permisos para objectives...');
    
    // Verificar si existen permisos para objective
    const objectivePermissions = await prisma.permission.findMany({
      where: { resource: 'objective' }
    });
    
    console.log('📋 Permisos existentes para objective:', objectivePermissions.length);
    
    if (objectivePermissions.length === 0) {
      console.log('🔧 Creando permisos para objective...');
      
      const permissionsToCreate = [
        { action: 'create', resource: 'objective' },
        { action: 'read', resource: 'objective' },
        { action: 'update', resource: 'objective' },
        { action: 'delete', resource: 'objective' }
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
          }
        }
      }
    }
    
    // Obtener el rol de administrador
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrador del Sistema' }
    });
    
    if (adminRole) {
      console.log('👤 Rol de admin encontrado:', adminRole.name);
      
      // Asignar permisos de objective al administrador
      const objectivePerms = await prisma.permission.findMany({
        where: { resource: 'objective' }
      });
      
      for (const perm of objectivePerms) {
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
    
    // Verificar permisos finales del admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@poa.gov' },
      include: { 
        role: { 
          include: { 
            rolePermissions: { 
              include: { permission: true },
              where: { permission: { resource: 'objective' } }
            } 
          } 
        } 
      }
    });
    
    console.log('📊 Permisos de objective asignados al admin:');
    admin.role.rolePermissions.forEach(rp => {
      console.log(`- ${rp.permission.action}:${rp.permission.resource}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addObjectivePermissions();
