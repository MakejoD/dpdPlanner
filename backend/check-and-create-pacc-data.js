const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndCreatePACCData() {
  try {
    console.log('🔍 Verificando estado de datos PACC...');
    
    // Check current data
    const paccComplianceCount = await prisma.paccCompliance.count();
    const paccScheduleCount = await prisma.paccSchedule.count();
    
    console.log(`📊 Datos actuales:`);
    console.log(`   - Evaluaciones de cumplimiento: ${paccComplianceCount}`);
    console.log(`   - Cronogramas PACC: ${paccScheduleCount}`);
    
    if (paccComplianceCount === 0) {
      console.log('📝 Creando datos de ejemplo para PACC compliance...');
      
      // Get a user for the evaluation
      const user = await prisma.user.findFirst();
      if (!user) {
        console.log('❌ No se encontraron usuarios. Se necesita al menos un usuario.');
        return;
      }
      
      // Create sample compliance data
      const sampleCompliance = await prisma.paccCompliance.create({
        data: {
          evaluationPeriod: '2025-01',
          periodType: 'MENSUAL',
          fiscalYear: 2025,
          totalProcesses: 25,
          processesOnSchedule: 18,
          processesDelayed: 5,
          processesAtRisk: 2,
          processesCancelled: 0,
          scheduledMilestones: 45,
          achievedMilestones: 38,
          delayedMilestones: 7,
          milestoneComplianceRate: 84.4,
          averageDelay: 3.2,
          criticalPathCompliance: 88.5,
          budgetCompliance: 92.1,
          legalComplianceScore: 95.0,
          timelinessScore: 84.4,
          qualityScore: 89.7,
          overallScore: 89.7,
          complianceGrade: 'B+',
          keyFindings: 'Sistema funcionando adecuadamente con algunas demoras menores en procesos no críticos.',
          recommendations: 'Mejorar seguimiento de hitos intermedios y comunicación entre departamentos.',
          actionPlan: 'Implementar alertas tempranas y reuniones semanales de seguimiento.',
          riskFactors: 'Dependencias externas y disponibilidad de presupuesto.',
          mitigationMeasures: 'Planes de contingencia y reservas presupuestarias.',
          evaluatedBy: user.id,
          evaluationDate: new Date()
        }
      });
      
      console.log('✅ Datos de ejemplo creados exitosamente');
      console.log(`   ID: ${sampleCompliance.id}`);
      console.log(`   Período: ${sampleCompliance.evaluationPeriod}`);
      console.log(`   Puntuación general: ${sampleCompliance.overallScore}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreatePACCData();
