const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApiResponses() {
  try {
    console.log('=== VERIFICANDO ESTRUCTURA DE RESPUESTAS DE API ===\n');
    
    // 1. Verificar estructura de roles
    console.log('📊 ROLES:');
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });
    
    const rolesWithFormattedPermissions = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      userCount: role._count.users,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        action: rp.permission.action,
        resource: rp.permission.resource
      }))
    }));
    
    console.log('Estructura de roles esperada:');
    console.log(JSON.stringify({
      success: true,
      data: rolesWithFormattedPermissions.slice(0, 1), // Solo el primero para ejemplo
      message: 'Roles obtenidos exitosamente',
      total: rolesWithFormattedPermissions.length
    }, null, 2));
    
    // 2. Verificar estructura de permisos
    console.log('\n📋 PERMISOS:');
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });
    
    console.log('Estructura de permisos esperada:');
    console.log(JSON.stringify({
      success: true,
      data: permissions.slice(0, 5), // Solo los primeros 5 para ejemplo
      message: 'Permisos obtenidos exitosamente',
      total: permissions.length
    }, null, 2));
    
    console.log(`\n📈 TOTALES:`);
    console.log(`  - Roles: ${rolesWithFormattedPermissions.length}`);
    console.log(`  - Permisos: ${permissions.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiResponses();
