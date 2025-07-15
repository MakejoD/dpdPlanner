const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixPermissions() {
  try {
    console.log('🔍 Verificando permisos existentes...');
    
    // Buscar todos los permisos relacionados con progress
    const progressPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { resource: { contains: 'progress' } },
          { resource: { contains: 'report' } }
        ]
      }
    });
    
    console.log('\n📋 Permisos encontrados:');
    progressPermissions.forEach(p => {
      console.log(`  - ${p.action}:${p.resource} (ID: ${p.id})`);
    });

    // Crear el permiso con guión si no existe
    let approveProgressReport = await prisma.permission.findFirst({
      where: {
        action: 'approve',
        resource: 'progress-report'
      }
    });

    if (!approveProgressReport) {
      console.log('\n🆕 Creando permiso approve:progress-report...');
      approveProgressReport = await prisma.permission.create({
        data: {
          action: 'approve',
          resource: 'progress-report', // Con guión
          description: 'Aprobar informes de avance'
        }
      });
      console.log('✅ Permiso approve:progress-report creado');
    } else {
      console.log('\n✅ Permiso approve:progress-report ya existe');
    }

    // Asignar al rol admin
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (adminRole) {
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: adminRole.id,
          permissionId: approveProgressReport.id
        }
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: approveProgressReport.id
          }
        });
        console.log('✅ Permiso asignado al rol admin');
      }
    }

    // Verificar permisos finales del admin
    const admin = await prisma.user.findFirst({
      where: { username: 'admin' },
      include: {
        UserRole: {
          include: {
            role: {
              include: {
                RolePermission: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    console.log('\n👤 Permisos del usuario admin:');
    if (admin && admin.UserRole.length > 0) {
      admin.UserRole.forEach(ur => {
        console.log(`\n  Rol: ${ur.role.name}`);
        ur.role.RolePermission.forEach(rp => {
          console.log(`    - ${rp.permission.action}:${rp.permission.resource}`);
        });
      });
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixPermissions();
