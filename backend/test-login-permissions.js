const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('=== PROBANDO LOGIN Y PERMISOS ===\n');
    
    // Simular el proceso de login
    const email = 'admin@poa.gov';
    
    // Buscar usuario como lo hace el endpoint de login
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log(`👤 Usuario encontrado: ${user.firstName} ${user.lastName}`);
    console.log(`🔑 Rol: ${user.role.name}`);
    console.log(`📊 Total permisos: ${user.role.rolePermissions.length}`);
    
    // Formatear permisos como lo hace el backend
    const permissions = user.role.rolePermissions.map(rp => ({
      action: rp.permission.action,
      resource: rp.permission.resource
    }));
    
    // Verificar permiso específico
    const hasReadPermission = permissions.some(p => 
      p.action === 'read' && p.resource === 'permission'
    );
    
    console.log(`\n🎯 Permiso crítico para /api/permissions:`);
    console.log(`   read:permission: ${hasReadPermission ? '✅' : '❌'}`);
    
    if (hasReadPermission) {
      console.log('\n✅ El usuario DEBERÍA poder acceder a /api/permissions');
      console.log('💡 Si sigue fallando, el usuario debe cerrar sesión y volver a iniciar sesión');
    } else {
      console.log('\n❌ El usuario NO puede acceder a /api/permissions');
    }
    
    // Mostrar algunos permisos para verificar
    console.log('\n📋 Primeros 10 permisos:');
    permissions.slice(0, 10).forEach(p => {
      console.log(`   - ${p.action}:${p.resource}`);
    });
    
    // Buscar específicamente permisos de permission
    const permissionPerms = permissions.filter(p => p.resource === 'permission');
    console.log(`\n🔧 Permisos para 'permission' (${permissionPerms.length}):`);
    permissionPerms.forEach(p => {
      console.log(`   - ${p.action}:${p.resource}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
