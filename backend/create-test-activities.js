const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestActivities() {
  try {
    console.log('🎯 Creando actividades de prueba...');

    // Primero obtenemos ejes estratégicos y productos existentes
    const strategicAxes = await prisma.strategicAxis.findMany();
    const products = await prisma.product.findMany();
    
    if (strategicAxes.length === 0 || products.length === 0) {
      console.log('❌ No hay ejes estratégicos o productos. Creando algunos...');
      
      // Crear eje estratégico de prueba si no existe
      const axis = await prisma.strategicAxis.findFirst() || await prisma.strategicAxis.create({
        data: {
          name: 'Eje de Prueba',
          description: 'Eje estratégico para pruebas de actividades',
          code: 'EP01',
          isActive: true
        }
      });

      // Crear objetivo de prueba
      const objective = await prisma.objective.create({
        data: {
          name: 'Objetivo de Prueba',
          description: 'Objetivo para pruebas de actividades',
          code: 'OBJ01',
          strategicAxisId: axis.id,
          isActive: true
        }
      });

      // Crear producto de prueba
      const product = await prisma.product.create({
        data: {
          name: 'Producto de Prueba',
          description: 'Producto para pruebas de actividades',
          code: 'PROD01',
          type: 'PRODUCT',
          objectiveId: objective.id,
          annualTarget: 100,
          baseline: 0,
          reportingPeriod: 'QUARTERLY',
          isActive: true
        }
      });

      console.log('✅ Estructuras base creadas');
    }

    // Ahora crear actividades de prueba
    const testActivities = [
      {
        name: 'Desarrollo de Sistema de Gestión',
        description: 'Implementar un sistema completo de gestión de proyectos con funcionalidades avanzadas',
        code: 'ACT001',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        estimatedHours: 480,
        actualHours: 120,
        isActive: true
      },
      {
        name: 'Capacitación del Personal',
        description: 'Programa de capacitación intensiva para mejorar las competencias del equipo',
        code: 'ACT002',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-30'),
        priority: 'MEDIUM',
        status: 'PLANNED',
        estimatedHours: 240,
        actualHours: 0,
        isActive: true
      },
      {
        name: 'Implementación de Base de Datos',
        description: 'Diseño e implementación de la arquitectura de base de datos del sistema',
        code: 'ACT003',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-15'),
        priority: 'HIGH',
        status: 'COMPLETED',
        estimatedHours: 160,
        actualHours: 155,
        isActive: true
      },
      {
        name: 'Testing y Control de Calidad',
        description: 'Pruebas exhaustivas del sistema y control de calidad de las funcionalidades',
        code: 'ACT004',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-07-31'),
        priority: 'HIGH',
        status: 'PLANNED',
        estimatedHours: 320,
        actualHours: 0,
        isActive: true
      },
      {
        name: 'Documentación Técnica',
        description: 'Elaboración de manuales técnicos y documentación del usuario final',
        code: 'ACT005',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-05-31'),
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        estimatedHours: 120,
        actualHours: 45,
        isActive: true
      }
    ];

    const product = await prisma.product.findFirst();
    
    for (const activityData of testActivities) {
      const activity = await prisma.activity.create({
        data: {
          ...activityData,
          productId: product.id
        }
      });
      
      console.log(`✅ Actividad creada: ${activity.name} (${activity.code})`);
    }

    console.log('\n🎉 ¡Actividades de prueba creadas exitosamente!');
    console.log(`📊 Total: ${testActivities.length} actividades`);
    
  } catch (error) {
    console.error('❌ Error creando actividades de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestActivities();
