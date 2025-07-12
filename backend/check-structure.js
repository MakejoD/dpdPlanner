const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActivityStructure() {
  try {
    const activities = await prisma.activity.findMany();
    console.log(`📊 Actividades existentes: ${activities.length}`);
    
    if (activities.length > 0) {
      console.log('🔍 Estructura de actividad:');
      const activity = activities[0];
      Object.keys(activity).forEach(key => {
        console.log(`  - ${key}: ${typeof activity[key]} = ${activity[key]}`);
      });
    }

    // Verificar también los productos existentes
    const products = await prisma.product.findMany();
    console.log(`\n📦 Productos existentes: ${products.length}`);
    
    if (products.length > 0) {
      const product = products[0];
      console.log('🔍 Producto ejemplo:');
      console.log(`  - ID: ${product.id}`);
      console.log(`  - Name: ${product.name}`);
      console.log(`  - Code: ${product.code}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActivityStructure();
