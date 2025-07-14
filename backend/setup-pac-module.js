const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPACRolesAndPermissions() {
  try {
    console.log('🏗️ Creando roles y permisos del módulo PAC...\n');

    // 1. Crear nuevos permisos del PAC
    console.log('📋 Creando permisos del módulo PAC...');
    
    const pacPermissions = [
      // Permisos de procesos de compra
      { action: 'create', resource: 'procurement_process' },
      { action: 'read', resource: 'procurement_process' },
      { action: 'update', resource: 'procurement_process' },
      { action: 'delete', resource: 'procurement_process' },
      { action: 'approve', resource: 'procurement_process' },
      { action: 'publish', resource: 'procurement_process' },
      { action: 'cancel', resource: 'procurement_process' },
      { action: 'award', resource: 'procurement_process' },
      
      // Permisos de vinculación POA-PAC
      { action: 'create', resource: 'activity_procurement_link' },
      { action: 'read', resource: 'activity_procurement_link' },
      { action: 'update', resource: 'activity_procurement_link' },
      { action: 'delete', resource: 'activity_procurement_link' },
      
      // Permisos de solicitud y seguimiento
      { action: 'request', resource: 'procurement_process' },
      { action: 'track', resource: 'procurement_process' }
    ];

    for (const permission of pacPermissions) {
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
      console.log(`✅ Permiso creado: ${permission.action}:${permission.resource}`);
    }

    // 2. Crear nuevos roles del PAC
    console.log('\n👥 Creando nuevos roles del PAC...');
    
    const directorComprasRole = await prisma.role.upsert({
      where: { name: 'Director de Compras y Contrataciones' },
      update: {},
      create: {
        name: 'Director de Compras y Contrataciones',
        description: 'Responsable de la formulación y gestión del PAC institucional. CRUD completo sobre procesos de compra y acceso de lectura al POA.'
      }
    });
    console.log(`✅ Rol creado: ${directorComprasRole.name}`);

    const analistaComprasRole = await prisma.role.upsert({
      where: { name: 'Analista de Compras' },
      update: {},
      create: {
        name: 'Analista de Compras',
        description: 'Rol operativo que carga y prepara expedientes de compra. Puede crear y actualizar borradores de procesos de compra y vincularlos al POA.'
      }
    });
    console.log(`✅ Rol creado: ${analistaComprasRole.name}`);

    // 3. Obtener todos los permisos existentes
    console.log('\n🔐 Asignando permisos a roles...');
    const allPermissions = await prisma.permission.findMany();
    
    // Crear mapa de permisos por acción:recurso
    const permissionMap = {};
    allPermissions.forEach(perm => {
      const key = `${perm.action}:${perm.resource}`;
      permissionMap[key] = perm.id;
    });

    // 4. Asignar permisos al Director de Compras y Contrataciones
    console.log('\n📝 Configurando Director de Compras y Contrataciones...');
    
    const directorComprasPermissions = [
      // CRUD completo sobre procesos de compra
      'create:procurement_process', 'read:procurement_process', 'update:procurement_process', 'delete:procurement_process',
      'approve:procurement_process', 'publish:procurement_process', 'cancel:procurement_process', 'award:procurement_process',
      
      // Gestión de vinculaciones POA-PAC
      'create:activity_procurement_link', 'read:activity_procurement_link', 'update:activity_procurement_link', 'delete:activity_procurement_link',
      
      // Seguimiento de procesos
      'request:procurement_process', 'track:procurement_process',
      
      // Acceso de LECTURA al POA para entender contexto
      'read:strategic_axis', 'read:objective', 'read:product', 'read:activity', 'read:indicator',
      'read:progress_report', 'read:budget',
      
      // Dashboard y reportes
      'read:dashboard', 'export:report',
      
      // Lectura de estructura organizacional
      'read:department', 'read:user'
    ];

    // Limpiar permisos existentes del rol
    await prisma.rolePermission.deleteMany({
      where: { roleId: directorComprasRole.id }
    });

    // Asignar nuevos permisos
    const directorValidPermissions = [];
    for (const permKey of directorComprasPermissions) {
      if (permissionMap[permKey]) {
        directorValidPermissions.push({
          roleId: directorComprasRole.id,
          permissionId: permissionMap[permKey]
        });
      } else {
        console.log(`   ⚠️  Permiso '${permKey}' no encontrado`);
      }
    }

    if (directorValidPermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: directorValidPermissions
      });
      console.log(`   ✅ ${directorValidPermissions.length} permisos asignados al Director de Compras`);
    }

    // 5. Asignar permisos al Analista de Compras
    console.log('\n📝 Configurando Analista de Compras...');
    
    const analistaComprasPermissions = [
      // Crear y actualizar borradores de procesos de compra (no aprobar ni publicar)
      'create:procurement_process', 'read:procurement_process', 'update:procurement_process',
      
      // Vincular procesos a actividades del POA
      'create:activity_procurement_link', 'read:activity_procurement_link', 'update:activity_procurement_link',
      
      // Seguimiento de procesos
      'track:procurement_process',
      
      // Lectura del POA para vinculación
      'read:strategic_axis', 'read:objective', 'read:product', 'read:activity', 'read:indicator',
      'read:budget',
      
      // Dashboard básico
      'read:dashboard',
      
      // Lectura de estructura organizacional
      'read:department', 'read:user'
    ];

    // Limpiar permisos existentes del rol
    await prisma.rolePermission.deleteMany({
      where: { roleId: analistaComprasRole.id }
    });

    // Asignar nuevos permisos
    const analistaValidPermissions = [];
    for (const permKey of analistaComprasPermissions) {
      if (permissionMap[permKey]) {
        analistaValidPermissions.push({
          roleId: analistaComprasRole.id,
          permissionId: permissionMap[permKey]
        });
      } else {
        console.log(`   ⚠️  Permiso '${permKey}' no encontrado`);
      }
    }

    if (analistaValidPermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: analistaValidPermissions
      });
      console.log(`   ✅ ${analistaValidPermissions.length} permisos asignados al Analista de Compras`);
    }

    // 6. Actualizar roles existentes con permisos PAC adicionales
    console.log('\n🔄 Actualizando roles existentes...');
    
    // Director de Área: solicitar compras y acceso de lectura
    const directorAreaRole = await prisma.role.findUnique({
      where: { name: 'Director de Área' }
    });

    if (directorAreaRole) {
      const directorAreaNewPermissions = [
        'request:procurement_process',
        'read:procurement_process',
        'track:procurement_process',
        'read:activity_procurement_link'
      ];

      for (const permKey of directorAreaNewPermissions) {
        if (permissionMap[permKey]) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: directorAreaRole.id,
                permissionId: permissionMap[permKey]
              }
            },
            update: {},
            create: {
              roleId: directorAreaRole.id,
              permissionId: permissionMap[permKey]
            }
          });
        }
      }
      console.log(`   ✅ Permisos PAC asignados al Director de Área`);
    }

    // Director de Planificación: acceso completo de lectura al PAC
    const directorPlanificacionRole = await prisma.role.findUnique({
      where: { name: 'Director de Planificación' }
    });

    if (directorPlanificacionRole) {
      const directorPlanificacionNewPermissions = [
        'read:procurement_process',
        'read:activity_procurement_link',
        'track:procurement_process'
      ];

      for (const permKey of directorPlanificacionNewPermissions) {
        if (permissionMap[permKey]) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: directorPlanificacionRole.id,
                permissionId: permissionMap[permKey]
              }
            },
            update: {},
            create: {
              roleId: directorPlanificacionRole.id,
              permissionId: permissionMap[permKey]
            }
          });
        }
      }
      console.log(`   ✅ Permisos PAC asignados al Director de Planificación`);
    }

    // Administrador: todos los permisos PAC
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Administrador' }
    });

    if (adminRole) {
      const pacPermissionIds = allPermissions
        .filter(p => p.resource.includes('procurement') || p.resource.includes('activity_procurement_link'))
        .map(p => p.id);

      for (const permissionId of pacPermissionIds) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permissionId
            }
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permissionId
          }
        });
      }
      console.log(`   ✅ Todos los permisos PAC asignados al Administrador`);
    }

    // 7. Mostrar resumen final
    console.log('\n📊 Resumen de configuración PAC:');
    console.log('═'.repeat(60));
    
    const rolesWithPACPermissions = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true
          }
        },
        rolePermissions: {
          include: {
            permission: true
          },
          where: {
            permission: {
              OR: [
                { resource: { contains: 'procurement' } },
                { resource: { contains: 'activity_procurement_link' } }
              ]
            }
          }
        }
      }
    });

    rolesWithPACPermissions.forEach(role => {
      const pacPermissions = role.rolePermissions.length;
      if (pacPermissions > 0) {
        console.log(`🎭 ${role.name}: ${pacPermissions} permisos PAC de ${role._count.rolePermissions} totales`);
      }
    });

    console.log('\n✅ Configuración del módulo PAC completada exitosamente!');
    console.log('\n🔗 Nuevas funcionalidades disponibles:');
    console.log('   - Gestión completa de procesos de compra (PAC)');
    console.log('   - Vinculación bidireccional POA-PAC');
    console.log('   - Alertas de consistencia presupuestaria');
    console.log('   - Seguimiento de estados de procesos');
    console.log('   - Roles especializados en compras y contrataciones');

  } catch (error) {
    console.error('❌ Error configurando módulo PAC:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPACRolesAndPermissions();
