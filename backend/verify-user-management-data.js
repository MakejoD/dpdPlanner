const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUserManagementData() {
  try {
    console.log('=== VERIFICANDO DATOS PARA GESTIÓN DE USUARIOS ===\n');
    
    // 1. Verificar usuarios
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: { id: true, name: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    });
    
    console.log(`👥 USUARIOS (${users.length}):`);
    users.forEach(user => {
      console.log(`  📧 ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`     🔑 Rol: ${user.role.name}`);
      console.log(`     🏢 Departamento: ${user.department?.name || 'Sin departamento'}`);
      console.log(`     ✅ Activo: ${user.isActive ? 'Sí' : 'No'}`);
      console.log('');
    });
    
    // 2. Verificar roles
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    console.log(`🔑 ROLES (${roles.length}):`);
    roles.forEach(role => {
      console.log(`  📋 ${role.name} - ${role._count.users} usuarios`);
      console.log(`     📝 ${role.description}`);
    });
    
    // 3. Verificar departamentos
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    console.log(`\n🏢 DEPARTAMENTOS (${departments.length}):`);
    departments.forEach(dept => {
      console.log(`  🏛️ ${dept.name} (${dept.code}) - ${dept._count.users} usuarios`);
    });
    
    // 4. Verificar estructura que debería recibir el frontend
    console.log('\n📊 ESTRUCTURA PARA FRONTEND:');
    console.log('Usuarios:', {
      success: true,
      data: users.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        isActive: u.isActive,
        roleId: u.roleId,
        departmentId: u.departmentId,
        role: u.role,
        department: u.department,
        createdAt: u.createdAt
      })).slice(0, 1) // Solo mostrar el primero
    });
    
    console.log('\nRoles:', {
      success: true,
      data: roles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description
      }))
    });
    
    console.log('\nDepartamentos:', {
      success: true,
      data: departments.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code
      }))
    });
    
    console.log('\n✅ Todos los datos están disponibles para el frontend!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUserManagementData();
