const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createApprovalPermissions() {
  try {
    console.log('🔐 Creando permisos de aprobación...');

    // 1. Crear el permiso de aprobación
    const approvePermission = await prisma.permission.upsert({
      where: {
        action_resource: {
          action: 'approve',
          resource: 'progress-report'
        }
      },
      update: {},
      create: {
        action: 'approve',
        resource: 'progress-report'
      }
    });

    console.log(`✅ Permiso creado: ${approvePermission.action}:${approvePermission.resource}`);

    // 2. Asignar el permiso a los roles apropiados
    const roles = await prisma.role.findMany({
      where: {
        name: {
          in: ['Administrador', 'Director Planificación', 'Director de Área']
        }
      }
    });

    for (const role of roles) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: approvePermission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: approvePermission.id
        }
      });

      console.log(`✅ Permiso asignado al rol: ${role.name}`);
    }

    // 3. Verificar usuarios que pueden aprobar
    const approvers = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['Administrador', 'Director Planificación', 'Director de Área']
          }
        },
        isActive: true
      },
      include: {
        role: true,
        department: true
      }
    });

    console.log('\n👥 Usuarios con permisos de aprobación:');
    approvers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.role.name}) - ${user.department?.name || 'Sin departamento'}`);
    });

    console.log('\n🎉 Permisos de aprobación configurados exitosamente!');

  } catch (error) {
    console.error('❌ Error al crear permisos de aprobación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createApprovalPermissions();
