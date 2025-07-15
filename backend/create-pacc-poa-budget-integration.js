const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPACCPOABudgetIntegration() {
  try {
    console.log('🏛️ Creando integración POA-PACC-Presupuesto completa...');

    // Obtener datos existentes
    const activities = await prisma.activity.findMany();
    const users = await prisma.user.findMany();
    
    // ========== PARTIDAS PRESUPUESTARIAS ==========
    console.log('💰 Creando partidas presupuestarias...');
    
    const budgetItems = await Promise.all([
      // Gastos de Personal
      prisma.budgetItem.create({
        data: {
          code: '0.01.01.01',
          name: 'Sueldos Personal Fijo',
          description: 'Sueldos del personal fijo contratado',
          category: 'PERSONNEL',
          isActive: true
        }
      }),
      
      prisma.budgetItem.create({
        data: {
          code: '0.01.01.02',
          name: 'Sueldos Personal Contratado',
          description: 'Sueldos del personal contratado por servicios',
          category: 'PERSONNEL',
          isActive: true
        }
      }),
      
      // Servicios No Personales
      prisma.budgetItem.create({
        data: {
          code: '0.02.01.01',
          name: 'Servicios de Desarrollo de Software',
          description: 'Contratación de servicios especializados en desarrollo de sistemas',
          category: 'SERVICES',
          isActive: true
        }
      }),
      
      prisma.budgetItem.create({
        data: {
          code: '0.02.02.01',
          name: 'Servicios de Capacitación',
          description: 'Contratación de servicios de capacitación especializada',
          category: 'SERVICES',
          isActive: true
        }
      }),
      
      prisma.budgetItem.create({
        data: {
          code: '0.02.03.01',
          name: 'Servicios de Consultoría',
          description: 'Contratación de servicios de consultoría técnica',
          category: 'SERVICES',
          isActive: true
        }
      }),
      
      // Materiales y Suministros
      prisma.budgetItem.create({
        data: {
          code: '0.03.01.01',
          name: 'Equipos de Computación',
          description: 'Adquisición de equipos informáticos',
          category: 'GOODS',
          isActive: true
        }
      }),
      
      prisma.budgetItem.create({
        data: {
          code: '0.03.02.01',
          name: 'Software y Licencias',
          description: 'Adquisición de licencias de software',
          category: 'GOODS',
          isActive: true
        }
      }),
      
      prisma.budgetItem.create({
        data: {
          code: '0.03.03.01',
          name: 'Materiales de Oficina',
          description: 'Adquisición de materiales y suministros de oficina',
          category: 'GOODS',
          isActive: true
        }
      })
    ]);

    // ========== ASIGNACIONES PRESUPUESTARIAS A ACTIVIDADES ==========
    console.log('🔗 Vinculando actividades con partidas presupuestarias...');
    
    const budgetAllocations = await Promise.all([
      // Actividad: Análisis y diseño del sistema
      prisma.budgetAllocation.create({
        data: {
          budgetCode: '0.01.01.02',
          budgetType: 'FUNCIONAMIENTO',
          fiscalYear: 2025,
          allocatedAmount: 140000.00,
          executedAmount: 35000.00,
          availableAmount: 105000.00,
          quarter: 'Q1',
          source: 'RECURSOS_INTERNOS',
          category: '100',
          subcategory: '010',
          object: '002',
          activityId: activities.find(a => a.code === 'ACT-001-2025').id
        }
      }),
      
      prisma.budgetAllocation.create({
        data: {
          budgetCode: '0.02.03.01',
          budgetType: 'FUNCIONAMIENTO',
          fiscalYear: 2025,
          allocatedAmount: 350000.00,
          executedAmount: 87500.00,
          availableAmount: 262500.00,
          quarter: 'Q1',
          source: 'RECURSOS_INTERNOS',
          category: '200',
          subcategory: '020',
          object: '301',
          activityId: activities.find(a => a.code === 'ACT-001-2025').id
        }
      }),

      // Actividad: Desarrollo del sistema
      prisma.budgetAllocation.create({
        data: {
          budgetCode: '0.02.01.01',
          budgetType: 'INVERSION',
          fiscalYear: 2025,
          allocatedAmount: 2500000.00,
          executedAmount: 0.00,
          availableAmount: 2500000.00,
          quarter: 'Q2',
          source: 'RECURSOS_INTERNOS',
          category: '200',
          subcategory: '020',
          object: '101',
          activityId: activities.find(a => a.code === 'ACT-002-2025').id
        }
      }),

      prisma.budgetAllocation.create({
        data: {
          budgetCode: '0.03.01.01',
          budgetType: 'INVERSION',
          fiscalYear: 2025,
          allocatedAmount: 510000.00,
          executedAmount: 0.00,
          availableAmount: 510000.00,
          quarter: 'Q2',
          source: 'RECURSOS_INTERNOS',
          category: '300',
          subcategory: '030',
          object: '101',
          activityId: activities.find(a => a.code === 'ACT-002-2025').id
        }
      }),

      // Actividad: Capacitación
      prisma.budgetAllocation.create({
        data: {
          budgetCode: '0.02.02.01',
          budgetType: 'FUNCIONAMIENTO',
          fiscalYear: 2025,
          allocatedAmount: 150000.00,
          executedAmount: 37500.00,
          availableAmount: 112500.00,
          quarter: 'Q1',
          source: 'RECURSOS_INTERNOS',
          category: '200',
          subcategory: '020',
          object: '201',
          activityId: activities.find(a => a.code === 'ACT-007-2025').id
        }
      }),

      prisma.budgetAllocation.create({
        data: {
          budgetCode: '0.03.03.01',
          budgetType: 'FUNCIONAMIENTO',
          fiscalYear: 2025,
          allocatedAmount: 15000.00,
          executedAmount: 3750.00,
          availableAmount: 11250.00,
          quarter: 'Q1',
          source: 'RECURSOS_INTERNOS',
          category: '300',
          subcategory: '030',
          object: '301',
          activityId: activities.find(a => a.code === 'ACT-007-2025').id
        }
      })
    ]);

    // ========== PROCESOS DE CONTRATACIÓN (PACC) ==========
    console.log('📋 Creando procesos de contratación del PACC...');
    
    const procurementProcesses = await Promise.all([
      prisma.procurementProcess.create({
        data: {
          description: 'Contratación de Servicios de Desarrollo del Sistema POA-PACC-Presupuesto',
          procurementType: 'SERVICIOS',
          procurementMethod: 'LICITACION_PUBLICA',
          estimatedAmount: 2500000.00,
          currency: 'DOP',
          plannedStartDate: new Date('2025-04-01'),
          plannedEndDate: new Date('2025-10-31'),
          quarter: 'Q2',
          status: 'PLANIFICADO',
          priority: 'ALTA',
          budgetCode: '0.02.01.01',
          legalFramework: 'LEY_340_06',
          activityId: activities.find(a => a.code === 'ACT-002-2025').id,
          observations: 'Desarrollo completo del sistema integrado POA-PACC-Presupuesto con módulos de planificación, contratación y ejecución presupuestaria'
        }
      }),
      
      prisma.procurementProcess.create({
        data: {
          description: 'Adquisición de Equipos de Computación',
          procurementType: 'BIENES',
          procurementMethod: 'COMPARACION_PRECIOS',
          estimatedAmount: 510000.00,
          currency: 'DOP',
          plannedStartDate: new Date('2025-03-01'),
          plannedEndDate: new Date('2025-04-30'),
          quarter: 'Q1',
          status: 'PLANIFICADO',
          priority: 'MEDIA',
          budgetCode: '0.03.01.01',
          legalFramework: 'LEY_340_06',
          activityId: activities.find(a => a.code === 'ACT-002-2025').id,
          observations: 'Adquisición de equipos de computación para el personal del sistema de planificación - 6 computadoras de escritorio con especificaciones técnicas altas'
        }
      }),
      
      prisma.procurementProcess.create({
        data: {
          description: 'Servicios de Consultoría para Análisis de Sistemas',
          procurementType: 'CONSULTORIA',
          procurementMethod: 'CONTRATACION_DIRECTA',
          estimatedAmount: 350000.00,
          currency: 'DOP',
          plannedStartDate: new Date('2025-01-15'),
          plannedEndDate: new Date('2025-04-15'),
          actualStartDate: new Date('2025-01-15'),
          quarter: 'Q1',
          status: 'EN_PROCESO',
          priority: 'ALTA',
          budgetCode: '0.02.03.01',
          legalFramework: 'LEY_340_06',
          activityId: activities.find(a => a.code === 'ACT-001-2025').id,
          observations: 'Consultor especializado en análisis y diseño de sistemas de planificación gubernamental con experiencia en República Dominicana'
        }
      }),
      
      prisma.procurementProcess.create({
        data: {
          description: 'Servicios de Capacitación en Planificación Estratégica',
          procurementType: 'SERVICIOS',
          procurementMethod: 'LICITACION_RESTRINGIDA',
          estimatedAmount: 150000.00,
          currency: 'DOP',
          plannedStartDate: new Date('2025-02-01'),
          plannedEndDate: new Date('2025-11-30'),
          actualStartDate: new Date('2025-02-01'),
          quarter: 'Q1',
          status: 'EN_PROCESO',
          priority: 'MEDIA',
          budgetCode: '0.02.02.01',
          legalFramework: 'LEY_340_06',
          activityId: activities.find(a => a.code === 'ACT-007-2025').id,
          observations: 'Capacitación especializada en planificación estratégica y POA para 50 funcionarios del DPD'
        }
      }),
      
      prisma.procurementProcess.create({
        data: {
          description: 'Adquisición de Licencias de Software',
          procurementType: 'BIENES',
          procurementMethod: 'CONTRATACION_DIRECTA',
          estimatedAmount: 125000.00,
          currency: 'DOP',
          plannedStartDate: new Date('2025-03-01'),
          plannedEndDate: new Date('2025-03-31'),
          quarter: 'Q1',
          status: 'PLANIFICADO',
          priority: 'MEDIA',
          budgetCode: '0.03.02.01',
          legalFramework: 'LEY_340_06',
          activityId: activities.find(a => a.code === 'ACT-002-2025').id,
          observations: 'Licencias de software especializado para gestión de proyectos y desarrollo de sistemas'
        }
      })
    ]);

    // ========== VINCULAR PROCESOS CON ACTIVIDADES ==========
    console.log('🔗 Vinculando procesos de contratación con actividades...');
    
    const activityProcurements = await Promise.all([
      // Análisis y diseño -> Consultoría
      prisma.activityProcurement.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-001-2025').id,
          procurementProcessId: procurementProcesses[2].id, // Consultoría
          relationship: 'REQUIRED',
          priority: 'HIGH'
        }
      }),
      
      // Desarrollo del sistema -> Servicios de desarrollo + Equipos
      prisma.activityProcurement.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-002-2025').id,
          procurementProcessId: procurementProcesses[0].id, // Desarrollo
          relationship: 'REQUIRED',
          priority: 'HIGH'
        }
      }),
      
      prisma.activityProcurement.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-002-2025').id,
          procurementProcessId: procurementProcesses[1].id, // Equipos
          relationship: 'REQUIRED',
          priority: 'HIGH'
        }
      }),
      
      // Capacitación -> Servicios de capacitación
      prisma.activityProcurement.create({
        data: {
          activityId: activities.find(a => a.code === 'ACT-007-2025').id,
          procurementProcessId: procurementProcesses[3].id, // Capacitación
          relationship: 'REQUIRED',
          priority: 'MEDIUM'
        }
      })
    ]);

    // ========== EJECUCIÓN PRESUPUESTARIA ==========
    console.log('📊 Creando registros de ejecución presupuestaria...');
    
    const budgetExecutions = await Promise.all([
      // Ejecución de consultoría (en progreso)
      prisma.budgetExecution.create({
        data: {
          amount: 87500.00,
          executionDate: new Date('2025-01-31'),
          description: 'Primer pago por servicios de consultoría - 25% del contrato',
          documentNumber: 'COMP-2025-001',
          executionType: 'PAGADO',
          month: '01',
          quarter: 'Q1',
          fiscalYear: 2025,
          sigefReference: 'SIGEF-2025-001',
          activityId: activities.find(a => a.code === 'ACT-001-2025').id,
          budgetAllocationId: budgetAllocations[1].id // Consultoría
        }
      }),
      
      // Ejecución de capacitación (primer pago)
      prisma.budgetExecution.create({
        data: {
          amount: 37500.00,
          executionDate: new Date('2025-02-28'),
          description: 'Primer pago por servicios de capacitación - 25% del contrato',
          documentNumber: 'COMP-2025-002',
          executionType: 'PAGADO',
          month: '02',
          quarter: 'Q1',
          fiscalYear: 2025,
          sigefReference: 'SIGEF-2025-002',
          activityId: activities.find(a => a.code === 'ACT-007-2025').id,
          budgetAllocationId: budgetAllocations[4].id // Capacitación
        }
      }),
      
      // Ejecución de sueldos personal contratado
      prisma.budgetExecution.create({
        data: {
          amount: 35000.00,
          executionDate: new Date('2025-01-31'),
          description: 'Sueldo enero 2025 - Personal contratado para análisis de sistemas',
          documentNumber: 'NOM-2025-001',
          executionType: 'PAGADO',
          month: '01',
          quarter: 'Q1',
          fiscalYear: 2025,
          sigefReference: 'SIGEF-2025-003',
          activityId: activities.find(a => a.code === 'ACT-001-2025').id,
          budgetAllocationId: budgetAllocations[0].id // Personal contratado
        }
      }),
      
      // Ejecución de materiales de oficina
      prisma.budgetExecution.create({
        data: {
          amount: 3750.00,
          executionDate: new Date('2025-02-15'),
          description: 'Adquisición de materiales de oficina para talleres de capacitación',
          documentNumber: 'COMP-2025-003',
          executionType: 'PAGADO',
          month: '02',
          quarter: 'Q1',
          fiscalYear: 2025,
          sigefReference: 'SIGEF-2025-004',
          activityId: activities.find(a => a.code === 'ACT-007-2025').id,
          budgetAllocationId: budgetAllocations[5].id // Materiales de oficina
        }
      })
    ]);

    console.log('✅ Integración POA-PACC-Presupuesto creada exitosamente!');
    console.log('\n📊 RESUMEN DE INTEGRACIÓN:');
    console.log(`- ${budgetItems.length} Partidas Presupuestarias`);
    console.log(`- ${budgetAllocations.length} Asignaciones Presupuestarias a Actividades`);
    console.log(`- ${procurementProcesses.length} Procesos de Contratación (PACC)`);
    console.log(`- ${activityProcurements.length} Vínculos Actividad-Contratación`);
    console.log(`- ${budgetExecutions.length} Registros de Ejecución Presupuestaria`);
    
    console.log('\n💰 RESUMEN PRESUPUESTARIO:');
    const totalAllocated = budgetAllocations.reduce((sum, ba) => sum + ba.allocatedAmount, 0);
    const totalExecuted = budgetAllocations.reduce((sum, ba) => sum + ba.executedAmount, 0);
    console.log(`- Presupuesto Total Asignado: RD$ ${totalAllocated.toLocaleString()}`);
    console.log(`- Presupuesto Total Ejecutado: RD$ ${totalExecuted.toLocaleString()}`);
    console.log(`- Presupuesto Disponible: RD$ ${(totalAllocated - totalExecuted).toLocaleString()}`);
    console.log(`- Porcentaje de Ejecución: ${((totalExecuted / totalAllocated) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('❌ Error creando integración POA-PACC-Presupuesto:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createPACCPOABudgetIntegration()
    .then(() => {
      console.log('✅ Script de integración POA-PACC-Presupuesto completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script de integración:', error);
      process.exit(1);
    });
}

module.exports = { createPACCPOABudgetIntegration };
