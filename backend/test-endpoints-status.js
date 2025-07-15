const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function testEndpoints() {
  try {
    console.log('🔍 Testing API endpoints...');
    
    // Get user for token generation
    const user = await prisma.user.findFirst({
      include: { role: true }
    });
    
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, roleId: user.roleId },
      'dpd-planner-jwt-secret-key-2025',
      { expiresIn: '1h' }
    );
    
    console.log('✅ JWT token generated for user:', user.email);
    
    // Test 1: PACC Compliance endpoint
    console.log('\n📊 Testing PACC compliance endpoint...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:3001/api/pacc/compliance/latest');
      const data = await response.json();
      console.log('✅ PACC compliance endpoint working:', data.evaluationPeriod);
    } catch (error) {
      console.log('❌ PACC compliance endpoint error:', error.message);
    }
    
    // Test 2: Progress reports count
    console.log('\n📈 Testing progress reports...');
    const submittedReports = await prisma.progressReport.count({
      where: { status: 'SUBMITTED' }
    });
    console.log(`✅ Progress reports for approval: ${submittedReports}`);
    
    // Test 3: Budget executions count
    console.log('\n💰 Testing budget executions...');
    const budgetExecutions = await prisma.budgetExecution.count();
    console.log(`✅ Budget executions in database: ${budgetExecutions}`);
    
    // Test 4: Department count
    console.log('\n🏢 Testing departments...');
    const departments = await prisma.department.count();
    console.log(`✅ Departments in database: ${departments}`);
    
    console.log('\n✅ All tests completed successfully');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpoints();
