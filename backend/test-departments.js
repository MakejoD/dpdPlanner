const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDepartments() {
  try {
    console.log('🔍 Probando endpoint de departamentos...');
    
    // Obtener departamentos
    const departments = await prisma.department.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            users: true,
            children: true,
            strategicAxes: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Encontrados ${departments.length} departamentos:`);
    
    departments.forEach(dept => {
      console.log(`- ${dept.name} (ID: ${dept.id})`);
      console.log(`  Activo: ${dept.isActive}`);
      console.log(`  Usuarios: ${dept._count.users}`);
      console.log(`  Departamentos hijos: ${dept._count.children}`);
      console.log(`  Ejes estratégicos: ${dept._count.strategicAxes}`);
      console.log('');
    });

    // Verificar estructura jerárquica
    const rootDepartments = departments.filter(dept => !dept.parentId);
    console.log(`📊 Departamentos raíz: ${rootDepartments.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDepartments();
