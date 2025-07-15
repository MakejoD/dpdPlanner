const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixApprovalPermissions() {
  try {
    console.log('🔧 Corrigiendo permisos de aprobación...');
    
    // Verificar permisos existentes
    const existingPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { action: 'approve', resource: 'progress_report' },
          { action: 'approve', resource: 'progress-report' }
        ]
      }
    });
    
    console.log('📋 Permisos existentes:');
    existingPermissions.forEach(p => {
      console.log(`  - ${p.action}:${p.resource} (ID: ${p.id})`);
    });

    // Crear permiso con guión si no existe
    let approvePermissionWithHyphen = existingPermissions.find(p => p.resource === 'progress-report');
    
    if (!approvePermissionWithHyphen) {
      console.log('\n🆕 Creando permiso approve:progress-report...');
      approvePermissionWithHyphen = await prisma.permission.create({
        data: {
          action: 'approve',
          resource: 'progress-report' // Con guión para coincidir con el backend
        }
      });
      console.log('✅ Permiso approve:progress-report creado');
    } else {
      console.log('✅ Permiso approve:progress-report ya existe');
    }

    // Asignar al rol admin
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('❌ No se encontró el rol admin');
      return;
    }

    const existingAssignment = await prisma.rolePermission.findFirst({
      where: {
        roleId: adminRole.id,
        permissionId: approvePermissionWithHyphen.id
      }
    });

    if (!existingAssignment) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: approvePermissionWithHyphen.id
        }
      });
      console.log('✅ Permiso approve:progress-report asignado al rol admin');
    } else {
      console.log('✅ Rol admin ya tiene el permiso approve:progress-report');
    }

    // También asignar otros permisos relacionados si no los tiene
    const relatedPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { action: 'read', resource: 'progress-report' },
          { action: 'read', resource: 'progress_report' }
        ]
      }
    });

    for (const permission of relatedPermissions) {
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });
        console.log(`✅ Permiso ${permission.action}:${permission.resource} asignado al admin`);
      }
    }

    console.log('\n🎯 Verificando permisos finales del admin...');
    const adminWithRoles = await prisma.user.findFirst({
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

    if (adminWithRoles) {
      console.log('\n👤 Permisos del usuario admin:');
      const allPermissions = [];
      adminWithRoles.UserRole.forEach(ur => {
        ur.role.RolePermission.forEach(rp => {
          allPermissions.push(`${rp.permission.action}:${rp.permission.resource}`);
        });
      });
      
      const uniquePermissions = [...new Set(allPermissions)].sort();
      uniquePermissions.forEach(perm => {
        if (perm.includes('progress') || perm.includes('approve')) {
          console.log(`  ✓ ${perm}`);
        }
      });
    }

    console.log('\n🎉 Configuración de permisos completada');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApprovalPermissions();
