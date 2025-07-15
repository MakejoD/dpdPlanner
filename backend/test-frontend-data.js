const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEndpointsData() {
  try {
    console.log('=== VERIFICANDO DATOS PARA ENDPOINTS ===\n');
    
    // 1. Verificar roles
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    console.log(`📊 ROLES (${roles.length}):`);
    roles.forEach(role => {
      console.log(`  🔑 ${role.name} - ${role._count.users} usuarios`);
    });
    
    // 2. Verificar objetivos
    const objectives = await prisma.objective.findMany({
      include: {
        strategicAxis: {
          select: { name: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });
    
    console.log(`\n🎯 OBJETIVOS (${objectives.length}):`);
    objectives.forEach(obj => {
      console.log(`  📋 ${obj.name} (${obj.strategicAxis.name}) - ${obj._count.products} productos`);
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
      console.log(`  🏛️ ${dept.name} - ${dept._count.users} usuarios`);
    });
    
    // 4. Verificar productos
    const products = await prisma.product.findMany({
      include: {
        objective: {
          select: { name: true }
        },
        _count: {
          select: { activities: true }
        }
      }
    });
    
    console.log(`\n📦 PRODUCTOS (${products.length}):`);
    products.forEach(prod => {
      console.log(`  📦 ${prod.name} (${prod.objective.name}) - ${prod._count.activities} actividades`);
    });
    
    console.log('\n✅ Todos los datos están disponibles para los endpoints del frontend!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpointsData();
