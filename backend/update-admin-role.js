const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminRole() {
  try {
    console.log('🔧 Actualizando rol de Administrador...');

    // Buscar el rol de administrador
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrador' }
    });

    if (!adminRole) {
      console.error('❌ Rol de Administrador no encontrado');
      return;
    }

    // Obtener todos los permisos
    const allPermissions = await prisma.permission.findMany();
    console.log(`📋 ${allPermissions.length} permisos encontrados`);

    // Limpiar permisos existentes del rol admin
    await prisma.rolePermission.deleteMany({
      where: { roleId: adminRole.id }
    });

    console.log('🗑️ Permisos anteriores limpiados');

    // Asignar todos los permisos al administrador
    for (const permission of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }

    console.log(`✅ ${allPermissions.length} permisos asignados al Administrador`);

    // Verificar la asignación
    const adminPermissions = await prisma.rolePermission.count({
      where: { roleId: adminRole.id }
    });

    console.log(`🎉 Rol de Administrador actualizado con ${adminPermissions} permisos`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminRole();
