const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPermissionEndpoint() {
  try {
    console.log('=== PROBANDO ENDPOINT DE PERMISOS ===\n');
    
    // Obtener todos los permisos como lo haría el endpoint
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });
    
    console.log(`📊 Total permisos disponibles: ${permissions.length}\n`);
    
    // Agrupar por recurso
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm.action);
      return acc;
    }, {});
    
    console.log('📋 Permisos agrupados por recurso:');
    Object.entries(groupedPermissions).forEach(([resource, actions]) => {
      console.log(`  🔸 ${resource}: [${actions.join(', ')}]`);
    });
    
    // Verificar si existe el permiso read:permission específicamente
    const readPermissionExists = permissions.find(p => 
      p.action === 'read' && p.resource === 'permission'
    );
    
    console.log(`\n🎯 Permiso crítico:`);
    console.log(`   read:permission: ${readPermissionExists ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    
    if (readPermissionExists) {
      console.log(`   ID: ${readPermissionExists.id}`);
    }
    
    console.log('\n✅ Endpoint de permisos debería funcionar correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionEndpoint();
