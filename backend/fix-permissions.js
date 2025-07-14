const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creando todos los permisos del sistema POA...');

  try {
    // Definir todos los permisos del sistema
    const permissions = [
      // Administración de usuarios
      { action: 'create', resource: 'user' },
      { action: 'read', resource: 'user' },
      { action: 'update', resource: 'user' },
      { action: 'delete', resource: 'user' },
      
      // Administración de roles
      { action: 'create', resource: 'role' },
      { action: 'read', resource: 'role' },
      { action: 'update', resource: 'role' },
      { action: 'delete', resource: 'role' },
      
      // Administración de permisos
      { action: 'create', resource: 'permission' },
      { action: 'read', resource: 'permission' },
      { action: 'update', resource: 'permission' },
      { action: 'delete', resource: 'permission' },
      
      // Administración de departamentos
      { action: 'create', resource: 'department' },
      { action: 'read', resource: 'department' },
      { action: 'update', resource: 'department' },
      { action: 'delete', resource: 'department' },
      
      // Planificación estratégica - Ejes
      { action: 'create', resource: 'strategic_axis' },
      { action: 'read', resource: 'strategic_axis' },
      { action: 'update', resource: 'strategic_axis' },
      { action: 'delete', resource: 'strategic_axis' },
      { action: 'lock', resource: 'strategic_axis' },
      
      // Planificación estratégica - Objetivos
      { action: 'create', resource: 'objective' },
      { action: 'read', resource: 'objective' },
      { action: 'update', resource: 'objective' },
      { action: 'delete', resource: 'objective' },
      
      // Planificación estratégica - Productos
      { action: 'create', resource: 'product' },
      { action: 'read', resource: 'product' },
      { action: 'update', resource: 'product' },
      { action: 'delete', resource: 'product' },
      
      // Planificación estratégica - Actividades
      { action: 'create', resource: 'activity' },
      { action: 'read', resource: 'activity' },
      { action: 'update', resource: 'activity' },
      { action: 'delete', resource: 'activity' },
      { action: 'assign', resource: 'activity' },
      
      // Indicadores
      { action: 'create', resource: 'indicator' },
      { action: 'read', resource: 'indicator' },
      { action: 'update', resource: 'indicator' },
      { action: 'delete', resource: 'indicator' },
      
      // Reportes de progreso
      { action: 'create', resource: 'progress_report' },
      { action: 'read', resource: 'progress_report' },
      { action: 'update', resource: 'progress_report' },
      { action: 'delete', resource: 'progress_report' },
      { action: 'approve', resource: 'progress_report' },
      { action: 'reject', resource: 'progress_report' },
      
      // Presupuesto
      { action: 'create', resource: 'budget' },
      { action: 'read', resource: 'budget' },
      { action: 'update', resource: 'budget' },
      { action: 'delete', resource: 'budget' },
      { action: 'execute', resource: 'budget' },
      
      // Dashboard y reportes
      { action: 'read', resource: 'dashboard' },
      { action: 'export', resource: 'report' },
      { action: 'generate', resource: 'report' },
      
      // Seguimiento
      { action: 'read', resource: 'tracking' },
      { action: 'update', resource: 'tracking' },
      
      // Permisos especiales
      { action: 'manage', resource: 'all' },
      { action: 'audit', resource: 'all' }
    ];

    console.log(`📋 Creando ${permissions.length} permisos...`);

    // Crear cada permiso individualmente
    for (const permission of permissions) {
      try {
        await prisma.permission.upsert({
          where: {
            action_resource: {
              action: permission.action,
              resource: permission.resource
            }
          },
          update: {},
          create: permission
        });
        console.log(`  ✅ ${permission.action}:${permission.resource}`);
      } catch (error) {
        console.log(`  ❌ Error creando ${permission.action}:${permission.resource}:`, error.message);
      }
    }

    // Verificar cuántos permisos se crearon
    const totalPermissions = await prisma.permission.count();
    console.log(`\n✅ Total de permisos en la base de datos: ${totalPermissions}`);

    // Mostrar todos los permisos creados
    const allPermissions = await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    console.log('\n📊 Permisos por recurso:');
    const grouped = {};
    allPermissions.forEach(p => {
      if (!grouped[p.resource]) grouped[p.resource] = [];
      grouped[p.resource].push(p.action);
    });

    Object.keys(grouped).sort().forEach(resource => {
      console.log(`  📁 ${resource}: ${grouped[resource].join(', ')}`);
    });

    console.log('\n🎉 ¡Permisos creados exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });
