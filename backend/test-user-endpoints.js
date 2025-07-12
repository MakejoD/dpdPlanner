const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUserEndpoints() {
  try {
    console.log('🔍 Probando endpoints de usuarios...\n');

    // Test 1: Verificar usuarios en la base de datos
    console.log('📊 Test 1: Usuarios en la base de datos');
    const users = await prisma.user.findMany({
      include: {
        role: true,
        department: true
      }
    });

    console.log(`✅ Encontrados ${users.length} usuarios:`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`  Rol: ${user.role?.name || 'Sin rol'}`);
      console.log(`  Departamento: ${user.department?.name || 'Sin departamento'}`);
      console.log(`  Estado: ${user.isActive ? 'Activo' : 'Inactivo'}`);
      console.log('');
    });

    // Test 2: Verificar roles
    console.log('🎭 Test 2: Roles disponibles');
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

    console.log(`✅ Encontrados ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`- ${role.name}: ${role.description}`);
      console.log(`  Usuarios: ${role._count.users}, Permisos: ${role._count.rolePermissions}`);
    });

    // Test 3: Verificar departamentos
    console.log('\n🏢 Test 3: Departamentos disponibles');
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    console.log(`✅ Encontrados ${departments.length} departamentos:`);
    departments.forEach(dept => {
      console.log(`- ${dept.name}: ${dept._count.users} usuarios`);
    });

    console.log('\n📈 Estadísticas del sistema:');
    console.log(`- Total usuarios: ${users.length}`);
    console.log(`- Usuarios activos: ${users.filter(u => u.isActive).length}`);
    console.log(`- Usuarios con departamento: ${users.filter(u => u.departmentId).length}`);
    console.log(`- Usuarios con rol: ${users.filter(u => u.roleId).length}`);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserEndpoints();
