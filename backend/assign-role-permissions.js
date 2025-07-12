const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignRolePermissions() {
  try {
    console.log('🔧 Configurando permisos por rol...\n');

    // Obtener todos los roles y permisos
    const roles = await prisma.role.findMany();
    const permissions = await prisma.permission.findMany();

    // Mapear permisos por recurso y acción para fácil acceso
    const permissionMap = {};
    permissions.forEach(perm => {
      const key = `${perm.action}:${perm.resource}`;
      permissionMap[key] = perm.id;
    });

    // Definir permisos por rol
    const rolePermissions = {
      'Director de Planificación': [
        // Planificación estratégica - acceso completo
        'create:strategic_axis', 'read:strategic_axis', 'update:strategic_axis', 'delete:strategic_axis', 'lock:strategic_axis',
        'create:objective', 'read:objective', 'update:objective', 'delete:objective',
        'create:product', 'read:product', 'update:product', 'delete:product',
        'create:activity', 'read:activity', 'update:activity', 'delete:activity',
        'create:indicator', 'read:indicator', 'update:indicator', 'delete:indicator',
        
        // Seguimiento y reportes
        'read:progress_report', 'approve:progress_report', 'reject:progress_report',
        
        // Presupuesto
        'create:budget', 'read:budget', 'update:budget',
        
        // Dashboard y reportes
        'read:dashboard', 'export:report',
        
        // Lectura de estructura organizacional
        'read:department', 'read:user'
      ],
      
      'Director de Área': [
        // Lectura de planificación de su área
        'read:strategic_axis', 'read:objective', 'read:product', 'read:activity', 'read:indicator',
        
        // Actualización limitada de actividades de su área
        'update:activity', 'update:product',
        
        // Gestión de reportes de su equipo
        'read:progress_report', 'approve:progress_report', 'reject:progress_report',
        
        // Presupuesto de su área
        'read:budget', 'update:budget',
        
        // Dashboard y reportes de su área
        'read:dashboard', 'export:report',
        
        // Gestión de su equipo
        'read:user', 'read:department'
      ],
      
      'Técnico Registrador': [
        // Lectura de estructura de planificación
        'read:strategic_axis', 'read:objective', 'read:product', 'read:activity', 'read:indicator',
        
        // Actualización de actividades asignadas
        'update:activity',
        
        // Gestión de sus reportes de progreso
        'create:progress_report', 'read:progress_report', 'update:progress_report',
        
        // Lectura de presupuesto
        'read:budget',
        
        // Dashboard básico
        'read:dashboard',
        
        // Información de usuarios y departamentos (lectura)
        'read:user', 'read:department'
      ],
      
      'Auditor': [
        // Solo lectura de todo el sistema para auditoría
        'read:strategic_axis', 'read:objective', 'read:product', 'read:activity', 'read:indicator',
        'read:progress_report', 'read:budget', 'read:dashboard', 'read:user', 'read:department',
        'read:role', 'read:permission',
        
        // Exportación de reportes para auditoría
        'export:report'
      ]
    };

    // Asignar permisos a cada rol
    for (const [roleName, permissionKeys] of Object.entries(rolePermissions)) {
      const role = roles.find(r => r.name === roleName);
      if (!role) {
        console.log(`❌ Rol '${roleName}' no encontrado`);
        continue;
      }

      console.log(`🎭 Configurando permisos para: ${roleName}`);

      // Eliminar permisos existentes del rol
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Agregar nuevos permisos
      const validPermissions = [];
      for (const permKey of permissionKeys) {
        if (permissionMap[permKey]) {
          validPermissions.push({
            roleId: role.id,
            permissionId: permissionMap[permKey]
          });
        } else {
          console.log(`   ⚠️  Permiso '${permKey}' no encontrado`);
        }
      }

      if (validPermissions.length > 0) {
        await prisma.rolePermission.createMany({
          data: validPermissions
        });
        console.log(`   ✅ ${validPermissions.length} permisos asignados`);
      }
    }

    console.log('\n🎯 Resumen de permisos asignados:');
    console.log('═'.repeat(50));

    // Mostrar resumen final
    const updatedRoles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true
          }
        }
      }
    });

    updatedRoles.forEach(role => {
      console.log(`${role.name}: ${role._count.rolePermissions} permisos`);
    });

    console.log('\n✅ Configuración de permisos completada exitosamente!');

  } catch (error) {
    console.error('❌ Error configurando permisos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignRolePermissions();
