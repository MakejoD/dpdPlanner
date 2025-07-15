const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorizeRole } = require('../middleware/authorization');

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// ========== CORRELATION ROUTES ==========

// GET /api/correlation - Obtener todas las correlaciones
router.get('/', async (req, res) => {
  try {
    const { 
      complianceStatus, 
      riskLevel, 
      fiscalYear = new Date().getFullYear() 
    } = req.query;

    const where = {};
    if (complianceStatus) where.complianceStatus = complianceStatus;
    if (riskLevel) where.riskLevel = riskLevel;

    const correlations = await prisma.poaPaccBudgetCorrelation.findMany({
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
            },
            procurementProcesses: true,
            budgetAllocations: {
              where: {
                fiscalYear: parseInt(fiscalYear)
              }
            }
          }
        }
      },
      orderBy: [
        { overallCompliance: 'asc' },
        { lastReviewDate: 'desc' }
      ]
    });

    // Calcular estadísticas generales
    const stats = {
      total: correlations.length,
      byComplianceStatus: {},
      byRiskLevel: {},
      averageCompliance: 0,
      criticalActivities: 0
    };

    let totalCompliance = 0;
    
    correlations.forEach(corr => {
      stats.byComplianceStatus[corr.complianceStatus] = 
        (stats.byComplianceStatus[corr.complianceStatus] || 0) + 1;
      
      stats.byRiskLevel[corr.riskLevel] = 
        (stats.byRiskLevel[corr.riskLevel] || 0) + 1;
      
      totalCompliance += corr.overallCompliance;
      
      if (corr.overallCompliance < 50) {
        stats.criticalActivities++;
      }
    });

    stats.averageCompliance = correlations.length > 0 
      ? totalCompliance / correlations.length 
      : 0;

    res.json({
      data: correlations,
      stats,
      message: 'Correlaciones POA-PACC-Budget obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener correlaciones:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/correlation/:activityId - Obtener correlación específica
router.get('/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;

    const correlation = await prisma.poaPaccBudgetCorrelation.findUnique({
      where: { activityId },
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
            },
            procurementProcesses: {
              include: {
                budgetAllocations: true
              }
            },
            budgetAllocations: {
              include: {
                budgetExecutions: true
              }
            }
          }
        }
      }
    });

    if (!correlation) {
      // Si no existe, crearla
      const newCorrelation = await createCorrelationForActivity(activityId);
      return res.json({
        data: newCorrelation,
        message: 'Correlación creada y obtenida exitosamente'
      });
    }

    res.json({
      data: correlation,
      message: 'Correlación obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener correlación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// PUT /api/correlation/:activityId - Actualizar correlación manualmente
router.put('/:activityId', authorizeRole(['ADMIN', 'PLANIFICADOR']), async (req, res) => {
  try {
    const { activityId } = req.params;
    const { observations, recommendations } = req.body;

    let correlation = await prisma.poaPaccBudgetCorrelation.findUnique({
      where: { activityId }
    });

    if (!correlation) {
      correlation = await createCorrelationForActivity(activityId);
    } else {
      // Recalcular métricas
      await updateCorrelationMetrics(activityId);
      
      // Actualizar observaciones y recomendaciones
      correlation = await prisma.poaPaccBudgetCorrelation.update({
        where: { activityId },
        data: {
          observations,
          recommendations,
          lastReviewDate: new Date()
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
    }

    res.json({
      data: correlation,
      message: 'Correlación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar correlación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/correlation/recalculate - Recalcular todas las correlaciones
router.post('/recalculate', authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const activities = await prisma.activity.findMany();
    let updated = 0;
    let created = 0;

    for (const activity of activities) {
      const existing = await prisma.poaPaccBudgetCorrelation.findUnique({
        where: { activityId: activity.id }
      });

      if (existing) {
        await updateCorrelationMetrics(activity.id);
        updated++;
      } else {
        await createCorrelationForActivity(activity.id);
        created++;
      }
    }

    res.json({
      data: {
        totalActivities: activities.length,
        updated,
        created,
        timestamp: new Date()
      },
      message: 'Recálculo de correlaciones completado exitosamente'
    });
  } catch (error) {
    console.error('Error al recalcular correlaciones:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// GET /api/correlation/dashboard/summary - Dashboard resumen
router.get('/dashboard/summary', async (req, res) => {
  try {
    const { fiscalYear = new Date().getFullYear() } = req.query;

    // Estadísticas generales
    const totalActivities = await prisma.activity.count();
    const totalCorrelations = await prisma.poaPaccBudgetCorrelation.count();
    
    // Distribución por estado de cumplimiento
    const complianceDistribution = await prisma.poaPaccBudgetCorrelation.groupBy({
      by: ['complianceStatus'],
      _count: true
    });

    // Distribución por nivel de riesgo
    const riskDistribution = await prisma.poaPaccBudgetCorrelation.groupBy({
      by: ['riskLevel'],
      _count: true
    });

    // Promedio de cumplimiento por eje estratégico
    const complianceByAxis = await prisma.$queryRaw`
      SELECT 
        sa.name as strategicAxis,
        AVG(c.overallCompliance) as avgCompliance,
        COUNT(c.activityId) as totalActivities
      FROM strategic_axes sa
      LEFT JOIN objectives o ON o.strategicAxisId = sa.id
      LEFT JOIN products p ON p.objectiveId = o.id
      LEFT JOIN activities a ON a.productId = p.id
      LEFT JOIN poa_pacc_budget_correlations c ON c.activityId = a.id
      GROUP BY sa.id, sa.name
      ORDER BY avgCompliance DESC
    `;

    // Top 5 actividades con menor cumplimiento
    const bottomActivities = await prisma.poaPaccBudgetCorrelation.findMany({
      take: 5,
      orderBy: {
        overallCompliance: 'asc'
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

    // Actividades sin correlación
    const activitiesWithoutCorrelation = await prisma.activity.findMany({
      where: {
        poaPaccBudgetCorrelation: null
      },
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
      },
      take: 10
    });

    // Tendencia mensual de cumplimiento
    const monthlyTrend = await prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', lastReviewDate) as month,
        AVG(overallCompliance) as avgCompliance,
        COUNT(*) as reviewCount
      FROM poa_pacc_budget_correlations
      WHERE lastReviewDate >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', lastReviewDate)
      ORDER BY month ASC
    `;

    // Resumen presupuestario
    const budgetSummary = await prisma.budgetAllocation.aggregate({
      where: { fiscalYear: parseInt(fiscalYear) },
      _sum: {
        allocatedAmount: true,
        executedAmount: true
      },
      _count: true
    });

    // Resumen PACC
    const paccSummary = await prisma.procurementProcess.aggregate({
      _sum: {
        estimatedAmount: true
      },
      _count: true
    });

    const paccByStatus = await prisma.procurementProcess.groupBy({
      by: ['status'],
      _count: true
    });

    res.json({
      data: {
        overview: {
          totalActivities,
          totalCorrelations,
          correlationCoverage: totalActivities > 0 ? (totalCorrelations / totalActivities) * 100 : 0,
          activitiesWithoutCorrelation: activitiesWithoutCorrelation.length
        },
        compliance: {
          distribution: complianceDistribution.reduce((acc, item) => {
            acc[item.complianceStatus] = item._count;
            return acc;
          }, {}),
          byAxis: complianceByAxis
        },
        risk: {
          distribution: riskDistribution.reduce((acc, item) => {
            acc[item.riskLevel] = item._count;
            return acc;
          }, {})
        },
        budget: {
          totalAllocated: budgetSummary._sum.allocatedAmount || 0,
          totalExecuted: budgetSummary._sum.executedAmount || 0,
          executionRate: budgetSummary._sum.allocatedAmount > 0 
            ? (budgetSummary._sum.executedAmount / budgetSummary._sum.allocatedAmount) * 100 
            : 0,
          allocationsCount: budgetSummary._count
        },
        pacc: {
          totalEstimated: paccSummary._sum.estimatedAmount || 0,
          processesCount: paccSummary._count,
          byStatus: paccByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {})
        },
        trends: {
          monthly: monthlyTrend
        },
        alerts: {
          bottomActivities,
          activitiesWithoutCorrelation: activitiesWithoutCorrelation.slice(0, 5)
        }
      },
      message: 'Dashboard de correlación obtenido exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener dashboard de correlación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ========== COMPLIANCE REPORTS ROUTES ==========

// GET /api/correlation/reports - Obtener reportes de cumplimiento
router.get('/reports', async (req, res) => {
  try {
    const { reportType, fiscalYear, quarter, month } = req.query;

    const where = {};
    if (reportType) where.reportType = reportType;
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
    if (quarter) where.quarter = quarter;
    if (month) where.month = month;

    const reports = await prisma.complianceReport.findMany({
      where,
      orderBy: {
        generatedAt: 'desc'
      }
    });

    res.json({
      data: reports,
      message: 'Reportes de cumplimiento obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener reportes de cumplimiento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// POST /api/correlation/reports/generate - Generar reporte de cumplimiento
router.post('/reports/generate', authorizeRole(['ADMIN', 'PLANIFICADOR']), async (req, res) => {
  try {
    const {
      reportType = 'INTEGRATED',
      reportPeriod = 'QUARTERLY',
      fiscalYear = new Date().getFullYear(),
      quarter,
      month
    } = req.body;

    const report = await generateComplianceReport({
      reportType,
      reportPeriod,
      fiscalYear,
      quarter,
      month,
      generatedBy: req.user.id
    });

    res.status(201).json({
      data: report,
      message: 'Reporte de cumplimiento generado exitosamente'
    });
  } catch (error) {
    console.error('Error al generar reporte de cumplimiento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// ========== HELPER FUNCTIONS ==========

async function createCorrelationForActivity(activityId) {
  const correlation = await prisma.poaPaccBudgetCorrelation.create({
    data: { activityId }
  });

  await updateCorrelationMetrics(activityId);
  
  return await prisma.poaPaccBudgetCorrelation.findUnique({
    where: { activityId },
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
}

async function updateCorrelationMetrics(activityId) {
  try {
    // Obtener correlación existente
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
    let overallCompliance = 0;
    if (hasBudgetAllocation && hasProcurementNeeds) {
      overallCompliance = (budgetCompliance + procurementCompliance) / 2;
    } else if (hasBudgetAllocation) {
      overallCompliance = budgetCompliance;
    } else if (hasProcurementNeeds) {
      overallCompliance = procurementCompliance;
    } else {
      // Si no hay ni presupuesto ni compras, considerar cumplimiento base de la actividad
      overallCompliance = 80; // Valor por defecto para actividades sin PACC/Budget
    }

    // Determinar nivel de riesgo y estado de cumplimiento
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
        lastReviewDate: new Date(),
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    });

  } catch (error) {
    console.error('Error al actualizar métricas de correlación:', error);
    throw error;
  }
}

async function generateComplianceReport({ reportType, reportPeriod, fiscalYear, quarter, month, generatedBy }) {
  try {
    // Obtener datos base
    const activities = await prisma.activity.count();
    const correlations = await prisma.poaPaccBudgetCorrelation.findMany();
    
    const activitiesOnTrack = correlations.filter(c => c.complianceStatus === 'EN_CUMPLIMIENTO').length;
    const activitiesAtRisk = correlations.filter(c => c.complianceStatus === 'EN_RIESGO').length;
    const activitiesDelayed = correlations.filter(c => c.complianceStatus === 'INCUMPLIMIENTO').length;

    // Datos PACC
    const procurements = await prisma.procurementProcess.findMany();
    const procurementsCompleted = procurements.filter(p => p.status === 'EJECUTADO').length;
    const procurementsInProcess = procurements.filter(p => p.status === 'EN_PROCESO').length;
    const procurementsDelayed = procurements.filter(p => {
      return p.plannedEndDate && new Date() > new Date(p.plannedEndDate) && p.status !== 'EJECUTADO';
    }).length;

    // Datos presupuestarios
    const budgetData = await prisma.budgetAllocation.aggregate({
      where: { fiscalYear: parseInt(fiscalYear) },
      _sum: {
        allocatedAmount: true,
        executedAmount: true,
        availableAmount: true
      }
    });

    const totalBudget = budgetData._sum.allocatedAmount || 0;
    const budgetExecuted = budgetData._sum.executedAmount || 0;
    const budgetAvailable = budgetData._sum.availableAmount || 0;
    const executionPercentage = totalBudget > 0 ? (budgetExecuted / totalBudget) * 100 : 0;

    // Calcular cumplimiento general
    const overallCompliance = correlations.length > 0
      ? correlations.reduce((sum, c) => sum + c.overallCompliance, 0) / correlations.length
      : 0;

    // Asignar calificación
    let complianceGrade = 'F';
    if (overallCompliance >= 90) complianceGrade = 'A';
    else if (overallCompliance >= 80) complianceGrade = 'B';
    else if (overallCompliance >= 70) complianceGrade = 'C';
    else if (overallCompliance >= 60) complianceGrade = 'D';

    // Generar recomendaciones
    const recommendations = generateRecommendations({
      activitiesAtRisk,
      activitiesDelayed,
      procurementsDelayed,
      executionPercentage,
      overallCompliance
    });

    const report = await prisma.complianceReport.create({
      data: {
        reportType,
        reportPeriod,
        fiscalYear: parseInt(fiscalYear),
        quarter,
        month,
        totalActivities: activities,
        activitiesOnTrack,
        activitiesAtRisk,
        activitiesDelayed,
        totalProcurements: procurements.length,
        procurementsCompleted,
        procurementsInProcess,
        procurementsDelayed,
        totalBudget,
        budgetExecuted,
        budgetAvailable,
        executionPercentage,
        overallCompliance,
        complianceGrade,
        recommendations,
        generatedBy
      }
    });

    return report;
  } catch (error) {
    console.error('Error al generar reporte de cumplimiento:', error);
    throw error;
  }
}

function generateRecommendations({ activitiesAtRisk, activitiesDelayed, procurementsDelayed, executionPercentage, overallCompliance }) {
  const recommendations = [];

  if (activitiesDelayed > 0) {
    recommendations.push(`Se requiere atención inmediata a ${activitiesDelayed} actividad(es) en incumplimiento.`);
  }

  if (activitiesAtRisk > 0) {
    recommendations.push(`Monitorear de cerca ${activitiesAtRisk} actividad(es) en riesgo.`);
  }

  if (procurementsDelayed > 0) {
    recommendations.push(`Acelerar ${procurementsDelayed} proceso(s) de compras retrasados.`);
  }

  if (executionPercentage < 50) {
    recommendations.push('La ejecución presupuestaria está por debajo del 50%. Se recomienda revisar los procesos de gestión financiera.');
  }

  if (overallCompliance < 70) {
    recommendations.push('El cumplimiento general está por debajo del estándar. Se requiere una revisión integral del POA.');
  }

  if (recommendations.length === 0) {
    recommendations.push('El desempeño general es satisfactorio. Mantener el seguimiento regular.');
  }

  return recommendations.join(' ');
}

module.exports = router;
