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
 * @route   GET /api/activities
 * @desc    Obtener todas las actividades con filtros opcionales
 * @access  Private (requires read:activity permission)
 */
router.get('/',
  authenticateToken,
  authorize('read', 'activity'),
  [
    query('productId').optional().isUUID().withMessage('productId debe ser un UUID válido'),
    query('objectiveId').optional().isUUID().withMessage('objectiveId debe ser un UUID válido'),
    query('responsibleId').optional().isUUID().withMessage('responsibleId debe ser un UUID válido'),
    query('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('status debe ser válido'),
    query('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano'),
    query('startDate').optional().isISO8601().withMessage('startDate debe ser una fecha válida'),
    query('endDate').optional().isISO8601().withMessage('endDate debe ser una fecha válida')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { 
        productId, 
        objectiveId, 
        responsibleId, 
        status, 
        isActive,
        startDate,
        endDate,
        page = 1,
        limit = 50 
      } = req.query;

      // Construir filtros
      const where = {};
      
      if (productId) {
        where.productId = productId;
      }
      
      if (objectiveId) {
        where.product = {
          objectiveId: objectiveId
        };
      }
      
      if (responsibleId) {
        where.assignments = {
          some: {
            userId: responsibleId
          }
        };
      }
      
      if (status) {
        where.assignments = {
          some: {
            status: status
          }
        };
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      
      if (startDate || endDate) {
        where.startDate = {};
        if (startDate) where.startDate.gte = new Date(startDate);
        if (endDate) where.startDate.lte = new Date(endDate);
      }

      // Paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [activities, total] = await Promise.all([
        prisma.activity.findMany({
          where,
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
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            },
            indicators: {
              select: {
                id: true,
                name: true,
                type: true,
                measurementUnit: true
              }
            },
            _count: {
              select: {
                indicators: true,
                assignments: true,
                budgetExecutions: true
              }
            }
          },
          orderBy: [
            { order: 'asc' },
            { createdAt: 'desc' }
          ],
          skip,
          take
        }),
        prisma.activity.count({ where })
      ]);

      res.json({
        data: activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      logger.error('Error al obtener actividades:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las actividades'
      });
    }
  }
);

/**
 * @route   GET /api/activities/:id
 * @desc    Obtener una actividad específica
 * @access  Private (requires read:activity permission)
 */
router.get('/:id',
  authenticateToken,
  authorize('read', 'activity'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const activity = await prisma.activity.findUnique({
        where: { id },
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
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          indicators: true,
          budgetExecutions: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          _count: {
            select: {
              indicators: true,
              assignments: true,
              budgetExecutions: true
            }
          }
        }
      });

      if (!activity) {
        return res.status(404).json({
          error: 'Actividad no encontrada',
          message: 'La actividad especificada no existe'
        });
      }

      res.json(activity);

    } catch (error) {
      logger.error('Error al obtener actividad:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo obtener la actividad'
      });
    }
  }
);

/**
 * @route   POST /api/activities
 * @desc    Crear una nueva actividad
 * @access  Private (requires create:activity permission)
 */
router.post('/',
  authenticateToken,
  authorize('create', 'activity'),
  [
    body('name')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('El nombre debe tener entre 3 y 200 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no debe exceder 1000 caracteres'),
    body('code')
      .trim()
      .matches(/^ACT-\d{3}-\d{2}-\d{2}$/)
      .withMessage('El código debe tener el formato ACT-XXX-XX-XX'),
    body('productId')
      .isUUID()
      .withMessage('productId debe ser un UUID válido'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate debe ser una fecha válida'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate debe ser una fecha válida'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('order debe ser un número entero no negativo'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive debe ser un booleano')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, code, productId, startDate, endDate, order = 0, isActive = true } = req.body;

      // Verificar que el producto existe
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: 'El producto especificado no existe'
        });
      }

      // Verificar que el código sea único dentro del producto
      const existingActivity = await prisma.activity.findFirst({
        where: {
          productId,
          code
        }
      });

      if (existingActivity) {
        return res.status(409).json({
          error: 'Código duplicado',
          message: 'Ya existe una actividad con este código en el producto seleccionado'
        });
      }

      // Validar fechas
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({
          error: 'Fechas inválidas',
          message: 'La fecha de inicio no puede ser posterior a la fecha de fin'
        });
      }

      const activity = await prisma.activity.create({
        data: {
          name,
          description,
          code,
          productId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          order,
          isActive
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
          },
          _count: {
            select: {
              indicators: true,
              assignments: true,
              budgetExecutions: true
            }
          }
        }
      });

      logger.info(`Actividad creada: ${activity.code} - ${activity.name}`);

      res.status(201).json({
        message: 'Actividad creada exitosamente',
        data: activity
      });

    } catch (error) {
      logger.error('Error al crear actividad:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear la actividad'
      });
    }
  }
);

/**
 * @route   PUT /api/activities/:id
 * @desc    Actualizar una actividad existente
 * @access  Private (requires update:activity permission)
 */
