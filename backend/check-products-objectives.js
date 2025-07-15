const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductsAndObjectives() {
  try {
    console.log('=== VERIFICANDO PRODUCTOS Y OBJETIVOS ===\n');
    
    // Verificar productos
    const products = await prisma.product.findMany({
      include: {
        objective: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { activities: true }
        }
      }
    });
    
    console.log(`📦 PRODUCTOS (${products.length}):`);
    products.forEach(product => {
      console.log(`  📋 ${product.name}`);
      console.log(`     🔖 Código: ${product.code}`);
      console.log(`     📁 Tipo: ${product.type}`);
      console.log(`     🎯 Objetivo: ${product.objective?.name || 'Sin objetivo'}`);
      console.log(`     📊 Actividades: ${product._count.activities}`);
      console.log('');
    });
    
    // Verificar objetivos
    const objectives = await prisma.objective.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    
    console.log(`🎯 OBJETIVOS (${objectives.length}):`);
    objectives.forEach(obj => {
      console.log(`  🎯 ${obj.code} - ${obj.name}`);
      console.log(`     📦 Productos: ${obj._count.products}`);
      console.log('');
    });
    
    // Verificar estructura que debería recibir el frontend
    console.log('📊 ESTRUCTURA PARA FRONTEND:');
    console.log('Productos:', {
      success: true,
      data: products.slice(0, 1), // Solo mostrar el primero
      total: products.length
    });
    
    console.log('\nObjetivos:', {
      success: true,
      data: objectives.slice(0, 1), // Solo mostrar el primero
      total: objectives.length
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductsAndObjectives();
