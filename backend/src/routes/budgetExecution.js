const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware para validar errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

// Función para calcular porcentajes automáticamente
const calculatePercentages = (budgetExecution) => {
  const assigned = parseFloat(budgetExecution.assignedAmount) || 0;
  
  if (assigned === 0) {
    return {
      commitmentPercent: 0,
      accruedPercent: 0,
      executionPercent: 0
    };
  }

  const committed = parseFloat(budgetExecution.committedAmount) || 0;
  const accrued = parseFloat(budgetExecution.accruedAmount) || 0;
  const paid = parseFloat(budgetExecution.paidAmount) || 0;

  return {
    commitmentPercent: Math.round((committed / assigned) * 100 * 100) / 100, // Redondear a 2 decimales
    accruedPercent: Math.round((accrued / assigned) * 100 * 100) / 100,
    executionPercent: Math.round((paid / assigned) * 100 * 100) / 100
  };
};

/**
 * @route   GET /api/budget-execution
 * @desc    Obtener todas las ejecuciones presupuestarias con filtros opcionales
 * @access  Private (requiere permiso read:budget)
 */
router.get('/', 
  authenticateToken, 
  authorize('read', 'budget'),
  [
    query('activityId').optional().isUUID().withMessage('activityId debe ser un UUID válido'),
    query('fiscalYear').optional().isInt({ min: 2020, max: 2030 }).withMessage('Año fiscal debe estar entre 2020 y 2030'),
    query('departmentId').optional().isUUID().withMessage('departmentId debe ser un UUID válido'),
    query('budgetCode').optional().isString().withMessage('budgetCode debe ser una cadena válida'),
    query('isActive').optional().isBoolean().withMessage('isActive debe ser true o false'),
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { 
        activityId, 
        fiscalYear, 
        departmentId, 
        budgetCode,
        isActive,
        page = 1,
        limit = 50
      } = req.query;
      
      // Construir filtros
      const where = {};
      
      if (activityId) {
        where.activityId = activityId;
      }
      
      if (fiscalYear) {
        where.fiscalYear = parseInt(fiscalYear);
      }
      
      if (departmentId) {
        where.departmentId = departmentId;
      }
      
      if (budgetCode) {
        where.budgetCode = {
          contains: budgetCode,
          mode: 'insensitive'
        };
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // Filtrar por departamento según el rol del usuario
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área') {
        where.departmentId = req.user.departmentId;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [budgetExecutions, totalCount] = await Promise.all([
        prisma.budgetExecution.findMany({
          where,
          include: {
            activity: {
              include: {
                product: {
                  include: {
                    objective: {
                      include: {
                        strategicAxis: {
                          select: { id: true, name: true, code: true }
                        }
                      }
                    }
                  }
                }
              }
            },
            department: {
              select: { id: true, name: true, code: true }
            },
            responsible: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            modifiedBy: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: [
            { fiscalYear: 'desc' },
            { budgetCode: 'asc' },
            { createdAt: 'desc' }
          ]
        }),
        prisma.budgetExecution.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      logger.info(`Budget executions retrieved: ${budgetExecutions.length} items`, {
        userId: req.user.id,
        filters: { activityId, fiscalYear, departmentId, budgetCode, isActive },
        pagination: { page, limit, totalCount }
      });

      res.json({
        success: true,
        data: {
          budgetExecutions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        },
        message: `${budgetExecutions.length} ejecuciones presupuestarias encontradas`
      });

    } catch (error) {
      logger.error('Error al obtener ejecuciones presupuestarias:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor al obtener ejecuciones presupuestarias'
      });
    }
  }
);

/**
 * @route   GET /api/budget-execution/:id
 * @desc    Obtener una ejecución presupuestaria específica por ID
 * @access  Private (requiere permiso read:budget)
 */
router.get('/:id',
  authenticateToken,
  authorize('read', 'budget'),
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const budgetExecution = await prisma.budgetExecution.findUnique({
        where: { id },
        include: {
          activity: {
            include: {
              product: {
                include: {
                  objective: {
                    include: {
                      strategicAxis: {
                        select: { id: true, name: true, code: true, year: true }
                      }
                    }
                  }
                }
              }
            }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          responsible: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          modifiedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      if (!budgetExecution) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Ejecución presupuestaria no encontrada'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && budgetExecution.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'No tienes permisos para ver esta ejecución presupuestaria'
        });
      }

      logger.info(`Budget execution retrieved: ${budgetExecution.budgetCode}`, {
        userId: req.user.id,
        budgetExecutionId: id
      });

      res.json({
        success: true,
        data: budgetExecution,
        message: 'Ejecución presupuestaria encontrada'
      });

    } catch (error) {
      logger.error('Error al obtener ejecución presupuestaria:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor al obtener la ejecución presupuestaria'
      });
    }
  }
);

