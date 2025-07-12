const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        objective: {
          include: {
            strategicAxis: true
          }
        }
      }
    });
    
    console.log(`📦 Productos disponibles: ${products.length}`);
    console.log('================================');
    
    products.forEach(product => {
      console.log(`🔹 ${product.name}`);
      console.log(`   Código: ${product.code}`);
      console.log(`   Tipo: ${product.type}`);
      console.log(`   Objetivo: ${product.objective.name}`);
      console.log(`   Eje: ${product.objective.strategicAxis.name}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listProducts();
