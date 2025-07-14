const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Validaciones
const validateActivityProcurementLink = [
  body('activityId')
    .isUUID()
    .withMessage('ID de actividad inválido'),
    
  body('procurementProcessId')
    .isUUID()
    .withMessage('ID de proceso de compra inválido'),
    
  body('linkReason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La razón de vinculación no puede exceder 500 caracteres'),
    
  body('isEssential')
    .optional()
    .isBoolean()
    .withMessage('isEssential debe ser un valor booleano')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/activity-procurement-links
 * @desc    Obtener lista de vinculaciones POA-PAC
 * @access  Private (read:activity_procurement_link)
 */
router.get('/', 
  auth, 
  authorize('read', 'activity_procurement_link'), 
  async (req, res) => {
    try {
      const { 
        activityId, 
        procurementProcessId, 
        departmentId,
        fiscalYear,
        page = 1, 
        limit = 50
      } = req.query;

      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      // Construir filtros
      const where = {};
      
      if (activityId) where.activityId = activityId;
      if (procurementProcessId) where.procurementProcessId = procurementProcessId;

      // Filtros complejos que requieren joins
      const include = {
        activity: {
          include: {
            product: {
              include: {
                objective: {
                  include: {
                    strategicAxis: {
                      select: { 
                        id: true, 
                        name: true, 
                        code: true, 
                        departmentId: true,
                        year: true 
                      }
                    }
                  }
                }
              }
            }
          }
        },
        procurementProcess: {
          include: {
            department: {
              select: { id: true, name: true, code: true }
            }
          }
        },
        linkedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      };

      const skip = (parseInt(page) - 1) * parseInt(limit);

      let links = await prisma.activityProcurementLink.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      });

      // Filtrar por departamento después de la consulta si es necesario
      if (userRole === 'Director de Área' && userDeptId) {
        links = links.filter(link => 
          link.activity.product.objective.strategicAxis.departmentId === userDeptId ||
          link.procurementProcess.departmentId === userDeptId
        );
      }

      // Filtrar por año fiscal si se especifica
      if (fiscalYear) {
        links = links.filter(link => 
          link.activity.product.objective.strategicAxis.year === parseInt(fiscalYear) ||
          link.procurementProcess.fiscalYear === parseInt(fiscalYear)
        );
      }

      // Filtrar por departamento específico (para administradores)
      if (departmentId && ['Administrador', 'Director de Planificación', 'Director de Compras y Contrataciones'].includes(userRole)) {
        links = links.filter(link => 
          link.activity.product.objective.strategicAxis.departmentId === departmentId ||
          link.procurementProcess.departmentId === departmentId
        );
      }

      const total = links.length;

      // Calcular estadísticas
      const stats = {
        totalLinks: total,
        essentialLinks: links.filter(link => link.isEssential).length,
        nonEssentialLinks: links.filter(link => !link.isEssential).length,
        byDepartment: {}
      };

      // Agrupar por departamento
      links.forEach(link => {
        const deptName = link.procurementProcess.department?.name || 'Sin departamento';
        if (!stats.byDepartment[deptName]) {
          stats.byDepartment[deptName] = { count: 0, totalAmount: 0 };
        }
        stats.byDepartment[deptName].count++;
        stats.byDepartment[deptName].totalAmount += parseFloat(link.procurementProcess.totalCost || 0);
      });

      res.json({
        success: true,
        data: {
          links,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          stats
        }
      });

    } catch (error) {
      logger.error('Error al obtener vinculaciones POA-PAC:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/activity-procurement-links/:id
 * @desc    Obtener vinculación POA-PAC por ID
 * @access  Private (read:activity_procurement_link)
 */
router.get('/:id', 
  auth, 
  authorize('read', 'activity_procurement_link'),
  param('id').isUUID().withMessage('ID inválido'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      const link = await prisma.activityProcurementLink.findUnique({
        where: { id },
        include: {
          activity: {
            include: {
              product: {
                include: {
                  objective: {
                    include: {
                      strategicAxis: {
                        include: {
                          department: true
                        }
                      }
                    }
                  }
                }
              },
              budgetExecutions: {
                select: {
                  assignedAmount: true,
                  budgetCode: true,
                  budgetName: true
                }
              }
            }
          },
          procurementProcess: {
            include: {
              department: true,
              createdBy: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          },
          linkedBy: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      if (!link) {
        return res.status(404).json({
          success: false,
          message: 'Vinculación no encontrada'
        });
      }

      // Verificar permisos de acceso por departamento
      const activityDeptId = link.activity.product.objective.strategicAxis.departmentId;
      const procurementDeptId = link.procurementProcess.departmentId;

      if (userRole === 'Director de Área' && 
          activityDeptId !== userDeptId && 
          procurementDeptId !== userDeptId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a esta vinculación'
        });
      }

      // Calcular información adicional de consistencia presupuestaria
      const budgetTotal = link.activity.budgetExecutions.reduce((sum, budget) => 
        sum + parseFloat(budget.assignedAmount || 0), 0
      );

      const consistencyInfo = {
        activityBudget: budgetTotal,
        procurementCost: parseFloat(link.procurementProcess.totalCost || 0),
        budgetDifference: budgetTotal - parseFloat(link.procurementProcess.totalCost || 0),
        isConsistent: budgetTotal >= parseFloat(link.procurementProcess.totalCost || 0)
      };

      res.json({
        success: true,
        data: {
          ...link,
          consistencyInfo
        }
      });

    } catch (error) {
      logger.error('Error al obtener vinculación POA-PAC:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/activity-procurement-links
 * @desc    Crear nueva vinculación POA-PAC
 * @access  Private (create:activity_procurement_link)
 */
router.post('/', 
  auth, 
  authorize('create', 'activity_procurement_link'),
  validateActivityProcurementLink,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        activityId,
        procurementProcessId,
        linkReason,
        isEssential = true
      } = req.body;

      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      // Verificar que la actividad existe y obtener información del departamento
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          product: {
            include: {
              objective: {
                include: {
                  strategicAxis: {
                    select: { departmentId: true, year: true }
                  }
                }
              }
            }
          },
          budgetExecutions: {
            select: { assignedAmount: true }
          }
        }
      });

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada'
        });
      }

      // Verificar que el proceso de compra existe
      const procurementProcess = await prisma.procurementProcess.findUnique({
        where: { id: procurementProcessId },
        select: { 
          id: true, 
          departmentId: true, 
          totalCost: true, 
          status: true,
          fiscalYear: true
        }
      });

      if (!procurementProcess) {
        return res.status(404).json({
          success: false,
          message: 'Proceso de compra no encontrado'
        });
      }

      // Verificar permisos por departamento
      const activityDeptId = activity.product.objective.strategicAxis.departmentId;
      const procurementDeptId = procurementProcess.departmentId;

      if (userRole === 'Director de Área' && 
          activityDeptId !== userDeptId && 
          procurementDeptId !== userDeptId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para vincular esta actividad y proceso de compra'
        });
      }

      // Verificar que no existe ya la vinculación
      const existingLink = await prisma.activityProcurementLink.findFirst({
        where: {
          activityId,
          procurementProcessId
        }
      });

      if (existingLink) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una vinculación entre esta actividad y proceso de compra'
        });
      }

      // Calcular consistencia presupuestaria
      const activityBudget = activity.budgetExecutions.reduce((sum, budget) => 
        sum + parseFloat(budget.assignedAmount || 0), 0
      );
      const procurementCost = parseFloat(procurementProcess.totalCost || 0);

      const newLink = await prisma.activityProcurementLink.create({
        data: {
          activityId,
          procurementProcessId,
          linkReason,
          isEssential,
          linkedById: req.user.id
        },
        include: {
          activity: {
            include: {
              product: {
                include: {
                  objective: {
                    include: {
                      strategicAxis: {
                        select: { name: true, code: true }
                      }
                    }
                  }
                }
              }
            }
          },
          procurementProcess: {
            select: { 
              cuciCode: true, 
              description: true, 
              totalCost: true, 
              status: true 
            }
          },
          linkedBy: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      // Generar alerta si hay inconsistencia presupuestaria
      const inconsistencyAlert = activityBudget < procurementCost ? {
        type: 'BUDGET_INCONSISTENCY',
        message: `El costo del proceso de compra (RD$${procurementCost.toLocaleString()}) supera el presupuesto de la actividad (RD$${activityBudget.toLocaleString()})`,
        difference: procurementCost - activityBudget
      } : null;

      logger.info(`Vinculación POA-PAC creada: Actividad ${activity.code} - Proceso ${procurementProcess.cuciCode} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Vinculación POA-PAC creada exitosamente',
        data: newLink,
        alert: inconsistencyAlert
      });

    } catch (error) {
      logger.error('Error al crear vinculación POA-PAC:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/activity-procurement-links/:id
 * @desc    Actualizar vinculación POA-PAC
 * @access  Private (update:activity_procurement_link)
 */
router.put('/:id', 
  auth, 
  authorize('update', 'activity_procurement_link'),
  param('id').isUUID().withMessage('ID inválido'),
  body('linkReason').optional().isLength({ max: 500 }).withMessage('La razón no puede exceder 500 caracteres'),
  body('isEssential').optional().isBoolean().withMessage('isEssential debe ser un valor booleano'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { linkReason, isEssential } = req.body;
      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      // Verificar que la vinculación exists
      const existingLink = await prisma.activityProcurementLink.findUnique({
        where: { id },
        include: {
          activity: {
            include: {
              product: {
                include: {
                  objective: {
                    include: {
                      strategicAxis: {
                        select: { departmentId: true }
                      }
                    }
                  }
                }
              }
            }
          },
          procurementProcess: {
            select: { departmentId: true }
          }
        }
      });

      if (!existingLink) {
        return res.status(404).json({
          success: false,
          message: 'Vinculación no encontrada'
        });
      }

      // Verificar permisos por departamento
      const activityDeptId = existingLink.activity.product.objective.strategicAxis.departmentId;
      const procurementDeptId = existingLink.procurementProcess.departmentId;

      if (userRole === 'Director de Área' && 
          activityDeptId !== userDeptId && 
          procurementDeptId !== userDeptId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar esta vinculación'
        });
      }

      const updatedLink = await prisma.activityProcurementLink.update({
        where: { id },
        data: {
          ...(linkReason !== undefined && { linkReason }),
          ...(isEssential !== undefined && { isEssential })
        },
        include: {
          activity: {
            select: { name: true, code: true }
          },
          procurementProcess: {
            select: { cuciCode: true, description: true }
          },
          linkedBy: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      logger.info(`Vinculación POA-PAC actualizada: ID ${id} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Vinculación POA-PAC actualizada exitosamente',
        data: updatedLink
      });

    } catch (error) {
      logger.error('Error al actualizar vinculación POA-PAC:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/activity-procurement-links/:id
 * @desc    Eliminar vinculación POA-PAC
 * @access  Private (delete:activity_procurement_link)
 */
router.delete('/:id', 
  auth, 
  authorize('delete', 'activity_procurement_link'),
  param('id').isUUID().withMessage('ID inválido'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      const existingLink = await prisma.activityProcurementLink.findUnique({
        where: { id },
        include: {
          activity: {
            include: {
              product: {
                include: {
                  objective: {
                    include: {
                      strategicAxis: {
                        select: { departmentId: true }
                      }
                    }
                  }
                }
              }
            }
          },
          procurementProcess: {
            select: { departmentId: true, status: true, cuciCode: true }
          }
        }
      });

      if (!existingLink) {
        return res.status(404).json({
          success: false,
          message: 'Vinculación no encontrada'
        });
      }

      // Verificar permisos por departamento
      const activityDeptId = existingLink.activity.product.objective.strategicAxis.departmentId;
      const procurementDeptId = existingLink.procurementProcess.departmentId;

      if (userRole === 'Director de Área' && 
          activityDeptId !== userDeptId && 
          procurementDeptId !== userDeptId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar esta vinculación'
        });
      }

      // No permitir eliminar si el proceso está en estado avanzado
      if (['ADJUDICADO', 'EN_PROCESO'].includes(existingLink.procurementProcess.status)) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar la vinculación porque el proceso de compra está en estado avanzado'
        });
      }

      await prisma.activityProcurementLink.delete({
        where: { id }
      });

      logger.info(`Vinculación POA-PAC eliminada: ID ${id} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Vinculación POA-PAC eliminada exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar vinculación POA-PAC:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/activity-procurement-links/activity/:activityId/alerts
 * @desc    Obtener alertas de consistencia presupuestaria para una actividad
 * @access  Private (read:activity_procurement_link)
 */
router.get('/activity/:activityId/alerts', 
  auth, 
  authorize('read', 'activity_procurement_link'),
  param('activityId').isUUID().withMessage('ID de actividad inválido'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { activityId } = req.params;

      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          budgetExecutions: {
            select: { assignedAmount: true }
          },
          procurementLinks: {
            include: {
              procurementProcess: {
                select: { 
                  id: true,
                  cuciCode: true,
                  description: true,
                  totalCost: true,
                  status: true,
                  plannedStartDate: true,
                  plannedAwardDate: true,
                  actualStartDate: true,
                  actualAwardDate: true
                }
              }
            }
          }
        }
      });

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada'
        });
      }

      const activityBudget = activity.budgetExecutions.reduce((sum, budget) => 
        sum + parseFloat(budget.assignedAmount || 0), 0
      );

      const totalProcurementCost = activity.procurementLinks.reduce((sum, link) => 
        sum + parseFloat(link.procurementProcess.totalCost || 0), 0
      );

      const alerts = [];

      // Alerta de inconsistencia presupuestaria
      if (totalProcurementCost > activityBudget) {
        alerts.push({
          type: 'BUDGET_INCONSISTENCY',
          severity: 'HIGH',
          message: `El costo total de compras (RD$${totalProcurementCost.toLocaleString()}) supera el presupuesto asignado (RD$${activityBudget.toLocaleString()})`,
          difference: totalProcurementCost - activityBudget,
          affectedProcesses: activity.procurementLinks.length
        });
      }

      // Alertas de retrasos en procesos
      const currentDate = new Date();
      activity.procurementLinks.forEach(link => {
        const process = link.procurementProcess;
        
        // Alerta de retraso en inicio planificado
        if (process.plannedStartDate && !process.actualStartDate && 
            currentDate > new Date(process.plannedStartDate)) {
          alerts.push({
            type: 'DELAYED_START',
            severity: 'MEDIUM',
            message: `El proceso ${process.cuciCode} debería haber iniciado el ${new Date(process.plannedStartDate).toLocaleDateString()}`,
            processId: process.id,
            processCode: process.cuciCode
          });
        }

        // Alerta de retraso en adjudicación planificada
        if (process.plannedAwardDate && !process.actualAwardDate && 
            currentDate > new Date(process.plannedAwardDate)) {
          alerts.push({
            type: 'DELAYED_AWARD',
            severity: 'HIGH',
            message: `El proceso ${process.cuciCode} debería haberse adjudicado el ${new Date(process.plannedAwardDate).toLocaleDateString()}`,
            processId: process.id,
            processCode: process.cuciCode
          });
        }

        // Alerta de proceso cancelado o desierto
        if (['CANCELADO', 'DESIERTO'].includes(process.status)) {
          alerts.push({
            type: 'PROCESS_CANCELLED',
            severity: 'HIGH',
            message: `El proceso ${process.cuciCode} está en estado ${process.status}`,
            processId: process.id,
            processCode: process.cuciCode
          });
        }
      });

      res.json({
        success: true,
        data: {
          activityId,
          activityBudget,
          totalProcurementCost,
          budgetConsistency: activityBudget >= totalProcurementCost,
          alerts,
          summary: {
            totalAlerts: alerts.length,
            highSeverity: alerts.filter(a => a.severity === 'HIGH').length,
            mediumSeverity: alerts.filter(a => a.severity === 'MEDIUM').length,
            lowSeverity: alerts.filter(a => a.severity === 'LOW').length
          }
        }
      });

    } catch (error) {
      logger.error('Error al obtener alertas de actividad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

module.exports = router;