/**
 * @route   POST /api/budget-execution
 * @desc    Crear una nueva ejecución presupuestaria
 * @access  Private (requiere permiso create:budget)
 */
router.post('/',
  authenticateToken,
  authorize('create', 'budget'),
  [
    body('budgetCode')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('El código presupuestario debe tener entre 3 y 50 caracteres')
      .matches(/^[A-Z0-9.-]+$/)
      .withMessage('El código solo puede contener letras mayúsculas, números, puntos y guiones'),
    body('budgetName')
      .trim()
      .isLength({ min: 5, max: 255 })
      .withMessage('El nombre de la partida debe tener entre 5 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('assignedAmount')
      .isFloat({ min: 0 })
      .withMessage('El monto asignado debe ser un número positivo'),
    body('committedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El monto comprometido debe ser un número positivo'),
    body('accruedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El monto devengado debe ser un número positivo'),
    body('paidAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El monto pagado debe ser un número positivo'),
    body('fiscalYear')
      .isInt({ min: 2020, max: 2030 })
      .withMessage('El año fiscal debe estar entre 2020 y 2030'),
    body('quarter')
      .optional()
      .isInt({ min: 1, max: 4 })
      .withMessage('El trimestre debe estar entre 1 y 4'),
    body('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('El mes debe estar entre 1 y 12'),
    body('activityId')
      .isUUID()
      .withMessage('activityId debe ser un UUID válido'),
    body('departmentId')
      .optional()
      .isUUID()
      .withMessage('departmentId debe ser un UUID válido'),
    body('responsibleId')
      .optional()
      .isUUID()
      .withMessage('responsibleId debe ser un UUID válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        budgetCode,
        budgetName,
        description,
        assignedAmount,
        committedAmount = 0,
        accruedAmount = 0,
        paidAmount = 0,
        fiscalYear,
        quarter,
        month,
        activityId,
        departmentId,
        responsibleId
      } = req.body;

      // Verificar que la actividad exista
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
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
          }
        }
      });

      if (!activity) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Actividad no encontrada'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      const activityDepartmentId = activity.product.objective.strategicAxis.departmentId;
      
      if (userRole === 'Director de Área' && activityDepartmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'No tienes permisos para crear ejecuciones presupuestarias en esta actividad'
        });
      }

      // Verificar que no exista una ejecución duplicada para la misma actividad, código y año
      const existingExecution = await prisma.budgetExecution.findFirst({
        where: {
          activityId,
          budgetCode,
          fiscalYear
        }
      });

      if (existingExecution) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `Ya existe una ejecución presupuestaria con el código "${budgetCode}" para esta actividad en el año ${fiscalYear}`
        });
      }

      // Validar que los montos tengan sentido lógico
      const assigned = parseFloat(assignedAmount);
      const committed = parseFloat(committedAmount);
      const accrued = parseFloat(accruedAmount);
      const paid = parseFloat(paidAmount);

      if (committed > assigned) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'El monto comprometido no puede ser mayor al monto asignado'
        });
      }

      if (accrued > committed) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'El monto devengado no puede ser mayor al monto comprometido'
        });
      }

      if (paid > accrued) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'El monto pagado no puede ser mayor al monto devengado'
        });
      }

      // Calcular porcentajes automáticamente
      const percentages = calculatePercentages({
        assignedAmount: assigned,
        committedAmount: committed,
        accruedAmount: accrued,
        paidAmount: paid
      });

      // Crear ejecución presupuestaria
      const budgetExecution = await prisma.budgetExecution.create({
        data: {
          budgetCode,
          budgetName,
          description,
          assignedAmount: assigned,
          committedAmount: committed,
          accruedAmount: accrued,
          paidAmount: paid,
          commitmentPercent: percentages.commitmentPercent,
          accruedPercent: percentages.accruedPercent,
          executionPercent: percentages.executionPercent,
          fiscalYear,
          quarter,
          month,
          activityId,
          departmentId: departmentId || activityDepartmentId,
          responsibleId,
          modifiedById: req.user.id
        },
        include: {
          activity: {
            include: {
              product: {
                select: { id: true, name: true, code: true }
              }
            }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          responsible: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      logger.info(`Budget execution created: ${budgetCode} - ${budgetName}`, {
        userId: req.user.id,
        budgetExecutionId: budgetExecution.id,
        activityId,
        fiscalYear
      });

      res.status(201).json({
        success: true,
        data: budgetExecution,
        message: `Ejecución presupuestaria "${budgetName}" creada exitosamente`
      });

    } catch (error) {
      logger.error('Error al crear ejecución presupuestaria:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor al crear la ejecución presupuestaria'
      });
    }
  }
);

