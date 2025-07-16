const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAllPermissions() {
  try {
    console.log('🔧 Creando todos los permisos necesarios para el sistema...');
    
    // Lista completa de recursos del sistema
    const resources = [
      'user',
      'role', 
      'permission',
      'department',
      'strategic_axis',
      'objective',
      'product',
      'activity',
      'indicator',
      'progress_report',
      'budget',
      'procurement',
      'dashboard',
      'notification',
      'pacc_schedule',
      'pacc_compliance',
      'pacc_alert',
      'budget_execution',
      'budget_allocation'
    ];
    
    // Acciones estándar para cada recurso
    const actions = ['create', 'read', 'update', 'delete'];
    
    // Acciones especiales para ciertos recursos
    const specialActions = {
      'progress_report': ['approve', 'submit'],
      'procurement': ['approve'],
      'budget': ['execute', 'approve'],
      'user': ['assign'],
      'activity': ['assign'],
      'indicator': ['assign'],
      'role': ['manage'],
      'dashboard': ['view']
    };
    
    let createdCount = 0;
    let existingCount = 0;
    
    // Crear permisos estándar
    for (const resource of resources) {
      for (const action of actions) {
        try {
          await prisma.permission.create({
            data: { action, resource }
          });
          console.log(`✅ Creado: ${action}:${resource}`);
          createdCount++;
        } catch (error) {
          if (error.code === 'P2002') {
            existingCount++;
          } else {
            console.error(`❌ Error creando ${action}:${resource}:`, error.message);
          }
        }
      }
      
      // Crear permisos especiales si existen
      if (specialActions[resource]) {
        for (const action of specialActions[resource]) {
          try {
            await prisma.permission.create({
              data: { action, resource }
            });
            console.log(`✅ Creado especial: ${action}:${resource}`);
            createdCount++;
          } catch (error) {
            if (error.code === 'P2002') {
              existingCount++;
            } else {
              console.error(`❌ Error creando ${action}:${resource}:`, error.message);
            }
          }
        }
      }
    }
    
    console.log(`📊 Resumen: ${createdCount} permisos creados, ${existingCount} ya existían`);
    
    // Obtener el rol de administrador
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrador del Sistema' }
    });
    
    if (!adminRole) {
      console.log('❌ Rol de administrador no encontrado');
      return;
    }
    
    console.log('👤 Asignando TODOS los permisos al administrador...');
    
    // Obtener todos los permisos
    const allPermissions = await prisma.permission.findMany();
    console.log(`📋 Total de permisos en sistema: ${allPermissions.length}`);
    
    // Eliminar permisos existentes del administrador para evitar duplicados
    await prisma.rolePermission.deleteMany({
      where: { roleId: adminRole.id }
    });
    
    // Asignar TODOS los permisos al administrador
    const rolePermissions = allPermissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id
    }));
    
    await prisma.rolePermission.createMany({
      data: rolePermissions
    });
    
    console.log(`✅ Asignados ${rolePermissions.length} permisos al administrador`);
    
    // Verificar permisos específicos importantes
    const keyPermissions = [
      'read:product',
      'create:product', 
      'update:product',
      'delete:product',
      'read:strategic_axis',
      'read:objective',
      'read:activity',
      'read:indicator'
    ];
    
    console.log('🔑 Verificando permisos clave:');
    const adminWithPerms = await prisma.user.findUnique({
      where: { email: 'admin@poa.gov' },
      include: { 
        role: { 
          include: { 
            rolePermissions: { 
              include: { permission: true }
            } 
          } 
        } 
      }
    });
    
    keyPermissions.forEach(permKey => {
      const [action, resource] = permKey.split(':');
      const hasPerm = adminWithPerms.role.rolePermissions.some(rp => 
        rp.permission.action === action && rp.permission.resource === resource
      );
      console.log(`${hasPerm ? '✅' : '❌'} ${permKey}: ${hasPerm ? 'SÍ' : 'NO'}`);
    });
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAllPermissions();
