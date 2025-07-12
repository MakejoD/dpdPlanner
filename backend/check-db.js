const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Verificando datos en la base de datos...\n');

  try {
    // Verificar usuarios
    const users = await prisma.user.findMany({
      include: {
        role: true,
        department: true
      }
    });
    
    console.log('👥 Usuarios encontrados:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - Rol: ${user.role?.name}`);
    });

    // Verificar roles
    const roles = await prisma.role.findMany();
    console.log('\n🎭 Roles encontrados:', roles.length);
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.description}`);
    });

    // Verificar permisos
    const permissions = await prisma.permission.findMany();
    console.log('\n🔐 Permisos encontrados:', permissions.length);
    permissions.forEach(permission => {
      console.log(`  - ${permission.action}:${permission.resource}`);
    });

    // Verificar relaciones rol-permiso
    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        role: true,
        permission: true
      }
    });
    console.log('\n🔗 Relaciones rol-permiso:', rolePermissions.length);

  } catch (error) {
    console.error('❌ Error al verificar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
