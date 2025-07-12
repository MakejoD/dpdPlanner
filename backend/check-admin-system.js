const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminSystem() {
  try {
    console.log('🔍 Revisión completa del sistema de administración\n');

    // Verificar roles
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        users: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            users: true,
            rolePermissions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('🎭 ROLES DEL SISTEMA:');
    console.log('═'.repeat(50));
    
    if (roles.length === 0) {
      console.log('❌ No hay roles configurados en el sistema');
    } else {
      roles.forEach(role => {
        console.log(`📋 ${role.name} (ID: ${role.id})`);
        console.log(`   Descripción: ${role.description}`);
        console.log(`   Estado: ${role.isActive ? '✅ Activo' : '❌ Inactivo'}`);
        console.log(`   Usuarios asignados: ${role._count.users}`);
        console.log(`   Permisos: ${role._count.rolePermissions}`);
        
        if (role.users.length > 0) {
          console.log('   👥 Usuarios con este rol:');
          role.users.forEach(user => {
            console.log(`      - ${user.firstName} ${user.lastName} (${user.email})`);
          });
        }
        
        if (role.rolePermissions.length > 0) {
          console.log('   🔐 Permisos asignados:');
          role.rolePermissions.forEach(rp => {
            console.log(`      - ${rp.permission.action}:${rp.permission.resource} - ${rp.permission.description || 'Sin descripción'}`);
          });
        }
        console.log('');
      });
    }

    // Verificar permisos
    const permissions = await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true
          }
        }
      },
      orderBy: { resource: 'asc' }
    });

    console.log('\n🔐 PERMISOS DEL SISTEMA:');
    console.log('═'.repeat(50));
    
    if (permissions.length === 0) {
      console.log('❌ No hay permisos configurados en el sistema');
    } else {
      const groupedPermissions = permissions.reduce((acc, perm) => {
        const resource = perm.resource;
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(perm);
        return acc;
      }, {});

      Object.keys(groupedPermissions).forEach(resource => {
        console.log(`📁 Recurso: ${resource.toUpperCase()}`);
        groupedPermissions[resource].forEach(perm => {
          console.log(`   ${perm.action}: ${perm.action} en ${perm.resource} (Usado en ${perm._count.rolePermissions} roles)`);
        });
        console.log('');
      });
    }

    // Verificar usuarios con roles y departamentos
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            name: true,
            description: true
          }
        },
        department: {
          select: {
            name: true
          }
        }
      },
      orderBy: { email: 'asc' }
    });

    console.log('\n👥 USUARIOS DEL SISTEMA:');
    console.log('═'.repeat(50));
    
    users.forEach(user => {
      console.log(`👤 ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏢 Departamento: ${user.department?.name || 'Sin asignar'}`);
      console.log(`    Estado: ${user.isActive ? '✅ Activo' : '❌ Inactivo'}`);
      
      if (user.role) {
        console.log(`   🎭 Rol asignado: ${user.role.name} - ${user.role.description || 'Sin descripción'}`);
      } else {
        console.log('   ⚠️  Sin rol asignado');
      }
      console.log('');
    });

    // Estadísticas finales
    console.log('\n📊 ESTADÍSTICAS DEL SISTEMA:');
    console.log('═'.repeat(50));
    console.log(`Total de roles: ${roles.length}`);
    console.log(`Total de permisos: ${permissions.length}`);
    console.log(`Total de usuarios: ${users.length}`);
    console.log(`Usuarios activos: ${users.filter(u => u.isActive).length}`);
    console.log(`Usuarios con roles: ${users.filter(u => u.role).length}`);
    console.log(`Usuarios sin departamento: ${users.filter(u => !u.department).length}`);

  } catch (error) {
    console.error('❌ Error al revisar el sistema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminSystem();
