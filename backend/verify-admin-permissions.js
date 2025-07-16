const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdminPermissions() {
  try {
    console.log('🔍 Verificando permisos del administrador...');
    
    // Buscar usuario admin
    const admin = await prisma.user.findUnique({
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
    
    if (!admin) {
      console.log('❌ Usuario administrador no encontrado');
      return;
    }
    
    console.log(`👤 Usuario: ${admin.firstName} ${admin.lastName}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🎭 Rol: ${admin.role.name}`);
    console.log(`🔑 Total de permisos: ${admin.role.rolePermissions.length}`);
    
    // Permisos específicos para el módulo de productos
    const productPermissions = [
      'create:product',
      'read:product', 
      'update:product',
      'delete:product'
    ];
    
    console.log('\n📦 Permisos para PRODUCTOS:');
    productPermissions.forEach(permKey => {
      const [action, resource] = permKey.split(':');
      const hasPerm = admin.role.rolePermissions.some(rp => 
        rp.permission.action === action && rp.permission.resource === resource
      );
      console.log(`${hasPerm ? '✅' : '❌'} ${permKey}: ${hasPerm ? 'SÍ' : 'NO'}`);
    });
    
    // Permisos para navegación del menú principal
    const menuPermissions = [
      'read:strategic_axis',  // Para ver sección Planificación
      'read:objective',       // Para ver Objetivos
      'read:activity',        // Para ver Actividades
      'read:indicator',       // Para ver Indicadores
      'read:progress_report', // Para ver Seguimiento
      'read:procurement',     // Para ver PACC
      'read:user',           // Para ver Administración
      'read:role',           // Para ver Roles
      'read:department'      // Para ver Departamentos
    ];
    
    console.log('\n🧭 Permisos para NAVEGACIÓN:');
    menuPermissions.forEach(permKey => {
      const [action, resource] = permKey.split(':');
      const hasPerm = admin.role.rolePermissions.some(rp => 
        rp.permission.action === action && rp.permission.resource === resource
      );
      console.log(`${hasPerm ? '✅' : '❌'} ${permKey}: ${hasPerm ? 'SÍ' : 'NO'}`);
    });
    
    // Verificar si el usuario está activo
    console.log(`\n🔄 Estado del usuario: ${admin.isActive ? 'ACTIVO' : 'INACTIVO'}`);
    
    // Listar TODOS los permisos del admin para debug
    console.log('\n📋 TODOS los permisos del administrador:');
    const allPerms = admin.role.rolePermissions.map(rp => 
      `${rp.permission.action}:${rp.permission.resource}`
    ).sort();
    
    allPerms.forEach(perm => {
      console.log(`   ✓ ${perm}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminPermissions();
