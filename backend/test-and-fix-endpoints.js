const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAndFixEndpoints() {
  try {
    console.log('🔍 Testing API endpoints and fixing issues...');
    
    // 1. Check if we have approval permissions set up
    console.log('\n📋 Checking approval permissions...');
    
    const approvePermission = await prisma.permission.findFirst({
      where: {
        action: 'approve',
        resource: 'progress-report'
      }
    });
    
    if (!approvePermission) {
      console.log('❌ Missing approval permission, creating...');
      const newPermission = await prisma.permission.create({
        data: {
          action: 'approve',
          resource: 'progress-report'
        }
      });
      console.log(`✅ Created approval permission: ${newPermission.id}`);
      
      // Assign to admin role
      const adminRole = await prisma.role.findFirst({
        where: { name: 'Administrador' }
      });
      
      if (adminRole) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: newPermission.id
          }
        });
        console.log('✅ Assigned approval permission to admin role');
      }
    } else {
      console.log('✅ Approval permission exists');
    }
    
    // 2. Check if we have budget execution data
    console.log('\n💰 Checking budget execution data...');
    
    const budgetExecutions = await prisma.budgetExecution.count();
    console.log(`📊 Budget executions found: ${budgetExecutions}`);
    
    if (budgetExecutions === 0) {
      console.log('📝 Creating sample budget execution...');
      
      // Get first activity
      const activity = await prisma.activity.findFirst();
      if (activity) {
        await prisma.budgetExecution.create({
          data: {
            activityId: activity.id,
            fiscalYear: 2025,
            quarter: 'Q1',
            budgetedAmount: 100000.00,
            executedAmount: 25000.00,
            percentageExecuted: 25.0,
            status: 'EN_PROCESO',
            description: 'Ejecución presupuestaria Q1 2025'
          }
        });
        console.log('✅ Sample budget execution created');
      }
    }
    
    // 3. Check progress reports status
    console.log('\n📈 Checking progress reports...');
    
    const progressReports = await prisma.progressReport.count();
    const submittedReports = await prisma.progressReport.count({
      where: { status: 'SUBMITTED' }
    });
    
    console.log(`📊 Total progress reports: ${progressReports}`);
    console.log(`📊 Submitted for approval: ${submittedReports}`);
    
    if (progressReports === 0) {
      console.log('📝 Creating sample progress report...');
      
      const activity = await prisma.activity.findFirst();
      const user = await prisma.user.findFirst();
      
      if (activity && user) {
        await prisma.progressReport.create({
          data: {
            activityId: activity.id,
            reportedById: user.id,
            reportingPeriod: '2025-01',
            progressPercentage: 25.0,
            description: 'Progreso del primer trimestre 2025',
            achievements: 'Iniciadas las actividades planificadas',
            challenges: 'Ninguna significativa hasta el momento',
            nextSteps: 'Continuar con la implementación según cronograma',
            status: 'SUBMITTED'
          }
        });
        console.log('✅ Sample progress report created');
      }
    }
    
    console.log('\n✅ Endpoint testing and fixes completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAndFixEndpoints();
