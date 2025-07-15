const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ========== CRONOGRAMAS PACC ==========

// GET /api/pacc/schedules - Obtener todos los cronogramas PACC
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await prisma.paccSchedule.findMany({
      include: {
        procurementProcess: {
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
        },
        responsibleUser: {
          include: {
            department: true
          }
        }
      },
      orderBy: [
        { criticalPath: 'desc' },
        { plannedStartDate: 'asc' }
      ]
    });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching PACC schedules:', error);
    res.status(500).json({ error: 'Error al obtener cronogramas PACC' });
  }
});

// GET /api/pacc/schedules/:id - Obtener cronograma específico
router.get('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedule = await prisma.paccSchedule.findUnique({
      where: { id },
      include: {
        procurementProcess: {
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
        },
        responsibleUser: {
          include: {
            department: true
          }
        },
        alerts: {
          where: { status: 'ACTIVA' }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Cronograma no encontrado' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching PACC schedule:', error);
    res.status(500).json({ error: 'Error al obtener cronograma PACC' });
  }
});

// PUT /api/pacc/schedules/:id - Actualizar cronograma
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const schedule = await prisma.paccSchedule.update({
      where: { id },
      data: updateData,
      include: {
        procurementProcess: true,
        responsibleUser: {
          include: {
            department: true
          }
        }
      }
    });

    res.json(schedule);
  } catch (error) {
    console.error('Error updating PACC schedule:', error);
    res.status(500).json({ error: 'Error al actualizar cronograma PACC' });
  }
});

// ========== ALERTAS PACC ==========

// GET /api/pacc/alerts - Obtener todas las alertas
router.get('/alerts', async (req, res) => {
  try {
    const { status = 'ACTIVA', severity } = req.query;
    
    const whereClause = {};
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;

    const alerts = await prisma.paccAlert.findMany({
      where: whereClause,
      include: {
        procurementProcess: {
          include: {
            activity: {
              include: {
                product: {
                  include: {
                    objective: true
                  }
                }
              }
            }
          }
        },
        assignedUser: {
          include: {
            department: true
          }
        },
        escalatedUser: true
      },
      orderBy: [
        { severity: 'desc' },
        { triggerDate: 'desc' }
      ]
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching PACC alerts:', error);
    res.status(500).json({ error: 'Error al obtener alertas PACC' });
  }
});

// POST /api/pacc/alerts - Crear nueva alerta
router.post('/alerts', async (req, res) => {
  try {
    const alertData = req.body;

    const alert = await prisma.paccAlert.create({
      data: alertData,
      include: {
        procurementProcess: true,
        assignedUser: {
          include: {
            department: true
          }
        }
      }
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating PACC alert:', error);
    res.status(500).json({ error: 'Error al crear alerta PACC' });
  }
});

// PUT /api/pacc/alerts/:id - Actualizar alerta
router.put('/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const alert = await prisma.paccAlert.update({
      where: { id },
      data: updateData,
      include: {
        procurementProcess: true,
        assignedUser: {
          include: {
            department: true
          }
        }
      }
    });

    res.json(alert);
  } catch (error) {
    console.error('Error updating PACC alert:', error);
    res.status(500).json({ error: 'Error al actualizar alerta PACC' });
  }
});

// ========== CUMPLIMIENTO PACC ==========

// GET /api/pacc/compliance/latest - Obtener última evaluación de cumplimiento
router.get('/compliance/latest', async (req, res) => {
  try {
    const compliance = await prisma.paccCompliance.findFirst({
      include: {
        evaluatedByUser: {
          include: {
            department: true
          }
        },
        approvedByUser: {
          include: {
            department: true
          }
        }
      },
      orderBy: { evaluationDate: 'desc' }
    });

    if (!compliance) {
      return res.status(404).json({ error: 'No hay evaluaciones de cumplimiento disponibles' });
    }

    res.json(compliance);
  } catch (error) {
    console.error('Error fetching latest compliance:', error);
    res.status(500).json({ error: 'Error al obtener evaluación de cumplimiento' });
  }
});

// GET /api/pacc/compliance - Obtener todas las evaluaciones de cumplimiento
router.get('/compliance', async (req, res) => {
  try {
    const { year, periodType } = req.query;
    
    const whereClause = {};
    if (year) whereClause.evaluationPeriod = { contains: year };
    if (periodType) whereClause.periodType = periodType;

    const compliance = await prisma.paccCompliance.findMany({
      where: whereClause,
      include: {
        evaluatedByUser: {
          include: {
            department: true
          }
        },
        approvedByUser: {
          include: {
            department: true
          }
        }
      },
      orderBy: { evaluationDate: 'desc' }
    });

    res.json(compliance);
  } catch (error) {
    console.error('Error fetching compliance records:', error);
    res.status(500).json({ error: 'Error al obtener evaluaciones de cumplimiento' });
  }
});

