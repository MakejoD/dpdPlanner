const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Validaciones
const validateProcurementProcess = [
  body('cuciCode')
    .notEmpty()
    .withMessage('El código CUCI es requerido')
    .isLength({ max: 50 })
    .withMessage('El código CUCI no puede exceder 50 caracteres'),
    
  body('description')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
    
  body('measurementUnit')
    .notEmpty()
    .withMessage('La unidad de medida es requerida')
    .isIn(['Unidad', 'Servicio', 'Global', 'Quintal', 'Metro', 'Litro', 'Kilogramo', 'Otro'])
    .withMessage('Unidad de medida no válida'),
    
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('La cantidad debe ser mayor a 0'),
    
  body('unitCost')
    .isFloat({ min: 0.01 })
    .withMessage('El costo unitario debe ser mayor a 0'),
    
  body('procurementMethod')
    .notEmpty()
    .withMessage('La modalidad de compra es requerida')
    .isIn(['Licitación Pública', 'Comparación de Precios', 'Compras Menores', 'Sorteo de Obras', 'Contratación Directa', 'Subasta Inversa'])
    .withMessage('Modalidad de compra no válida'),
    
  body('fundingSource')
    .notEmpty()
    .withMessage('La fuente de financiamiento es requerida')
    .isIn(['Fondos Propios', 'Préstamo Externo', 'Donación', 'Fondos del Tesoro Nacional'])
    .withMessage('Fuente de financiamiento no válida'),
    
  body('fiscalYear')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Año fiscal no válido'),
    
  body('status')
    .optional()
    .isIn(['PLANIFICADO', 'EN_PROCESO', 'ADJUDICADO', 'DESIERTO', 'CANCELADO'])
    .withMessage('Estado no válido')
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
 * @route   GET /api/procurement-processes
 * @desc    Obtener lista de procesos de compra con filtros
 * @access  Private (read:procurement_process)
 */
router.get('/', 
  auth, 
  authorize('read', 'procurement_process'), 
  async (req, res) => {
    try {
      const { 
        fiscalYear, 
        status, 
        departmentId, 
        procurementMethod,
        page = 1, 
        limit = 50,
        search,
        includeLinks = false
      } = req.query;

      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      // Construir filtros
      const where = {};
      
      if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
      if (status) where.status = status;
      if (procurementMethod) where.procurementMethod = procurementMethod;
      
      // Filtros por departamento según el rol
      if (userRole === 'Director de Área' && userDeptId) {
        where.departmentId = userDeptId;
      } else if (departmentId && ['Administrador', 'Director de Planificación', 'Director de Compras y Contrataciones'].includes(userRole)) {
        where.departmentId = departmentId;
      }

      // Filtro de búsqueda
      if (search) {
        where.OR = [
          { cuciCode: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { supplierName: { contains: search, mode: 'insensitive' } },
          { contractNumber: { contains: search, mode: 'insensitive' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [processes, total] = await Promise.all([
        prisma.procurementProcess.findMany({
          where,
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            lastModifiedBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            department: {
              select: { id: true, name: true, code: true }
            },
            ...(includeLinks === 'true' && {
              activityLinks: {
                include: {
                  activity: {
                    select: { 
                      id: true, 
                      name: true, 
                      code: true,
                      product: {
                        select: { name: true, code: true }
                      }
                    }
                  }
                }
              }
            })
          },
          orderBy: [
            { fiscalYear: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: parseInt(limit)
        }),
        prisma.procurementProcess.count({ where })
      ]);

      // Calcular estadísticas
      const stats = await prisma.procurementProcess.groupBy({
        by: ['status'],
        where: userRole === 'Director de Área' && userDeptId ? { departmentId: userDeptId } : {},
        _count: { status: true },
        _sum: { totalCost: true }
      });

      const formattedStats = {
        totalProcesses: total,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: stat._count.status,
            totalAmount: stat._sum.totalCost || 0
          };
          return acc;
        }, {}),
        totalAmount: stats.reduce((sum, stat) => sum + (stat._sum.totalCost || 0), 0)
      };

      res.json({
        success: true,
        data: {
          processes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          stats: formattedStats
        }
      });

    } catch (error) {
      logger.error('Error al obtener procesos de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/procurement-processes/:id
 * @desc    Obtener proceso de compra por ID
 * @access  Private (read:procurement_process)
 */
router.get('/:id', 
  auth, 
  authorize('read', 'procurement_process'),
  param('id').isUUID().withMessage('ID inválido'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      const process = await prisma.procurementProcess.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          lastModifiedBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          activityLinks: {
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
              linkedBy: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      if (!process) {
        return res.status(404).json({
          success: false,
          message: 'Proceso de compra no encontrado'
        });
      }

      // Verificar permisos de acceso por departamento
      if (userRole === 'Director de Área' && process.departmentId !== userDeptId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este proceso de compra'
        });
      }

      res.json({
        success: true,
        data: process
      });

    } catch (error) {
      logger.error('Error al obtener proceso de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/procurement-processes
 * @desc    Crear nuevo proceso de compra
 * @access  Private (create:procurement_process)
 */
router.post('/', 
  auth, 
  authorize('create', 'procurement_process'),
  validateProcurementProcess,
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        cuciCode,
        description,
        measurementUnit,
        quantity,
        unitCost,
        procurementMethod,
        fundingSource,
        plannedStartDate,
        plannedAwardDate,
        fiscalYear,
        notes,
        departmentId
      } = req.body;

      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      // Calcular costo total
      const totalCost = parseFloat(quantity) * parseFloat(unitCost);

      // Determinar departamento
      let finalDepartmentId = departmentId;
      if (userRole === 'Director de Área' || userRole === 'Analista de Compras') {
        finalDepartmentId = userDeptId; // Solo puede crear para su departamento
      }

      // Verificar que el código CUCI no esté duplicado en el mismo año fiscal
      const existingProcess = await prisma.procurementProcess.findFirst({
        where: {
          cuciCode,
          fiscalYear,
          departmentId: finalDepartmentId
        }
      });

      if (existingProcess) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un proceso con este código CUCI en el año fiscal y departamento especificado'
        });
      }

      const newProcess = await prisma.procurementProcess.create({
        data: {
          cuciCode,
          description,
          measurementUnit,
          quantity,
          unitCost,
          totalCost,
          procurementMethod,
          fundingSource,
          plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
          plannedAwardDate: plannedAwardDate ? new Date(plannedAwardDate) : null,
          fiscalYear,
          notes,
          departmentId: finalDepartmentId,
          createdById: req.user.id
        },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          }
        }
      });

      logger.info(`Proceso de compra creado: ${cuciCode} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Proceso de compra creado exitosamente',
        data: newProcess
      });

    } catch (error) {
      logger.error('Error al crear proceso de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/procurement-processes/:id
 * @desc    Actualizar proceso de compra
 * @access  Private (update:procurement_process)
 */
router.put('/:id', 
  auth, 
  authorize('update', 'procurement_process'),
  param('id').isUUID().withMessage('ID inválido'),
  validateProcurementProcess,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        cuciCode,
        description,
        measurementUnit,
        quantity,
        unitCost,
        procurementMethod,
        fundingSource,
        plannedStartDate,
        plannedAwardDate,
        actualStartDate,
        actualAwardDate,
        status,
        notes,
        contractNumber,
        supplierName,
        awardedAmount
      } = req.body;

      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      // Verificar que el proceso existe
      const existingProcess = await prisma.procurementProcess.findUnique({
        where: { id }
      });

      if (!existingProcess) {
        return res.status(404).json({
          success: false,
          message: 'Proceso de compra no encontrado'
        });
      }

      // Verificar permisos por departamento
      if (userRole === 'Director de Área' && existingProcess.departmentId !== userDeptId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este proceso de compra'
        });
      }

      // Calcular nuevo costo total si cambió cantidad o costo unitario
      const newQuantity = quantity !== undefined ? quantity : existingProcess.quantity;
      const newUnitCost = unitCost !== undefined ? unitCost : existingProcess.unitCost;
      const totalCost = parseFloat(newQuantity) * parseFloat(newUnitCost);

      // Verificar duplicado de código CUCI si cambió
      if (cuciCode && cuciCode !== existingProcess.cuciCode) {
        const duplicateProcess = await prisma.procurementProcess.findFirst({
          where: {
            cuciCode,
            fiscalYear: existingProcess.fiscalYear,
            departmentId: existingProcess.departmentId,
            NOT: { id }
          }
        });

        if (duplicateProcess) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un proceso con este código CUCI en el año fiscal y departamento especificado'
          });
        }
      }

      const updatedProcess = await prisma.procurementProcess.update({
        where: { id },
        data: {
          ...(cuciCode !== undefined && { cuciCode }),
          ...(description !== undefined && { description }),
          ...(measurementUnit !== undefined && { measurementUnit }),
          ...(quantity !== undefined && { quantity }),
          ...(unitCost !== undefined && { unitCost }),
          totalCost,
          ...(procurementMethod !== undefined && { procurementMethod }),
          ...(fundingSource !== undefined && { fundingSource }),
          ...(plannedStartDate !== undefined && { 
            plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null 
          }),
          ...(plannedAwardDate !== undefined && { 
            plannedAwardDate: plannedAwardDate ? new Date(plannedAwardDate) : null 
          }),
          ...(actualStartDate !== undefined && { 
            actualStartDate: actualStartDate ? new Date(actualStartDate) : null 
          }),
          ...(actualAwardDate !== undefined && { 
            actualAwardDate: actualAwardDate ? new Date(actualAwardDate) : null 
          }),
          ...(status !== undefined && { status }),
          ...(notes !== undefined && { notes }),
          ...(contractNumber !== undefined && { contractNumber }),
          ...(supplierName !== undefined && { supplierName }),
          ...(awardedAmount !== undefined && { awardedAmount }),
          lastModifiedById: req.user.id
        },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          lastModifiedBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          }
        }
      });

      logger.info(`Proceso de compra actualizado: ${updatedProcess.cuciCode} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Proceso de compra actualizado exitosamente',
        data: updatedProcess
      });

    } catch (error) {
      logger.error('Error al actualizar proceso de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/procurement-processes/:id
 * @desc    Eliminar proceso de compra
 * @access  Private (delete:procurement_process)
 */
router.delete('/:id', 
  auth, 
  authorize('delete', 'procurement_process'),
  param('id').isUUID().withMessage('ID inválido'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role.name;
      const userDeptId = req.user.departmentId;

      const existingProcess = await prisma.procurementProcess.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              activityLinks: true
            }
          }
        }
      });

      if (!existingProcess) {
        return res.status(404).json({
          success: false,
          message: 'Proceso de compra no encontrado'
        });
      }

      // Verificar permisos por departamento
      if (userRole === 'Director de Área' && existingProcess.departmentId !== userDeptId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este proceso de compra'
        });
      }

      // No permitir eliminar si tiene vínculos con actividades
      if (existingProcess._count.activityLinks > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar el proceso porque está vinculado a ${existingProcess._count.activityLinks} actividad(es) del POA`
        });
      }

      // No permitir eliminar si el estado no es PLANIFICADO
      if (existingProcess.status !== 'PLANIFICADO') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar procesos en estado PLANIFICADO'
        });
      }

      await prisma.procurementProcess.delete({
        where: { id }
      });

      logger.info(`Proceso de compra eliminado: ${existingProcess.cuciCode} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Proceso de compra eliminado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar proceso de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

module.exports = router;