router.put('/:id',
  authenticateToken,
  authorize('update', 'activity'),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('El nombre debe tener entre 3 y 200 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no debe exceder 1000 caracteres'),
    body('code')
      .optional()
      .trim()
      .matches(/^ACT-\d{3}-\d{2}-\d{2}$/)
      .withMessage('El código debe tener el formato ACT-XXX-XX-XX'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('startDate debe ser una fecha válida'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('endDate debe ser una fecha válida'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('order debe ser un número entero no negativo'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive debe ser un booleano')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, code, startDate, endDate, order, isActive } = req.body;

      // Verificar que la actividad existe
      const existingActivity = await prisma.activity.findUnique({
        where: { id }
      });

      if (!existingActivity) {
        return res.status(404).json({
          error: 'Actividad no encontrada',
          message: 'La actividad especificada no existe'
        });
      }

      // Si se actualiza el código, verificar que sea único
      if (code && code !== existingActivity.code) {
        const duplicateActivity = await prisma.activity.findFirst({
          where: {
            productId: existingActivity.productId,
            code,
            id: { not: id }
          }
        });

        if (duplicateActivity) {
          return res.status(409).json({
            error: 'Código duplicado',
            message: 'Ya existe otra actividad con este código en el producto'
          });
        }
      }

      // Validar fechas
      const newStartDate = startDate ? new Date(startDate) : existingActivity.startDate;
      const newEndDate = endDate ? new Date(endDate) : existingActivity.endDate;
      
      if (newStartDate && newEndDate && newStartDate > newEndDate) {
        return res.status(400).json({
          error: 'Fechas inválidas',
          message: 'La fecha de inicio no puede ser posterior a la fecha de fin'
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (code !== undefined) updateData.code = code;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      if (order !== undefined) updateData.order = order;
      if (isActive !== undefined) updateData.isActive = isActive;

      const activity = await prisma.activity.update({
        where: { id },
        data: updateData,
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
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              indicators: true,
              assignments: true,
              budgetExecutions: true
            }
          }
        }
      });

      logger.info(`Actividad actualizada: ${activity.code} - ${activity.name}`);

      res.json({
        message: 'Actividad actualizada exitosamente',
        data: activity
      });

    } catch (error) {
      logger.error('Error al actualizar actividad:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar la actividad'
      });
    }
  }
);

/**
 * @route   DELETE /api/activities/:id
 * @desc    Eliminar una actividad
 * @access  Private (requires delete:activity permission)
 */
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'activity'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que la actividad existe
      const activity = await prisma.activity.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              indicators: true,
              assignments: true,
              budgetExecutions: true
            }
          }
        }
      });

      if (!activity) {
        return res.status(404).json({
          error: 'Actividad no encontrada',
          message: 'La actividad especificada no existe'
        });
      }

      // Verificar dependencias
      const totalDependencies = activity._count.indicators + 
                               activity._count.assignments + 
                               activity._count.budgetExecutions;

      if (totalDependencies > 0) {
        return res.status(409).json({
          error: 'No se puede eliminar',
          message: 'La actividad tiene dependencias (indicadores, asignaciones o ejecuciones presupuestarias)',
          dependencies: {
            indicators: activity._count.indicators,
            assignments: activity._count.assignments,
            budgetExecutions: activity._count.budgetExecutions
          }
        });
      }

      await prisma.activity.delete({
        where: { id }
      });

      logger.info(`Actividad eliminada: ${activity.code} - ${activity.name}`);

      res.json({
        message: 'Actividad eliminada exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar actividad:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar la actividad'
      });
    }
  }
);

/**
 * @route   POST /api/activities/:id/assign
 * @desc    Asignar usuario a una actividad
 * @access  Private (requires update:activity permission)
 */
router.post('/:id/assign',
  authenticateToken,
  authorize('update', 'activity'),
  [
    body('userId')
      .isUUID()
      .withMessage('userId debe ser un UUID válido'),
    body('role')
      .optional()
      .isIn(['RESPONSIBLE', 'COLLABORATOR', 'SUPERVISOR'])
      .withMessage('role debe ser RESPONSIBLE, COLLABORATOR o SUPERVISOR'),
    body('status')
      .optional()
      .isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .withMessage('status debe ser válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, role = 'COLLABORATOR', status = 'NOT_STARTED' } = req.body;

      // Verificar que la actividad existe
      const activity = await prisma.activity.findUnique({
        where: { id }
      });

      if (!activity) {
        return res.status(404).json({
          error: 'Actividad no encontrada',
          message: 'La actividad especificada no existe'
        });
      }

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario especificado no existe'
        });
      }

      // Verificar si ya existe la asignación
      const existingAssignment = await prisma.activityAssignment.findFirst({
        where: {
          activityId: id,
          userId
        }
      });

      if (existingAssignment) {
        return res.status(409).json({
          error: 'Asignación duplicada',
          message: 'El usuario ya está asignado a esta actividad'
        });
      }

      const assignment = await prisma.activityAssignment.create({
        data: {
          activityId: id,
          userId,
          role,
          status,
          assignedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      logger.info(`Usuario asignado a actividad: ${user.email} -> ${activity.code}`);

      res.status(201).json({
        message: 'Usuario asignado exitosamente',
        data: assignment
      });

    } catch (error) {
      logger.error('Error al asignar usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo asignar el usuario'
      });
    }
  }
);

module.exports = router;
