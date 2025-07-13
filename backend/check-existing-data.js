const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingData() {
  try {
    console.log('🔍 Verificando datos existentes en la base de datos...\n');

    // 1. Verificar Ejes Estratégicos
    const strategicAxes = await prisma.strategicAxis.findMany({
      include: {
        objectives: {
          include: {
            products: {
              include: {
                activities: true
              }
            }
          }
        }
      }
    });

    console.log('🎯 EJES ESTRATÉGICOS:');
    if (strategicAxes.length === 0) {
      console.log('❌ No se encontraron ejes estratégicos');
    } else {
      strategicAxes.forEach((axis, index) => {
        console.log(`${index + 1}. ${axis.name} (${axis.code})`);
        console.log(`   📝 Descripción: ${axis.description}`);
        console.log(`   📊 Objetivos: ${axis.objectives.length}`);
        console.log(`   🎁 Productos total: ${axis.objectives.reduce((sum, obj) => sum + obj.products.length, 0)}`);
        console.log(`   ⚙️ Actividades total: ${axis.objectives.reduce((sum, obj) => sum + obj.products.reduce((pSum, prod) => pSum + prod.activities.length, 0), 0)}`);
      });
    }

    // 2. Verificar Indicadores
    const indicators = await prisma.indicator.findMany();
    console.log(`\n📈 INDICADORES: ${indicators.length} encontrados`);
    if (indicators.length > 0) {
      indicators.forEach((indicator, index) => {
        console.log(`${index + 1}. ${indicator.name} (${indicator.type})`);
      });
    }

    // 3. Verificar Usuarios
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    console.log(`\n👥 USUARIOS: ${users.length} encontrados`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${user.role?.name}`);
    });

    // 4. Verificar Departamentos
    const departments = await prisma.department.findMany();
    console.log(`\n🏢 DEPARTAMENTOS: ${departments.length} encontrados`);
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (${dept.code})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingData();
