const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, query, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware de validación de errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/budget-execution
 * @desc    Obtener todas las ejecuciones presupuestarias
 * @access  Private (requires read:budget permission)
 */
router.get('/',
  authenticateToken,
  authorize('read', 'budget'),
  [
    query('budgetAllocationId').optional().isUUID().withMessage('budgetAllocationId debe ser un UUID válido'),
    query('activityId').optional().isUUID().withMessage('activityId debe ser un UUID válido'),
    query('status').optional().isIn(['PLANNED', 'COMMITTED', 'EXECUTED', 'PAID']).withMessage('status debe ser válido'),
    query('startDate').optional().isISO8601().withMessage('startDate debe ser una fecha válida'),
    query('endDate').optional().isISO8601().withMessage('endDate debe ser una fecha válida'),
    query('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Por ahora devolvemos un array vacío hasta que el modelo esté disponible
      const executions = [];

      res.json(executions);

    } catch (error) {
      logger.error('Error al obtener ejecuciones presupuestarias:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las ejecuciones presupuestarias'
      });
    }
  }
);

/**
 * @route   GET /api/budget-execution/:id
 * @desc    Obtener una ejecución presupuestaria por ID
 * @access  Private (requires read:budget permission)
 */
router.get('/:id',
  authenticateToken,
  authorize('read', 'budget'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const execution = await prisma.budgetExecution.findUnique({
        where: { id },
        include: {
          budgetAllocation: {
            select: {
              id: true,
              amount: true,
              accountCode: true,
              description: true,
              fiscalYear: true
            }
          },
          activity: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      if (!execution) {
        return res.status(404).json({
          error: 'Ejecución presupuestaria no encontrada'
        });
      }

      res.json(execution);

    } catch (error) {
      logger.error('Error al obtener ejecución presupuestaria:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la ejecución presupuestaria'
      });
    }
  }
);

/**
 * @route   POST /api/budget-execution
 * @desc    Crear nueva ejecución presupuestaria
 * @access  Private (requires create:budget permission)
 */
router.post('/',
  authenticateToken,
  authorize('create', 'budget'),
  [
    body('budgetAllocationId').isUUID().withMessage('budgetAllocationId debe ser un UUID válido'),
    body('activityId').optional().isUUID().withMessage('activityId debe ser un UUID válido'),
    body('amount').isFloat({ min: 0 }).withMessage('amount debe ser un número positivo'),
    body('executionDate').isISO8601().withMessage('executionDate debe ser una fecha válida'),
    body('status').isIn(['PLANNED', 'COMMITTED', 'EXECUTED', 'PAID']).withMessage('status debe ser válido'),
    body('description').optional().isString().withMessage('description debe ser un string'),
    body('documentNumber').optional().isString().withMessage('documentNumber debe ser un string'),
    body('supplier').optional().isString().withMessage('supplier debe ser un string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        budgetAllocationId,
        activityId,
        amount,
        executionDate,
        status,
        description,
        documentNumber,
        supplier
      } = req.body;

      // Verificar que la asignación presupuestaria existe
      const budgetAllocation = await prisma.budgetAllocation.findUnique({
        where: { id: budgetAllocationId }
      });

      if (!budgetAllocation) {
        return res.status(404).json({
          error: 'Asignación presupuestaria no encontrada'
        });
      }

      // Verificar que la actividad existe (si se proporciona)
      if (activityId) {
        const activity = await prisma.activity.findUnique({
          where: { id: activityId }
        });

        if (!activity) {
          return res.status(404).json({
            error: 'Actividad no encontrada'
          });
        }
      }

      // Verificar disponibilidad presupuestaria
      const totalExecuted = await prisma.budgetExecution.aggregate({
        where: {
          budgetAllocationId,
          status: {
            in: ['COMMITTED', 'EXECUTED', 'PAID']
          }
        },
        _sum: {
          amount: true
        }
      });

      const executedAmount = totalExecuted._sum.amount || 0;
      const availableAmount = budgetAllocation.amount - executedAmount;

      if (amount > availableAmount) {
        return res.status(400).json({
          error: 'Monto excede disponibilidad presupuestaria',
          details: {
            requestedAmount: amount,
            availableAmount,
            totalBudget: budgetAllocation.amount,
            executedAmount
          }
        });
      }

      const execution = await prisma.budgetExecution.create({
        data: {
          budgetAllocationId,
          activityId,
          amount,
          executionDate: new Date(executionDate),
          status,
          description,
          documentNumber,
          supplier,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          budgetAllocation: {
            select: {
              id: true,
              amount: true,
              accountCode: true,
              description: true,
              fiscalYear: true
            }
          },
          activity: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      logger.info(`Ejecución presupuestaria creada: ${execution.id}`, {
        budgetAllocationId,
        amount,
        status,
        userId: req.user.id
      });

      res.status(201).json(execution);

    } catch (error) {
      logger.error('Error al crear ejecución presupuestaria:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear la ejecución presupuestaria'
      });
    }
  }
);

/**
 * @route   PUT /api/budget-execution/:id
 * @desc    Actualizar ejecución presupuestaria
 * @access  Private (requires update:budget permission)
 */
router.put('/:id',
  authenticateToken,
  authorize('update', 'budget'),
  [
    body('amount').optional().isFloat({ min: 0 }).withMessage('amount debe ser un número positivo'),
    body('executionDate').optional().isISO8601().withMessage('executionDate debe ser una fecha válida'),
    body('status').optional().isIn(['PLANNED', 'COMMITTED', 'EXECUTED', 'PAID']).withMessage('status debe ser válido'),
    body('description').optional().isString().withMessage('description debe ser un string'),
    body('documentNumber').optional().isString().withMessage('documentNumber debe ser un string'),
    body('supplier').optional().isString().withMessage('supplier debe ser un string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Verificar que la ejecución existe
      const existingExecution = await prisma.budgetExecution.findUnique({
        where: { id },
        include: {
          budgetAllocation: true
        }
      });

      if (!existingExecution) {
        return res.status(404).json({
          error: 'Ejecución presupuestaria no encontrada'
        });
      }

      // Si se actualiza el monto, verificar disponibilidad
      if (updates.amount && updates.amount !== existingExecution.amount) {
        const totalExecuted = await prisma.budgetExecution.aggregate({
          where: {
            budgetAllocationId: existingExecution.budgetAllocationId,
            status: {
              in: ['COMMITTED', 'EXECUTED', 'PAID']
            },
            id: {
              not: id // Excluir la ejecución actual
            }
          },
          _sum: {
            amount: true
          }
        });

        const executedAmount = totalExecuted._sum.amount || 0;
        const availableAmount = existingExecution.budgetAllocation.amount - executedAmount;

        if (updates.amount > availableAmount) {
          return res.status(400).json({
            error: 'Monto excede disponibilidad presupuestaria',
            details: {
              requestedAmount: updates.amount,
              availableAmount,
              totalBudget: existingExecution.budgetAllocation.amount,
              executedAmount
            }
          });
        }
      }

      const execution = await prisma.budgetExecution.update({
        where: { id },
        data: {
          ...updates,
          executionDate: updates.executionDate ? new Date(updates.executionDate) : undefined,
          updatedAt: new Date()
        },
        include: {
          budgetAllocation: {
            select: {
              id: true,
              amount: true,
              accountCode: true,
              description: true,
              fiscalYear: true
            }
          },
          activity: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      logger.info(`Ejecución presupuestaria actualizada: ${id}`, {
        updates,
        userId: req.user.id
      });

      res.json(execution);

    } catch (error) {
      logger.error('Error al actualizar ejecución presupuestaria:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar la ejecución presupuestaria'
      });
    }
  }
);

/**
 * @route   DELETE /api/budget-execution/:id
 * @desc    Eliminar ejecución presupuestaria
 * @access  Private (requires delete:budget permission)
 */
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'budget'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const execution = await prisma.budgetExecution.findUnique({
        where: { id }
      });

      if (!execution) {
        return res.status(404).json({
          error: 'Ejecución presupuestaria no encontrada'
        });
      }

      await prisma.budgetExecution.delete({
        where: { id }
      });

      logger.info(`Ejecución presupuestaria eliminada: ${id}`, {
        userId: req.user.id
      });

      res.status(204).send();

    } catch (error) {
      logger.error('Error al eliminar ejecución presupuestaria:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar la ejecución presupuestaria'
      });
    }
  }
);

