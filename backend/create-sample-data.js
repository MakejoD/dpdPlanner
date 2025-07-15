const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('🔧 Creando datos de ejemplo para POA-PACC-Budget...');
    
    // Obtener usuarios y departamentos existentes
    const admin = await prisma.user.findFirst({
      where: { email: { contains: 'admin' } }
    });
    
    const department = await prisma.department.findFirst();
    
    if (!admin || !department) {
      console.log('❌ No se encontraron usuarios o departamentos');
      return;
    }

    // 1. Crear o obtener Eje Estratégico
    const strategicAxis = await prisma.strategicAxis.upsert({
      where: { 
        code_year: { 
          code: 'EJE-001-2024', 
          year: 2024 
        } 
      },
      update: {},
      create: {
        code: 'EJE-001-2024',
        name: 'Modernización de la Gestión Pública',
        description: 'Fortalecimiento de la capacidad institucional y modernización de procesos',
        year: 2024,
        departmentId: department.id
      }
    });

    // 2. Crear Objetivo
    const objective = await prisma.objective.create({
      data: {
        code: 'OBJ-001-2024',
        name: 'Implementar sistema de planificación integrado',
        description: 'Desarrollar e implementar un sistema integrado POA-PACC-Presupuesto',
        strategicAxisId: strategicAxis.id
      }
    });

    // 3. Crear Producto
    const product = await prisma.product.create({
      data: {
        code: 'PROD-001-2024',
        name: 'Sistema POA-PACC-Presupuesto',
        description: 'Sistema web integrado para la gestión de POA, PACC y Presupuesto',
        type: 'PRODUCT',
        objectiveId: objective.id
      }
    });

    // 4. Crear Actividad
    const activity = await prisma.activity.create({
      data: {
        code: 'ACT-001-2024',
        name: 'Desarrollo del Sistema POA-PACC-Presupuesto',
        description: 'Crear un sistema web para la gestión integrada de POA, PACC y Presupuesto según normativas dominicanas',
        productId: product.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      }
    });

    // 5. Crear Proceso de Procurement (PACC)
    const procurement = await prisma.procurementProcess.create({
      data: {
        description: 'Adquisición de servicios de desarrollo de software para sistema POA-PACC',
        procurementType: 'SERVICIOS',
        procurementMethod: 'LICITACION_PUBLICA',
        estimatedAmount: 500000.00,
        plannedStartDate: new Date('2024-02-01'),
        plannedEndDate: new Date('2024-06-30'),
        quarter: 'Q1',
        status: 'PLANIFICADO',
        priority: 'ALTA',
        activityId: activity.id,
        legalFramework: 'LEY_340_06'
      }
    });

    // 6. Crear Asignación Presupuestaria
    const budgetAllocation = await prisma.budgetAllocation.create({
      data: {
        budgetCode: 'PRES-001-2024',
        budgetType: 'INVERSION',
        fiscalYear: 2024,
        allocatedAmount: 500000.00,
        availableAmount: 500000.00,
        quarter: 'Q1',
        activityId: activity.id,
        procurementProcessId: procurement.id,
        sigefCode: 'SIGEF-2024-001',
        description: 'Presupuesto para desarrollo de sistema POA-PACC'
      }
    });

    // 7. Crear Correlación POA-PACC-Budget
    const correlation = await prisma.poaPaccBudgetCorrelation.create({
      data: {
        activityId: activity.id,
        procurementProcessId: procurement.id,
        budgetAllocationId: budgetAllocation.id,
        correlationScore: 95.0,
        complianceStatus: 'CUMPLE',
        riskLevel: 'BAJO',
        notes: 'Correlación perfecta entre actividad, proceso de compra y presupuesto asignado'
      }
    });

    console.log('✅ Datos de ejemplo creados exitosamente:');
    console.log(`   - Eje Estratégico: ${strategicAxis.name} (${strategicAxis.code})`);
    console.log(`   - Objetivo: ${objective.name} (${objective.code})`);
    console.log(`   - Producto: ${product.name} (${product.code})`);
    console.log(`   - Actividad: ${activity.name} (${activity.code})`);
    console.log(`   - Proceso PACC: ${procurement.description}`);
    console.log(`   - Presupuesto: ${budgetAllocation.description} (${budgetAllocation.budgetCode})`);
    console.log(`   - Correlación ID: ${correlation.id}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error al crear datos de ejemplo:', error);
    await prisma.$disconnect();
  }
}

createSampleData();
