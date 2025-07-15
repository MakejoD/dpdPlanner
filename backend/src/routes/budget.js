const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorizeRole } = require('../middleware/authorization');

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// ========== BUDGET ALLOCATION ROUTES ==========

// GET /api/budget - Obtener todas las asignaciones presupuestarias
router.get('/', async (req, res) => {
  try {
    const { 
      activityId, 
      budgetType, 
      fiscalYear = new Date().getFullYear(),
      quarter,
      category 
    } = req.query;

    const where = { fiscalYear: parseInt(fiscalYear) };
    
    if (activityId) where.activityId = activityId;
    if (budgetType) where.budgetType = budgetType;
    if (quarter) where.quarter = quarter;
    if (category) where.category = category;

    console.log('Budget query where:', where);

    const allocations = await prisma.budgetAllocation.findMany({
      where,
      include: {
        activity: true,
        procurementProcess: true,
        budgetExecutions: {
          orderBy: {
            executionDate: 'desc'
          }
        }
      },
      orderBy: [
        { budgetType: 'asc' },
        { allocatedAmount: 'desc' }
      ]
    });

    console.log('Budget allocations found:', allocations.length);

    // Calcular estadísticas
    const stats = {
      total: allocations.length,
      totalAllocated: 0,
      totalExecuted: 0,
      totalAvailable: 0,
      byType: {},
      byCategory: {},
      executionPercentage: 0
    };

    allocations.forEach(alloc => {
      stats.totalAllocated += alloc.allocatedAmount || 0;
      stats.totalExecuted += alloc.executedAmount || 0;
      stats.totalAvailable += alloc.availableAmount || 0;
      
      const budgetType = alloc.budgetType || 'SIN_TIPO';
      stats.byType[budgetType] = (stats.byType[budgetType] || 0) + (alloc.allocatedAmount || 0);
      
      const category = alloc.category || 'SIN_CATEGORIA';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + (alloc.allocatedAmount || 0);
    });

    stats.executionPercentage = stats.totalAllocated > 0 
      ? (stats.totalExecuted / stats.totalAllocated) * 100 
      : 0;

    res.json({
      data: allocations,
      stats,
      message: 'Asignaciones presupuestarias obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener asignaciones presupuestarias:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/budget/:id - Obtener una asignación específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.budgetAllocation.findUnique({
      where: { id },
      include: {
        activity: {
          include: {
            product: {
              include: {
                objective: {
                  include: {
                    strategicAxis: true
                  }
                }
              }
            }
          }
        },
        procurementProcess: true,
        budgetExecutions: {
          orderBy: {
            executionDate: 'desc'
          }
        }
      }
    });

    if (!allocation) {
      return res.status(404).json({ 
        error: 'Asignación presupuestaria no encontrada' 
      });
    }

    res.json({
      data: allocation,
      message: 'Asignación presupuestaria obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener asignación presupuestaria:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/budget - Crear nueva asignación presupuestaria
router.post('/', authorizeRole(['ADMIN', 'Administrador', 'PLANIFICADOR']), async (req, res) => {
  try {
    const {
      activityId,
      budgetCode,
      budgetType,
      fiscalYear = new Date().getFullYear(),
      allocatedAmount,
      quarter,
      month,
      source,
      category,
      subcategory,
      object,
      sigefCode,
      observations,
      procurementProcessId
    } = req.body;

    // Validaciones
    if (!budgetCode || !budgetType || !allocatedAmount) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        required: ['budgetCode', 'budgetType', 'allocatedAmount']
      });
    }

    // Validar que la actividad existe si se proporciona
    if (activityId) {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId }
      });
      
      if (!activity) {
        return res.status(400).json({
          error: 'Actividad no encontrada'
        });
      }
    }

    const allocatedAmountFloat = parseFloat(allocatedAmount);
    
    const allocation = await prisma.budgetAllocation.create({
      data: {
        budgetCode,
        budgetType,
        fiscalYear: parseInt(fiscalYear),
        allocatedAmount: allocatedAmountFloat,
        executedAmount: 0,
        availableAmount: allocatedAmountFloat,
        quarter,
        month,
        source,
        category,
        subcategory,
        object,
        sigefCode,
        observations,
        activityId,
        procurementProcessId
      },
      include: {
        activity: {
          include: {
            product: {
              include: {
                objective: {
                  include: {
                    strategicAxis: true
                  }
                }
              }
            }
          }
        },
        procurementProcess: true
      }
    });

    // Actualizar correlación POA-PACC-Budget si existe actividad
    if (activityId) {
      await updateCorrelationMetrics(activityId);
    }

    res.status(201).json({
      data: allocation,
      message: 'Asignación presupuestaria creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear asignación presupuestaria:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /api/budget/:id - Actualizar asignación presupuestaria
router.put('/:id', authorizeRole(['ADMIN', 'Administrador', 'PLANIFICADOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que la asignación existe
    const existingAllocation = await prisma.budgetAllocation.findUnique({
      where: { id }
    });

    if (!existingAllocation) {
      return res.status(404).json({ 
        error: 'Asignación presupuestaria no encontrada' 
      });
    }

    // Convertir montos a números si están presentes
    if (updateData.allocatedAmount) {
      updateData.allocatedAmount = parseFloat(updateData.allocatedAmount);
    }
    if (updateData.executedAmount) {
      updateData.executedAmount = parseFloat(updateData.executedAmount);
    }
    if (updateData.availableAmount) {
      updateData.availableAmount = parseFloat(updateData.availableAmount);
    }

    // Recalcular disponible si se actualiza asignado o ejecutado
    if (updateData.allocatedAmount !== undefined || updateData.executedAmount !== undefined) {
      const allocated = updateData.allocatedAmount || existingAllocation.allocatedAmount;
      const executed = updateData.executedAmount || existingAllocation.executedAmount;
      updateData.availableAmount = allocated - executed;
    }

    const allocation = await prisma.budgetAllocation.update({
      where: { id },
      data: updateData,
      include: {
        activity: {
          include: {
            product: {
              include: {
                objective: {
                  include: {
                    strategicAxis: true
                  }
                }
              }
            }
          }
        },
        procurementProcess: true,
        budgetExecutions: true
      }
    });

    // Actualizar correlación si hay cambios importantes
    if (allocation.activityId && (updateData.allocatedAmount || updateData.executedAmount)) {
      await updateCorrelationMetrics(allocation.activityId);
    }

    res.json({
      data: allocation,
      message: 'Asignación presupuestaria actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar asignación presupuestaria:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /api/budget/:id - Eliminar asignación presupuestaria
router.delete('/:id', authorizeRole(['ADMIN', 'Administrador']), async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.budgetAllocation.findUnique({
      where: { id }
    });

    if (!allocation) {
      return res.status(404).json({ 
        error: 'Asignación presupuestaria no encontrada' 
      });
    }

    await prisma.budgetAllocation.delete({
      where: { id }
    });

    // Actualizar correlación si tenía actividad asociada
    if (allocation.activityId) {
      await updateCorrelationMetrics(allocation.activityId);
    }

    res.json({
      message: 'Asignación presupuestaria eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar asignación presupuestaria:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ========== BUDGET EXECUTION ROUTES ==========

// POST /api/budget/:id/executions - Registrar ejecución presupuestaria
router.post('/:id/executions', authorizeRole(['ADMIN', 'Administrador', 'PLANIFICADOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      description,
      documentNumber,
      executionType,
      sigefReference,
      observations,
      executionDate = new Date()
    } = req.body;

    // Validaciones
    if (!amount || !executionType) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        required: ['amount', 'executionType']
      });
    }

    // Verificar que la asignación existe
    const allocation = await prisma.budgetAllocation.findUnique({
      where: { id }
    });

    if (!allocation) {
      return res.status(404).json({ 
        error: 'Asignación presupuestaria no encontrada' 
      });
    }

    const executionAmount = parseFloat(amount);
    const execDate = new Date(executionDate);

    // Validar que no se exceda el presupuesto disponible
    if (allocation.availableAmount < executionAmount) {
      return res.status(400).json({
        error: 'El monto excede el presupuesto disponible',
        available: allocation.availableAmount,
        requested: executionAmount
      });
    }

    const execution = await prisma.budgetExecution.create({
      data: {
        amount: executionAmount,
        description,
        documentNumber,
        executionType,
        sigefReference,
        observations,
        executionDate: execDate,
        month: execDate.toLocaleString('es-ES', { month: 'long' }),
        quarter: `Q${Math.ceil((execDate.getMonth() + 1) / 3)}`,
        fiscalYear: execDate.getFullYear(),
        budgetAllocationId: id
      }
    });

    // Actualizar montos en la asignación
    const newExecutedAmount = allocation.executedAmount + executionAmount;
    const newAvailableAmount = allocation.allocatedAmount - newExecutedAmount;

    await prisma.budgetAllocation.update({
      where: { id },
      data: {
        executedAmount: newExecutedAmount,
        availableAmount: newAvailableAmount
      }
    });

    // Actualizar correlación si hay actividad asociada
    if (allocation.activityId) {
      await updateCorrelationMetrics(allocation.activityId);
    }

    res.status(201).json({
      data: execution,
      message: 'Ejecución presupuestaria registrada exitosamente'
    });
  } catch (error) {
    console.error('Error al registrar ejecución presupuestaria:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/budget/statistics/dashboard - Estadísticas para dashboard
router.get('/statistics/dashboard', async (req, res) => {
  try {
    const { fiscalYear = new Date().getFullYear() } = req.query;

    // Estadísticas generales
    const totalAllocations = await prisma.budgetAllocation.count({
      where: { fiscalYear: parseInt(fiscalYear) }
    });

    const allocationSummary = await prisma.budgetAllocation.aggregate({
      where: { fiscalYear: parseInt(fiscalYear) },
      _sum: {
        allocatedAmount: true,
        executedAmount: true,
        availableAmount: true
      }
    });

    const allocationsByType = await prisma.budgetAllocation.groupBy({
      by: ['budgetType'],
      where: { fiscalYear: parseInt(fiscalYear) },
      _count: true,
      _sum: {
        allocatedAmount: true,
        executedAmount: true
      }
    });

    const allocationsByCategory = await prisma.budgetAllocation.groupBy({
      by: ['category'],
      where: { fiscalYear: parseInt(fiscalYear) },
      _count: true,
      _sum: {
        allocatedAmount: true,
        executedAmount: true
      }
    });

    // Ejecución mensual
    const monthlyExecution = await prisma.budgetExecution.groupBy({
      by: ['month'],
      where: { fiscalYear: parseInt(fiscalYear) },
      _count: true,
      _sum: {
        amount: true
      },
      orderBy: {
        month: 'asc'
      }
    });

    // Top 5 asignaciones por monto
    const topAllocations = await prisma.budgetAllocation.findMany({
      where: { fiscalYear: parseInt(fiscalYear) },
      take: 5,
      orderBy: {
        allocatedAmount: 'desc'
      },
      include: {
        activity: {
          include: {
            product: true
          }
        }
      }
    });

    // Alertas presupuestarias
    const allAllocations = await prisma.budgetAllocation.findMany({
      where: { fiscalYear: parseInt(fiscalYear) },
      select: {
        id: true,
        allocatedAmount: true,
        executedAmount: true,
        availableAmount: true
      }
    });

    const lowBudgetAllocations = allAllocations.filter(alloc => 
      alloc.availableAmount < (alloc.allocatedAmount * 0.1)
    ).length;

    const overBudgetAllocations = allAllocations.filter(alloc => 
      alloc.executedAmount > alloc.allocatedAmount
    ).length;

    // Calcular porcentaje de ejecución general
    const totalAllocated = allocationSummary._sum.allocatedAmount || 0;
    const totalExecuted = allocationSummary._sum.executedAmount || 0;
    const executionPercentage = totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0;

    res.json({
      data: {
        summary: {
          totalAllocations,
          totalAllocated,
          totalExecuted,
          totalAvailable: allocationSummary._sum.availableAmount || 0,
          executionPercentage
        },
        allocationsByType: allocationsByType.map(item => ({
          type: item.budgetType,
          count: item._count,
          allocated: item._sum.allocatedAmount || 0,
          executed: item._sum.executedAmount || 0,
          executionRate: item._sum.allocatedAmount > 0 
            ? ((item._sum.executedAmount || 0) / item._sum.allocatedAmount) * 100 
            : 0
        })),
        allocationsByCategory: allocationsByCategory.map(item => ({
          category: item.category,
          count: item._count,
          allocated: item._sum.allocatedAmount || 0,
          executed: item._sum.executedAmount || 0
        })),
        monthlyExecution: monthlyExecution.map(item => ({
          month: item.month,
          count: item._count,
          amount: item._sum.amount || 0
        })),
        topAllocations,
        alerts: {
          lowBudget: lowBudgetAllocations,
          overBudget: overBudgetAllocations
        }
      },
      message: 'Estadísticas presupuestarias obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener estadísticas presupuestarias:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/budget/sigef/sync - Simular sincronización con SIGEF
router.get('/sigef/sync', authorizeRole(['ADMIN', 'Administrador', 'PLANIFICADOR']), async (req, res) => {
  try {
    // Simular proceso de sincronización
    await new Promise(resolve => setTimeout(resolve, 2000));

    // En un entorno real, aquí se haría la conexión con SIGEF
    const syncResults = {
      status: 'success',
      timestamp: new Date(),
      allocationsUpdated: Math.floor(Math.random() * 10) + 1,
      executionsUpdated: Math.floor(Math.random() * 20) + 5,
      errors: [],
      warnings: [
        'Algunos códigos SIGEF no fueron encontrados en el sistema remoto'
      ]
    };

    res.json({
      data: syncResults,
      message: 'Sincronización con SIGEF completada'
    });
  } catch (error) {
    console.error('Error en sincronización SIGEF:', error);
    res.status(500).json({ 
      error: 'Error en sincronización SIGEF',
      details: error.message 
    });
  }
});

// ========== HELPER FUNCTIONS ==========

async function updateCorrelationMetrics(activityId) {
  try {
    // Obtener o crear correlación
    let correlation = await prisma.poaPaccBudgetCorrelation.findUnique({
      where: { activityId }
    });

    if (!correlation) {
      correlation = await prisma.poaPaccBudgetCorrelation.create({
        data: { activityId }
      });
    }

    // Calcular métricas presupuestarias
    const budgetAllocations = await prisma.budgetAllocation.findMany({
      where: { activityId }
    });

    const hasBudgetAllocation = budgetAllocations.length > 0;
    let budgetCompliance = 0;

    if (hasBudgetAllocation) {
      const totalAllocated = budgetAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
      const totalExecuted = budgetAllocations.reduce((sum, alloc) => sum + alloc.executedAmount, 0);
      
      budgetCompliance = totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0;
    }

    // Calcular métricas PACC
    const procurements = await prisma.procurementProcess.findMany({
      where: { activityId }
    });

    const hasProcurementNeeds = procurements.length > 0;
    let procurementCompliance = 0;

    if (hasProcurementNeeds) {
      const completedProcurements = procurements.filter(p => 
        p.status === 'EJECUTADO' || p.status === 'ADJUDICADO'
      ).length;
      
      procurementCompliance = procurements.length > 0 
        ? (completedProcurements / procurements.length) * 100 
        : 0;
    }

    // Calcular cumplimiento general
    let overallCompliance = 0;
    if (hasBudgetAllocation && hasProcurementNeeds) {
      overallCompliance = (budgetCompliance + procurementCompliance) / 2;
    } else if (hasBudgetAllocation) {
      overallCompliance = budgetCompliance;
    } else if (hasProcurementNeeds) {
      overallCompliance = procurementCompliance;
    }

    // Determinar nivel de riesgo
    let riskLevel = 'BAJO';
    let complianceStatus = 'EN_CUMPLIMIENTO';

    if (overallCompliance < 50) {
      riskLevel = 'ALTO';
      complianceStatus = 'INCUMPLIMIENTO';
    } else if (overallCompliance < 75) {
      riskLevel = 'MEDIO';
      complianceStatus = 'EN_RIESGO';
    }

    // Actualizar correlación
    await prisma.poaPaccBudgetCorrelation.update({
      where: { activityId },
      data: {
        hasProcurementNeeds,
        procurementCompliance,
        hasBudgetAllocation,
        budgetCompliance,
        overallCompliance,
        riskLevel,
        complianceStatus,
        lastReviewDate: new Date()
      }
    });

  } catch (error) {
    console.error('Error al actualizar métricas de correlación:', error);
  }
}

module.exports = router;