// POST /api/pacc/compliance - Crear nueva evaluación de cumplimiento
router.post('/compliance', async (req, res) => {
  try {
    const complianceData = req.body;

    const compliance = await prisma.paccCompliance.create({
      data: complianceData,
      include: {
        evaluatedByUser: {
          include: {
            department: true
          }
        }
      }
    });

    res.status(201).json(compliance);
  } catch (error) {
    console.error('Error creating compliance record:', error);
    res.status(500).json({ error: 'Error al crear evaluación de cumplimiento' });
  }
});

// ========== REPORTES PACC ==========

// GET /api/pacc/reports - Obtener reportes PACC
router.get('/reports', async (req, res) => {
  try {
    const reports = await prisma.paccReport.findMany({
      include: {
        generatedByUser: {
          include: {
            department: true
          }
        }
      },
      orderBy: { generatedDate: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching PACC reports:', error);
    res.status(500).json({ error: 'Error al obtener reportes PACC' });
  }
});

// GET /api/pacc/reports/executive - Generar reporte ejecutivo
router.get('/reports/executive', async (req, res) => {
  try {
    // Importar la función de generación de reportes
    const { generatePACCReport } = require('../generate-pacc-report');
    
    // Generar el reporte HTML
    await generatePACCReport();
    
    // Por ahora retornamos un mensaje, en producción se devolvería el archivo
    res.json({ 
      message: 'Reporte ejecutivo generado exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating executive report:', error);
    res.status(500).json({ error: 'Error al generar reporte ejecutivo' });
  }
});

// ========== DASHBOARD Y MÉTRICAS ==========

// GET /api/pacc/dashboard - Obtener datos consolidados del dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Obtener cronogramas
    const schedules = await prisma.paccSchedule.findMany({
      include: {
        procurementProcess: true,
        responsibleUser: {
          include: {
            department: true
          }
        }
      }
    });

    // Obtener alertas activas
    const alerts = await prisma.paccAlert.findMany({
      where: { status: 'ACTIVA' },
      include: {
        procurementProcess: true,
        assignedUser: true
      }
    });

    // Obtener última evaluación de cumplimiento
    const compliance = await prisma.paccCompliance.findFirst({
      orderBy: { evaluationDate: 'desc' }
    });

    // Obtener procesos de contratación
    const processes = await prisma.procurementProcess.findMany({
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

    // Calcular métricas
    const metrics = {
      totalSchedules: schedules.length,
      completedSchedules: schedules.filter(s => s.status === 'COMPLETADA').length,
      inProgressSchedules: schedules.filter(s => s.status === 'EN_PROCESO').length,
      delayedSchedules: schedules.filter(s => s.status === 'RETRASADA').length,
      pendingSchedules: schedules.filter(s => s.status === 'PENDIENTE').length,
      avgCompliance: schedules.length > 0 
        ? schedules.reduce((sum, s) => sum + s.compliancePercentage, 0) / schedules.length 
        : 0,
      activeAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICA').length,
      totalBudget: processes.reduce((sum, p) => sum + p.estimatedAmount, 0),
      executedBudget: processes
        .filter(p => p.status === 'EJECUTADO')
        .reduce((sum, p) => sum + p.estimatedAmount, 0),
      criticalPathSchedules: schedules.filter(s => s.criticalPath).length
    };

    res.json({
      schedules,
      alerts,
      compliance,
      processes,
      metrics
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
});

// ========== MÉTRICAS Y ESTADÍSTICAS ==========

// GET /api/pacc/metrics - Obtener métricas del PACC
router.get('/metrics', async (req, res) => {
  try {
    const { period = 'current' } = req.query;

    // Obtener estadísticas básicas
    const totalSchedules = await prisma.paccSchedule.count();
    const completedSchedules = await prisma.paccSchedule.count({
      where: { status: 'COMPLETADA' }
    });
    const delayedSchedules = await prisma.paccSchedule.count({
      where: { status: 'RETRASADA' }
    });

    // Promedio de cumplimiento
    const avgCompliance = await prisma.paccSchedule.aggregate({
      _avg: { compliancePercentage: true }
    });

    // Alertas por severidad
    const alertsBySeverity = await prisma.paccAlert.groupBy({
      by: ['severity'],
      where: { status: 'ACTIVA' },
      _count: { id: true }
    });

    // Presupuesto total
    const budgetStats = await prisma.procurementProcess.aggregate({
      _sum: { estimatedAmount: true },
      _count: { id: true }
    });

    res.json({
      schedules: {
        total: totalSchedules,
        completed: completedSchedules,
        delayed: delayedSchedules,
        completionRate: totalSchedules > 0 ? (completedSchedules / totalSchedules * 100) : 0
      },
      compliance: {
        average: avgCompliance._avg.compliancePercentage || 0
      },
      alerts: alertsBySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count.id;
        return acc;
      }, {}),
      budget: {
        total: budgetStats._sum.estimatedAmount || 0,
        processCount: budgetStats._count.id
      }
    });
  } catch (error) {
    console.error('Error fetching PACC metrics:', error);
    res.status(500).json({ error: 'Error al obtener métricas PACC' });
  }
});

module.exports = router;
