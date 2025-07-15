const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBudgetTestData() {
  try {
    console.log('🔧 Creando datos de prueba para presupuesto...');
    
    // Crear una asignación presupuestaria simple sin dependencias
    const budgetAllocation = await prisma.budgetAllocation.create({
      data: {
        budgetCode: 'BUDGET-TEST-001',
        budgetType: 'FUNCIONAMIENTO',
        fiscalYear: 2024,
        allocatedAmount: 100000.00,
        executedAmount: 25000.00,
        availableAmount: 75000.00,
        quarter: 'Q1',
        month: 'enero',
        source: 'TESORO_NACIONAL',
        category: 'GASTOS_OPERACIONALES',
        subcategory: 'SERVICIOS_PERSONALES',
        object: '001',
        sigefCode: 'SIGEF-TEST-001',
        observations: 'Asignación de prueba para testing del sistema'
      }
    });

    console.log('✅ Asignación presupuestaria creada:');
    console.log(`   - Código: ${budgetAllocation.budgetCode}`);
    console.log(`   - Tipo: ${budgetAllocation.budgetType}`);
    console.log(`   - Monto asignado: RD$ ${budgetAllocation.allocatedAmount.toLocaleString()}`);
    console.log(`   - Monto ejecutado: RD$ ${budgetAllocation.executedAmount.toLocaleString()}`);
    console.log(`   - Disponible: RD$ ${budgetAllocation.availableAmount.toLocaleString()}`);

    // Crear una ejecución presupuestaria
    const execution = await prisma.budgetExecution.create({
      data: {
        amount: 15000.00,
        description: 'Pago de servicios de consultoría',
        documentNumber: 'DOC-001-2024',
        executionType: 'PAGO',
        sigefReference: 'SIGEF-REF-001',
        observations: 'Primera ejecución de prueba',
        executionDate: new Date(),
        month: 'enero',
        quarter: 'Q1',
        fiscalYear: 2024,
        budgetAllocationId: budgetAllocation.id
      }
    });

    console.log('✅ Ejecución presupuestaria registrada:');
    console.log(`   - Monto: RD$ ${execution.amount.toLocaleString()}`);
    console.log(`   - Descripción: ${execution.description}`);
    console.log(`   - Documento: ${execution.documentNumber}`);

    // Actualizar el monto ejecutado en la asignación
    await prisma.budgetAllocation.update({
      where: { id: budgetAllocation.id },
      data: {
        executedAmount: budgetAllocation.executedAmount + execution.amount,
        availableAmount: budgetAllocation.availableAmount - execution.amount
      }
    });

    console.log('✅ Asignación actualizada con la ejecución');

    await prisma.$disconnect();
    console.log('🎉 Datos de prueba creados exitosamente');
  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
    await prisma.$disconnect();
  }
}

createBudgetTestData();
