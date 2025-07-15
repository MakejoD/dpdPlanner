const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // Verificar roles
    const roles = await prisma.role.findMany();
    console.log('\n👥 Roles existentes:');
    roles.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id})`);
    });
    
    // Verificar usuarios
    const users = await prisma.user.findMany({
      include: {
        UserRole: {
          include: { role: true }
        }
      }
    });
    
    console.log('\n👤 Usuarios con roles:');
    users.forEach(user => {
      console.log(`  - ${user.username}:`);
      user.UserRole.forEach(ur => {
        console.log(`    * ${ur.role.name}`);
      });
    });

    // Buscar rol administrador
    const adminRole = roles.find(r => r.name.toLowerCase().includes('admin') || r.name.toLowerCase() === 'administrador');
    
    if (adminRole) {
      console.log(`\n✅ Rol administrador encontrado: ${adminRole.name}`);
      
      // Asignar permisos de aprobación
      const approvePermission = await prisma.permission.findFirst({
        where: {
          action: 'approve',
          resource: 'progress-report'
        }
      });

      if (approvePermission) {
        const existing = await prisma.rolePermission.findFirst({
          where: {
            roleId: adminRole.id,
            permissionId: approvePermission.id
          }
        });

        if (!existing) {
          await prisma.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: approvePermission.id
            }
          });
          console.log('✅ Permiso approve:progress-report asignado al rol administrador');
        } else {
          console.log('✅ El rol administrador ya tiene el permiso');
        }
      }
    } else {
      console.log('❌ No se encontró rol de administrador');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