/**
 * @route   PUT /api/budget-execution/:id
 * @desc    Actualizar una ejecución presupuestaria existente
 * @access  Private (requiere permiso update:budget)
 */
router.put('/:id',
  authenticateToken,
  authorize('update', 'budget'),
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido'),
    body('budgetName')
      .optional()
      .trim()
      .isLength({ min: 5, max: 255 })
      .withMessage('El nombre de la partida debe tener entre 5 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('assignedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El monto asignado debe ser un número positivo'),
    body('committedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El monto comprometido debe ser un número positivo'),
    body('accruedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El monto devengado debe ser un número positivo'),
    body('paidAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El monto pagado debe ser un número positivo'),
    body('quarter')
      .optional()
      .isInt({ min: 1, max: 4 })
      .withMessage('El trimestre debe estar entre 1 y 4'),
    body('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('El mes debe estar entre 1 y 12'),
    body('responsibleId')
      .optional()
      .isUUID()
      .withMessage('responsibleId debe ser un UUID válido'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive debe ser true o false')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que la ejecución presupuestaria exista
      const existingExecution = await prisma.budgetExecution.findUnique({
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
              }
            }
          }
        }
      });

      if (!existingExecution) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Ejecución presupuestaria no encontrada'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      const activityDepartmentId = existingExecution.activity.product.objective.strategicAxis.departmentId;
      
      if (userRole === 'Director de Área' && activityDepartmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'No tienes permisos para editar esta ejecución presupuestaria'
        });
      }

      const updateData = { ...req.body };

      // Si se están actualizando montos, validar lógica de negocio
      const assigned = parseFloat(updateData.assignedAmount || existingExecution.assignedAmount);
      const committed = parseFloat(updateData.committedAmount || existingExecution.committedAmount);
      const accrued = parseFloat(updateData.accruedAmount || existingExecution.accruedAmount);
      const paid = parseFloat(updateData.paidAmount || existingExecution.paidAmount);

      if (committed > assigned) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'El monto comprometido no puede ser mayor al monto asignado'
        });
      }

      if (accrued > committed) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'El monto devengado no puede ser mayor al monto comprometido'
        });
      }

      if (paid > accrued) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'El monto pagado no puede ser mayor al monto devengado'
        });
      }

      // Calcular porcentajes automáticamente si se actualizaron montos
      const percentages = calculatePercentages({
        assignedAmount: assigned,
        committedAmount: committed,
        accruedAmount: accrued,
        paidAmount: paid
      });

      // Agregar porcentajes calculados a los datos de actualización
      updateData.commitmentPercent = percentages.commitmentPercent;
      updateData.accruedPercent = percentages.accruedPercent;
      updateData.executionPercent = percentages.executionPercent;
      updateData.modifiedById = req.user.id;

      // Actualizar ejecución presupuestaria
      const updatedExecution = await prisma.budgetExecution.update({
        where: { id },
        data: updateData,
        include: {
          activity: {
            include: {
              product: {
                select: { id: true, name: true, code: true }
              }
            }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          responsible: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          modifiedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      logger.info(`Budget execution updated: ${updatedExecution.budgetCode} - ${updatedExecution.budgetName}`, {
        userId: req.user.id,
        budgetExecutionId: id
      });

      res.json({
        success: true,
        data: updatedExecution,
        message: `Ejecución presupuestaria "${updatedExecution.budgetName}" actualizada exitosamente`
      });

    } catch (error) {
      logger.error('Error al actualizar ejecución presupuestaria:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor al actualizar la ejecución presupuestaria'
      });
    }
  }
);

