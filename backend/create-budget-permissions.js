const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBudgetPermissions() {
  try {
    console.log('🚀 Creando permisos para el módulo presupuestario...');

    // Definir permisos de budget
    const budgetPermissions = [
      {
        action: 'create',
        resource: 'budget',
        description: 'Crear nuevas ejecuciones presupuestarias'
      },
      {
        action: 'read',
        resource: 'budget',
        description: 'Ver ejecuciones presupuestarias'
      },
      {
        action: 'update',
        resource: 'budget',
        description: 'Actualizar ejecuciones presupuestarias'
      },
      {
        action: 'delete',
        resource: 'budget',
        description: 'Eliminar ejecuciones presupuestarias'
      }
    ];

    // Crear permisos si no existen
    for (const permission of budgetPermissions) {
      const existing = await prisma.permission.findFirst({
        where: {
          action: permission.action,
          resource: permission.resource
        }
      });

      if (!existing) {
        await prisma.permission.create({
          data: permission
        });
        console.log(`   ✅ Creado: ${permission.action}:${permission.resource}`);
      } else {
        console.log(`   ⚪ Ya existe: ${permission.action}:${permission.resource}`);
      }
    }

    // Obtener roles existentes
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    console.log('\n👥 Asignando permisos a roles...');

    // Asignar permisos a roles según su nivel
    for (const role of roles) {
      const budgetPermissions = await prisma.permission.findMany({
        where: {
          resource: 'budget'
        }
      });

      let permissionsToAssign = [];

      switch (role.name) {
        case 'Administrador':
          // Admin tiene todos los permisos
          permissionsToAssign = budgetPermissions;
          break;
        
        case 'Director General':
          // Director puede ver, crear y actualizar
          permissionsToAssign = budgetPermissions.filter(p => 
            ['read', 'create', 'update'].includes(p.action)
          );
          break;
        
        case 'Director de Área':
          // Director de área puede ver, crear y actualizar en su departamento
          permissionsToAssign = budgetPermissions.filter(p => 
            ['read', 'create', 'update'].includes(p.action)
          );
          break;
        
        case 'Responsable de Actividad':
          // Responsable puede ver y actualizar (comprometer, devengar, pagar)
          permissionsToAssign = budgetPermissions.filter(p => 
            ['read', 'update'].includes(p.action)
          );
          break;
        
        case 'Consulta':
          // Solo lectura
          permissionsToAssign = budgetPermissions.filter(p => 
            p.action === 'read'
          );
          break;
      }

      // Asignar permisos al rol
      for (const permission of permissionsToAssign) {
        const existing = await prisma.rolePermission.findFirst({
          where: {
            roleId: role.id,
            permissionId: permission.id
          }
        });

        if (!existing) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
          console.log(`   ✅ ${role.name} -> ${permission.action}:${permission.resource}`);
        } else {
          console.log(`   ⚪ ${role.name} ya tiene ${permission.action}:${permission.resource}`);
        }
      }
    }

    console.log('\n🎉 Permisos de presupuesto configurados exitosamente!');

    // Mostrar resumen
    const allPermissions = await prisma.permission.findMany({
      where: { resource: 'budget' }
    });

    console.log('\n📋 Permisos de presupuesto creados:');
    allPermissions.forEach(p => {
      console.log(`   • ${p.action}:${p.resource} - ${p.description}`);
    });

  } catch (error) {
    console.error('❌ Error al crear permisos de presupuesto:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBudgetPermissions();