/**
 * @route   GET /api/budget-execution/summary/:budgetAllocationId
 * @desc    Obtener resumen de ejecución presupuestaria por asignación
 * @access  Private (requires read:budget permission)
 */
router.get('/summary/:budgetAllocationId',
  authenticateToken,
  authorize('read', 'budget'),
  async (req, res) => {
    try {
      const { budgetAllocationId } = req.params;

      const budgetAllocation = await prisma.budgetAllocation.findUnique({
        where: { id: budgetAllocationId }
      });

      if (!budgetAllocation) {
        return res.status(404).json({
          error: 'Asignación presupuestaria no encontrada'
        });
      }

      const executions = await prisma.budgetExecution.findMany({
        where: { budgetAllocationId },
        select: {
          amount: true,
          status: true
        }
      });

      const summary = executions.reduce((acc, execution) => {
        acc.total += execution.amount;
        acc.byStatus[execution.status] = (acc.byStatus[execution.status] || 0) + execution.amount;
        return acc;
      }, {
        total: 0,
        byStatus: {}
      });

      const availableAmount = budgetAllocation.amount - summary.total;
      const executionPercentage = budgetAllocation.amount > 0 
        ? Math.round((summary.total / budgetAllocation.amount) * 100) 
        : 0;

      res.json({
        budgetAllocation: {
          id: budgetAllocation.id,
          amount: budgetAllocation.amount,
          accountCode: budgetAllocation.accountCode,
          description: budgetAllocation.description
        },
        execution: {
          totalExecuted: summary.total,
          availableAmount,
          executionPercentage,
          byStatus: summary.byStatus
        },
        executionCount: executions.length
      });

    } catch (error) {
      logger.error('Error al obtener resumen de ejecución presupuestaria:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el resumen de ejecución'
      });
    }
  }
);

module.exports = router;
