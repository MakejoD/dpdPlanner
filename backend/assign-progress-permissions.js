const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignProgressPermissions() {
  try {
    console.log('🔍 Verificando usuario Juan...');
    
    const juan = await prisma.user.findFirst({
      where: { email: 'juan.perez@poa.gov' },
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

    if (!juan) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log(`✅ Usuario: ${juan.firstName} ${juan.lastName}`);
    console.log(`🏷️ Rol: ${juan.role.name}`);
    console.log(`📋 Permisos actuales: ${juan.role.rolePermissions.length}`);

    // Buscar permisos de progress_report
    const progressPermissions = await prisma.permission.findMany({
      where: {
        resource: 'progress_report'
      }
    });

    console.log(`🎯 Permisos de progress_report disponibles: ${progressPermissions.length}`);

    // Asignar permisos de progress_report al rol técnico registrador
    for (const permission of progressPermissions) {
      const existingRolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: juan.roleId,
          permissionId: permission.id
        }
      });

      if (!existingRolePermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: juan.roleId,
            permissionId: permission.id
          }
        });
        console.log(`✅ Asignado: ${permission.action} en ${permission.resource}`);
      } else {
        console.log(`ℹ️ Ya existe: ${permission.action} en ${permission.resource}`);
      }
    }

    console.log('✅ Permisos actualizados para el rol Técnico Registrador');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assignProgressPermissions();
