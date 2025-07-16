const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminPermissions() {
  try {
    console.log('🔧 Verificando y corrigiendo permisos del administrador...');
    
    // Buscar el usuario admin
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
      console.log('❌ Usuario admin no encontrado');
      return;
    }
    
    console.log('✅ Usuario admin encontrado:', admin.firstName);
    console.log('🎯 Rol:', admin.role.name);
    console.log('🔐 Permisos actuales:', admin.role.rolePermissions.length);
    
    // Obtener todos los permisos disponibles
    const allPermissions = await prisma.permission.findMany();
    console.log('📋 Total de permisos en sistema:', allPermissions.length);
    
    // Verificar si tiene el permiso específico para permissions
    const hasPermissionRead = admin.role.rolePermissions.some(rp => 
      rp.permission.action === 'read' && rp.permission.resource === 'permission'
    );
    
    console.log('🔍 Tiene permiso read permission:', hasPermissionRead);
    
    if (!hasPermissionRead) {
      console.log('🔧 Agregando permisos faltantes...');
      
      // Eliminar permisos existentes del rol admin
      await prisma.rolePermission.deleteMany({
        where: { roleId: admin.role.id }
      });
      
      // Asignar TODOS los permisos al rol de administrador
      const rolePermissions = allPermissions.map(permission => ({
        roleId: admin.role.id,
        permissionId: permission.id
      }));
      
      await prisma.rolePermission.createMany({
        data: rolePermissions
      });
      
      console.log('✅ Todos los permisos asignados al administrador');
      console.log('📊 Permisos asignados:', rolePermissions.length);
    }
    
    // Verificar permisos finales
    const updatedAdmin = await prisma.user.findUnique({
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
    
    console.log('📈 Permisos finales:', updatedAdmin.role.rolePermissions.length);
    
    // Mostrar algunos permisos clave
    const keyPermissions = updatedAdmin.role.rolePermissions
      .filter(rp => ['permission', 'user', 'role'].includes(rp.permission.resource))
      .map(rp => `${rp.permission.action}:${rp.permission.resource}`);
    
    console.log('🔑 Permisos clave:', keyPermissions);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions();
