const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignApprovalPermissions() {
  try {
    console.log('🔧 Asignando permisos de aprobación...');
    
    // Buscar el rol "Administrador del Sistema"
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrador del Sistema' }
    });

    if (!adminRole) {
      console.log('❌ No se encontró el rol "Administrador del Sistema"');
      return;
    }

    console.log(`✅ Rol encontrado: ${adminRole.name}`);

    // Buscar el permiso approve:progress-report
    const approvePermission = await prisma.permission.findFirst({
      where: {
        action: 'approve',
        resource: 'progress-report'
      }
    });

    if (!approvePermission) {
      console.log('❌ No se encontró el permiso approve:progress-report');
      return;
    }

    console.log(`✅ Permiso encontrado: ${approvePermission.action}:${approvePermission.resource}`);

    // Verificar si ya está asignado
    const existingAssignment = await prisma.rolePermission.findFirst({
      where: {
        roleId: adminRole.id,
        permissionId: approvePermission.id
      }
    });

    if (existingAssignment) {
      console.log('✅ El permiso ya está asignado al rol');
    } else {
      // Asignar el permiso
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: approvePermission.id
        }
      });
      console.log('✅ Permiso approve:progress-report asignado al Administrador del Sistema');
    }

    // Verificar usuario admin
    const adminUser = await prisma.user.findFirst({
      where: { username: 'admin' }
    });

    if (adminUser) {
      console.log(`✅ Usuario admin encontrado: ${adminUser.firstName} ${adminUser.lastName}`);
    } else {
      console.log('❌ Usuario admin no encontrado');
    }

    console.log('\n🎉 Configuración completada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignApprovalPermissions();