/**
 * @route   DELETE /api/budget-execution/:id
 * @desc    Eliminar una ejecución presupuestaria
 * @access  Private (requiere permiso delete:budget)
 */
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'budget'),
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que la ejecución presupuestaria exista
      const existingExecution = await prisma.budgetExecution.findUnique({
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
              }
            }
          }
        }
      });

      if (!existingExecution) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Ejecución presupuestaria no encontrada'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      const activityDepartmentId = existingExecution.activity.product.objective.strategicAxis.departmentId;
      
      if (userRole === 'Director de Área' && activityDepartmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'No tienes permisos para eliminar esta ejecución presupuestaria'
        });
      }

      // Eliminar ejecución presupuestaria
      await prisma.budgetExecution.delete({
        where: { id }
      });

      logger.info(`Budget execution deleted: ${existingExecution.budgetCode} - ${existingExecution.budgetName}`, {
        userId: req.user.id,
        budgetExecutionId: id
      });

      res.json({
        success: true,
        data: { 
          id,
          budgetCode: existingExecution.budgetCode,
          budgetName: existingExecution.budgetName
        },
        message: `Ejecución presupuestaria "${existingExecution.budgetName}" eliminada exitosamente`
      });

    } catch (error) {
      logger.error('Error al eliminar ejecución presupuestaria:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor al eliminar la ejecución presupuestaria'
      });
    }
  }
);

/**
 * @route   GET /api/budget-execution/activity/:activityId/summary
 * @desc    Obtener resumen de ejecución presupuestaria por actividad
 * @access  Private (requiere permiso read:budget)
 */
router.get('/activity/:activityId/summary',
  authenticateToken,
  authorize('read', 'budget'),
  [
    param('activityId').isUUID().withMessage('activityId debe ser un UUID válido'),
    query('fiscalYear').optional().isInt({ min: 2020, max: 2030 }).withMessage('Año fiscal debe estar entre 2020 y 2030')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { activityId } = req.params;
      const { fiscalYear } = req.query;

      const where = { activityId };
      if (fiscalYear) {
        where.fiscalYear = parseInt(fiscalYear);
      }

      const budgetExecutions = await prisma.budgetExecution.findMany({
        where,
        include: {
          activity: {
            select: { id: true, name: true, code: true }
          }
        },
        orderBy: { budgetCode: 'asc' }
      });

      // Calcular totales
      const summary = budgetExecutions.reduce((acc, execution) => {
        acc.totalAssigned += parseFloat(execution.assignedAmount);
        acc.totalCommitted += parseFloat(execution.committedAmount);
        acc.totalAccrued += parseFloat(execution.accruedAmount);
        acc.totalPaid += parseFloat(execution.paidAmount);
        return acc;
      }, {
        totalAssigned: 0,
        totalCommitted: 0,
        totalAccrued: 0,
        totalPaid: 0
      });

      // Calcular porcentajes generales
      if (summary.totalAssigned > 0) {
        summary.overallCommitmentPercent = Math.round((summary.totalCommitted / summary.totalAssigned) * 100 * 100) / 100;
        summary.overallAccruedPercent = Math.round((summary.totalAccrued / summary.totalAssigned) * 100 * 100) / 100;
        summary.overallExecutionPercent = Math.round((summary.totalPaid / summary.totalAssigned) * 100 * 100) / 100;
      } else {
        summary.overallCommitmentPercent = 0;
        summary.overallAccruedPercent = 0;
        summary.overallExecutionPercent = 0;
      }

      res.json({
        success: true,
        data: {
          activityId,
          fiscalYear: fiscalYear ? parseInt(fiscalYear) : 'Todos los años',
          summary,
          budgetExecutions,
          totalItems: budgetExecutions.length
        },
        message: `Resumen de ejecución presupuestaria para la actividad`
      });

    } catch (error) {
      logger.error('Error al obtener resumen de ejecución presupuestaria:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor al obtener el resumen'
      });
    }
  }
);

module.exports = router;
