const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorizeRole } = require('../middleware/authorization');

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// ========== PROCUREMENT PROCESSES ROUTES ==========

// GET /api/procurement - Obtener todos los procesos de compras
router.get('/', async (req, res) => {
  try {
    const { 
      activityId, 
      procurementType, 
      status, 
      quarter, 
      fiscalYear = new Date().getFullYear() 
    } = req.query;

    const where = {};
    
    if (activityId) where.activityId = activityId;
    if (procurementType) where.procurementType = procurementType;
    if (status) where.status = status;
    if (quarter) where.quarter = quarter;

    const procurements = await prisma.procurementProcess.findMany({
      where,
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
        budgetAllocations: true
      },
      orderBy: [
        { priority: 'desc' },
        { plannedStartDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Calcular estadísticas
    const stats = {
      total: procurements.length,
      byStatus: {},
      byType: {},
      byPriority: {},
      totalEstimatedAmount: 0
    };

    procurements.forEach(proc => {
      stats.byStatus[proc.status] = (stats.byStatus[proc.status] || 0) + 1;
      stats.byType[proc.procurementType] = (stats.byType[proc.procurementType] || 0) + 1;
      stats.byPriority[proc.priority] = (stats.byPriority[proc.priority] || 0) + 1;
      stats.totalEstimatedAmount += proc.estimatedAmount;
    });

    res.json({
      data: procurements,
      stats,
      message: 'Procesos PACC obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener procesos PACC:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/procurement/:id - Obtener un proceso específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const procurement = await prisma.procurementProcess.findUnique({
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
        budgetAllocations: {
          include: {
            budgetExecutions: true
          }
        }
      }
    });

    if (!procurement) {
      return res.status(404).json({ 
        error: 'Proceso de compra no encontrado' 
      });
    }

    res.json({
      data: procurement,
      message: 'Proceso PACC obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener proceso PACC:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/procurement - Crear nuevo proceso de compra
router.post('/', authorizeRole(['ADMIN', 'Administrador', 'PLANIFICADOR']), async (req, res) => {
  try {
    const {
      activityId,
      description,
      procurementType,
      procurementMethod,
      estimatedAmount,
      currency = 'DOP',
      plannedStartDate,
      plannedEndDate,
      quarter,
      month,
      status = 'PLANIFICADO',
      priority = 'MEDIA',
      budgetCode,
      isRecurrent = false,
      legalFramework = 'LEY_340_06',
      observations
    } = req.body;

    // Validaciones
    if (!description || !procurementType || !procurementMethod || !estimatedAmount) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        required: ['description', 'procurementType', 'procurementMethod', 'estimatedAmount']
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

    const procurement = await prisma.procurementProcess.create({
      data: {
        description,
        procurementType,
        procurementMethod,
        estimatedAmount: parseFloat(estimatedAmount),
        currency,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        quarter,
        month,
        status,
        priority,
        budgetCode,
        isRecurrent,
        legalFramework,
        observations,
        activityId
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
        }
      }
    });

    // Actualizar correlación POA-PACC-Budget si existe actividad
    if (activityId) {
      await updateCorrelationMetrics(activityId);
    }

    res.status(201).json({
      data: procurement,
      message: 'Proceso PACC creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear proceso PACC:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /api/procurement/:id - Actualizar proceso de compra
router.put('/:id', authorizeRole(['ADMIN', 'Administrador', 'PLANIFICADOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que el proceso existe
    const existingProcurement = await prisma.procurementProcess.findUnique({
      where: { id }
    });

    if (!existingProcurement) {
      return res.status(404).json({ 
        error: 'Proceso de compra no encontrado' 
      });
    }

    // Procesar fechas si están presentes
    if (updateData.plannedStartDate) {
      updateData.plannedStartDate = new Date(updateData.plannedStartDate);
    }
    if (updateData.plannedEndDate) {
      updateData.plannedEndDate = new Date(updateData.plannedEndDate);
    }
    if (updateData.actualStartDate) {
      updateData.actualStartDate = new Date(updateData.actualStartDate);
    }
    if (updateData.actualEndDate) {
      updateData.actualEndDate = new Date(updateData.actualEndDate);
    }

    // Convertir estimatedAmount a número si está presente
    if (updateData.estimatedAmount) {
      updateData.estimatedAmount = parseFloat(updateData.estimatedAmount);
    }

    const procurement = await prisma.procurementProcess.update({
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
        budgetAllocations: true
      }
    });

    // Actualizar correlación si hay cambios importantes
    if (procurement.activityId && (updateData.status || updateData.estimatedAmount)) {
      await updateCorrelationMetrics(procurement.activityId);
    }

    res.json({
      data: procurement,
      message: 'Proceso PACC actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar proceso PACC:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// DELETE /api/procurement/:id - Eliminar proceso de compra
router.delete('/:id', authorizeRole(['ADMIN', 'Administrador']), async (req, res) => {
  try {
    const { id } = req.params;

    const procurement = await prisma.procurementProcess.findUnique({
      where: { id }
    });

    if (!procurement) {
      return res.status(404).json({ 
        error: 'Proceso de compra no encontrado' 
      });
    }

    await prisma.procurementProcess.delete({
      where: { id }
    });

    // Actualizar correlación si tenía actividad asociada
    if (procurement.activityId) {
      await updateCorrelationMetrics(procurement.activityId);
    }

    res.json({
      message: 'Proceso PACC eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar proceso PACC:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/procurement/statistics/dashboard - Estadísticas para dashboard
router.get('/statistics/dashboard', async (req, res) => {
  try {
    const { fiscalYear = new Date().getFullYear() } = req.query;

    // Estadísticas generales
    const totalProcesses = await prisma.procurementProcess.count();
    const processesByStatus = await prisma.procurementProcess.groupBy({
      by: ['status'],
      _count: true
    });

    const processesByType = await prisma.procurementProcess.groupBy({
      by: ['procurementType'],
      _count: true,
      _sum: {
        estimatedAmount: true
      }
    });

    const processesByQuarter = await prisma.procurementProcess.groupBy({
      by: ['quarter'],
      _count: true,
      _sum: {
        estimatedAmount: true
      }
    });

    // Procesos con mayor monto
    const topProcesses = await prisma.procurementProcess.findMany({
      take: 5,
      orderBy: {
        estimatedAmount: 'desc'
      },
      include: {
        activity: {
          include: {
            product: true
          }
        }
      }
    });

    // Cumplimiento PACC (basado en fechas planificadas vs reales)
    const overdueProcesses = await prisma.procurementProcess.count({
      where: {
        plannedEndDate: {
          lt: new Date()
        },
        status: {
          notIn: ['EJECUTADO', 'CANCELADO']
        }
      }
    });

    const compliance = totalProcesses > 0 
      ? ((totalProcesses - overdueProcesses) / totalProcesses) * 100 
      : 100;

    res.json({
      data: {
        totalProcesses,
        processesByStatus: processesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        processesByType: processesByType.map(item => ({
          type: item.procurementType,
          count: item._count,
          totalAmount: item._sum.estimatedAmount || 0
        })),
        processesByQuarter: processesByQuarter.map(item => ({
          quarter: item.quarter,
          count: item._count,
          totalAmount: item._sum.estimatedAmount || 0
        })),
        topProcesses,
        compliance: {
          percentage: compliance,
          overdueProcesses,
          onTimeProcesses: totalProcesses - overdueProcesses
        }
      },
      message: 'Estadísticas PACC obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener estadísticas PACC:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
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

    // Calcular cumplimiento general
    const overallCompliance = (procurementCompliance + budgetCompliance) / 2;

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

// ========== RUTAS DE REPORTES ==========

/**
 * @route   GET /api/procurement-processes/reports/overview
 * @desc    Obtener reporte general de procesos PACC
 * @access  Private
 */
router.get('/reports/overview', async (req, res) => {
  try {
    const { fiscalYear = new Date().getFullYear() } = req.query;

    // Estadísticas básicas
    const totalProcesses = await prisma.procurementProcess.count();
    
    const statusDistribution = await prisma.procurementProcess.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        estimatedAmount: true
      }
    });

    const typeDistribution = await prisma.procurementProcess.groupBy({
      by: ['procurementType'],
      _count: true,
      _sum: {
        estimatedAmount: true
      }
    });

    const quarterDistribution = await prisma.procurementProcess.groupBy({
      by: ['quarter'],
      _count: true,
      _sum: {
        estimatedAmount: true
      },
      orderBy: {
        quarter: 'asc'
      }
    });

    // Total estimado
    const totalEstimated = await prisma.procurementProcess.aggregate({
      _sum: {
        estimatedAmount: true
      }
    });

    // Procesos por prioridad
    const priorityDistribution = await prisma.procurementProcess.groupBy({
      by: ['priority'],
      _count: true
    });

    const overview = {
      summary: {
        totalProcesses,
        totalEstimatedAmount: totalEstimated._sum.estimatedAmount || 0,
        fiscalYear: parseInt(fiscalYear)
      },
      distributions: {
        byStatus: statusDistribution.map(item => ({
          status: item.status,
          count: item._count,
          amount: item._sum.estimatedAmount || 0
        })),
        byType: typeDistribution.map(item => ({
          type: item.procurementType,
          count: item._count,
          amount: item._sum.estimatedAmount || 0
        })),
        byQuarter: quarterDistribution.map(item => ({
          quarter: item.quarter || 'No asignado',
          count: item._count,
          amount: item._sum.estimatedAmount || 0
        })),
        byPriority: priorityDistribution.map(item => ({
          priority: item.priority,
          count: item._count
        }))
      },
      compliance: {
        onTime: totalProcesses,
        delayed: 0,
        cancelled: statusDistribution.find(s => s.status === 'CANCELADO')?._count || 0
      }
    };

    res.json({
      data: overview,
      message: 'Reporte general obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error al generar reporte general:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/procurement-processes/reports/compliance
 * @desc    Obtener reporte de cumplimiento PACC
 * @access  Private
 */
router.get('/reports/compliance', async (req, res) => {
  try {
    const { fiscalYear = new Date().getFullYear() } = req.query;

    // Procesos vencidos
    const overdueProcesses = await prisma.procurementProcess.findMany({
      where: {
        plannedEndDate: {
          lt: new Date()
        },
        status: {
          notIn: ['EJECUTADO', 'CANCELADO']
        }
      },
      include: {
        activity: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    // Procesos próximos a vencer (próximos 30 días)
    const upcomingDeadlines = await prisma.procurementProcess.findMany({
      where: {
        plannedEndDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        status: {
          notIn: ['EJECUTADO', 'CANCELADO']
        }
      },
      include: {
        activity: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    const complianceReport = {
      summary: {
        totalActive: await prisma.procurementProcess.count({
          where: {
            status: {
              notIn: ['EJECUTADO', 'CANCELADO']
            }
          }
        }),
        overdue: overdueProcesses.length,
        upcomingDeadlines: upcomingDeadlines.length
      },
      details: {
        overdueProcesses: overdueProcesses.map(p => ({
          id: p.id,
          description: p.description,
          plannedEndDate: p.plannedEndDate,
          status: p.status,
          estimatedAmount: p.estimatedAmount,
          activity: p.activity
        })),
        upcomingDeadlines: upcomingDeadlines.map(p => ({
          id: p.id,
          description: p.description,
          plannedEndDate: p.plannedEndDate,
          status: p.status,
          estimatedAmount: p.estimatedAmount,
          activity: p.activity
        }))
      }
    };

    res.json({
      data: complianceReport,
      message: 'Reporte de cumplimiento obtenido exitosamente'
    });

  } catch (error) {
    console.error('Error al generar reporte de cumplimiento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;
