const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    console.log('🔍 Verificando roles existentes...');
    
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
            rolePermissions: true
          }
        }
      }
    });
    
    console.log(`\n📋 Roles encontrados (${roles.length}):`);
    
    roles.forEach(role => {
      console.log(`\n🎭 Rol: ${role.name}`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Descripción: ${role.description || 'Sin descripción'}`);
      console.log(`   Activo: ${role.isActive ? 'Sí' : 'No'}`);
      console.log(`   Usuarios: ${role._count.users}`);
      console.log(`   Permisos: ${role._count.rolePermissions}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
