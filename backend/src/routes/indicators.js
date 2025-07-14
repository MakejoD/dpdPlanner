const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { body, validationResult, param, query } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// ========== VALIDATION RULES ==========

const indicatorValidation = [
  body('name')
    .notEmpty()
    .withMessage('El nombre del indicador es requerido')
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
  
  body('type')
    .notEmpty()
    .withMessage('El tipo de indicador es requerido')
    .isIn(['PRODUCT', 'RESULT'])
    .withMessage('El tipo debe ser PRODUCT o RESULT'),
  
  body('measurementUnit')
    .notEmpty()
    .withMessage('La unidad de medida es requerida')
    .isLength({ max: 100 })
    .withMessage('La unidad de medida no puede exceder 100 caracteres'),
  
  body('annualTarget')
    .isFloat({ min: 0 })
    .withMessage('La meta anual debe ser un número positivo'),
  
  body('baseline')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La línea base debe ser un número positivo'),
  
  body('q1Target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta Q1 debe ser un número positivo'),
  
  body('q2Target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta Q2 debe ser un número positivo'),
  
  body('q3Target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta Q3 debe ser un número positivo'),
  
  body('q4Target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta Q4 debe ser un número positivo'),
  
  body('reportingFrequency')
    .optional()
    .isIn(['QUARTERLY', 'MONTHLY'])
    .withMessage('La frecuencia de reporte debe ser QUARTERLY o MONTHLY'),
  
  // Monthly targets validation (optional)
  body('jan_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de enero debe ser un número positivo'),
  
  body('feb_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de febrero debe ser un número positivo'),
  
  body('mar_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de marzo debe ser un número positivo'),
  
  body('apr_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de abril debe ser un número positivo'),
  
  body('may_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de mayo debe ser un número positivo'),
  
  body('jun_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de junio debe ser un número positivo'),
  
  body('jul_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de julio debe ser un número positivo'),
  
  body('aug_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de agosto debe ser un número positivo'),
  
  body('sep_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de septiembre debe ser un número positivo'),
  
  body('oct_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de octubre debe ser un número positivo'),
  
  body('nov_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de noviembre debe ser un número positivo'),
  
  body('dec_target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta de diciembre debe ser un número positivo'),
  
  // Validar que al menos uno de los niveles esté especificado
  body()
    .custom((value) => {
      const { strategicAxisId, objectiveId, productId, activityId } = value;
      if (!strategicAxisId && !objectiveId && !productId && !activityId) {
        throw new Error('Debe especificar al menos un nivel de vinculación (Eje, Objetivo, Producto o Actividad)');
      }
      return true;
    })
];

// ========== ROUTES ==========

// GET /api/indicators - Obtener todos los indicadores con filtros
router.get('/', 
  auth, 
  authorize('read', 'indicator'),
  [
    query('strategicAxisId').optional().isUUID().withMessage('ID de eje estratégico inválido'),
    query('objectiveId').optional().isUUID().withMessage('ID de objetivo inválido'),
    query('productId').optional().isUUID().withMessage('ID de producto inválido'),
    query('activityId').optional().isUUID().withMessage('ID de actividad inválido'),
    query('type').optional().isIn(['PRODUCT', 'RESULT']).withMessage('Tipo inválido'),
    query('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano'),
    query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { 
        strategicAxisId, 
        objectiveId, 
        productId, 
        activityId,
        type,
        isActive = true,
        page = 1, 
        limit = 10,
        search 
      } = req.query;

      // Construir filtros
      const where = {
        isActive: isActive === 'true',
        ...(strategicAxisId && { strategicAxisId }),
        ...(objectiveId && { objectiveId }),
        ...(productId && { productId }),
        ...(activityId && { activityId }),
        ...(type && { type }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      // Calcular paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Obtener indicadores con relaciones
      const [indicators, totalCount] = await Promise.all([
        prisma.indicator.findMany({
          where,
          skip,
          take,
          include: {
            strategicAxis: {
              select: { id: true, name: true, code: true }
            },
            objective: {
              select: { id: true, name: true, code: true }
            },
            product: {
              select: { id: true, name: true, code: true }
            },
            activity: {
              select: { id: true, name: true, code: true }
            },
            progressReports: {
              select: { 
                id: true, 
                periodType: true, 
                period: true, 
                currentValue: true,
                targetValue: true,
                executionPercentage: true,
                status: true 
              },
              orderBy: { createdAt: 'desc' },
              take: 5
            },
            _count: {
              select: { progressReports: true }
            }
          },
          orderBy: [
            { createdAt: 'desc' }
          ]
        }),
        prisma.indicator.count({ where })
      ]);

      // Calcular estadísticas de avance para cada indicador
      const indicatorsWithProgress = await Promise.all(
        indicators.map(async (indicator) => {
          const currentYear = new Date().getFullYear();
          const progressData = await prisma.progressReport.findMany({
            where: {
              indicatorId: indicator.id,
              status: 'aprobado',
              period: {
                startsWith: currentYear.toString()
              }
            },
            select: {
              currentValue: true,
              periodType: true,
              period: true
            }
          });

          // Calcular progreso acumulado
          const totalAchieved = progressData.reduce((sum, report) => sum + report.currentValue, 0);
          const progressPercent = indicator.annualTarget > 0 
            ? Math.min((totalAchieved / indicator.annualTarget) * 100, 100)
            : 0;

          return {
            ...indicator,
            currentProgress: {
              totalAchieved,
              progressPercent: Math.round(progressPercent * 100) / 100,
              reportsCount: progressData.length
            }
          };
        })
      );

      const totalPages = Math.ceil(totalCount / take);

      res.json({
        success: true,
        data: {
          indicators: indicatorsWithProgress,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        },
        message: `${indicatorsWithProgress.length} indicadores encontrados`
      });

    } catch (error) {
      console.error('Error al obtener indicadores:', error);
      res.status(500).json({ 
        success: false,
        data: null,
        message: 'Error interno del servidor al obtener indicadores'
      });
    }
  }
);

// GET /api/indicators/:id - Obtener un indicador específico
router.get('/:id',
  auth,
  authorize('read', 'indicator'),
  [param('id').isUUID().withMessage('ID de indicador inválido')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { id } = req.params;

      const indicator = await prisma.indicator.findUnique({
        where: { id },
        include: {
          strategicAxis: {
            select: { id: true, name: true, code: true, year: true }
          },
          objective: {
            select: { id: true, name: true, code: true }
          },
          product: {
            select: { id: true, name: true, code: true, type: true }
          },
          activity: {
            select: { id: true, name: true, code: true, startDate: true, endDate: true }
          },
          progressReports: {
            include: {
              reportedBy: {
                select: { id: true, firstName: true, lastName: true, email: true }
              },
              approvedBy: {
                select: { id: true, firstName: true, lastName: true, email: true }
              },
              attachments: {
                select: { id: true, fileName: true, originalName: true, fileSize: true, mimeType: true, uploadedAt: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!indicator) {
        return res.status(404).json({ message: 'Indicador no encontrado' });
      }

      // Calcular estadísticas de progreso
      const currentYear = new Date().getFullYear();
      const yearlyReports = indicator.progressReports.filter(r => r.year === currentYear);
      const approvedReports = yearlyReports.filter(r => r.status === 'APPROVED');
      
      const progressStats = {
        totalReports: yearlyReports.length,
        approvedReports: approvedReports.length,
        pendingReports: yearlyReports.filter(r => r.status === 'SUBMITTED').length,
        rejectedReports: yearlyReports.filter(r => r.status === 'REJECTED').length,
        totalAchieved: approvedReports.reduce((sum, r) => sum + r.currentValue, 0),
        progressPercent: 0
      };

      progressStats.progressPercent = indicator.annualTarget > 0 
        ? Math.min((progressStats.totalAchieved / indicator.annualTarget) * 100, 100)
        : 0;

      res.json({
        success: true,
        data: {
          ...indicator,
          progressStats
        },
        message: 'Indicador encontrado'
      });

    } catch (error) {
      console.error('Error al obtener indicador:', error);
      res.status(500).json({ 
        success: false,
        data: null,
        message: 'Error interno del servidor al obtener el indicador'
      });
    }
  }
);

// POST /api/indicators - Crear nuevo indicador
router.post('/',
  auth,
  authorize('create', 'indicator'),
  indicatorValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        type,
        measurementUnit,
        baseline = 0,
        annualTarget,
        reportingFrequency = 'QUARTERLY',
        q1Target = 0,
        q2Target = 0,
        q3Target = 0,
        q4Target = 0,
        jan_target = 0,
        feb_target = 0,
        mar_target = 0,
        apr_target = 0,
        may_target = 0,
        jun_target = 0,
        jul_target = 0,
        aug_target = 0,
        sep_target = 0,
        oct_target = 0,
        nov_target = 0,
        dec_target = 0,
        strategicAxisId,
        objectiveId,
        productId,
        activityId
      } = req.body;

      // Validar que el nivel padre existe
      if (strategicAxisId) {
        const exists = await prisma.strategicAxis.findUnique({ where: { id: strategicAxisId } });
        if (!exists) {
          return res.status(400).json({ message: 'El eje estratégico especificado no existe' });
        }
      }

      if (objectiveId) {
        const exists = await prisma.objective.findUnique({ where: { id: objectiveId } });
        if (!exists) {
          return res.status(400).json({ message: 'El objetivo especificado no existe' });
        }
      }

      if (productId) {
        const exists = await prisma.product.findUnique({ where: { id: productId } });
        if (!exists) {
          return res.status(400).json({ message: 'El producto especificado no existe' });
        }
      }

      if (activityId) {
        const exists = await prisma.activity.findUnique({ where: { id: activityId } });
        if (!exists) {
          return res.status(400).json({ message: 'La actividad especificada no existe' });
        }
      }

      // Crear indicador
      const indicator = await prisma.indicator.create({
        data: {
          name,
          description,
          type,
          measurementUnit,
          baseline,
          annualTarget,
          reportingFrequency: reportingFrequency || 'QUARTERLY',
          q1Target,
          q2Target,
          q3Target,
          q4Target,
          jan_target,
          feb_target,
          mar_target,
          apr_target,
          may_target,
          jun_target,
          jul_target,
          aug_target,
          sep_target,
          oct_target,
          nov_target,
          dec_target,
          strategicAxisId,
          objectiveId,
          productId,
          activityId
        },
        include: {
          strategicAxis: {
            select: { id: true, name: true, code: true }
          },
          objective: {
            select: { id: true, name: true, code: true }
          },
          product: {
            select: { id: true, name: true, code: true }
          },
          activity: {
            select: { id: true, name: true, code: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: indicator,
        message: `Indicador "${indicator.name}" creado exitosamente`
      });

    } catch (error) {
      console.error('Error al crear indicador:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          message: 'Ya existe un indicador con esos datos' 
        });
      }

      res.status(500).json({ 
        message: 'Error interno del servidor al crear el indicador',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// PUT /api/indicators/:id - Actualizar indicador
router.put('/:id',
  auth,
  authorize('update', 'indicator'),
  [param('id').isUUID().withMessage('ID de indicador inválido')],
  indicatorValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const {
        name,
        description,
        type,
        measurementUnit,
        baseline,
        annualTarget,
        reportingFrequency,
        q1Target,
        q2Target,
        q3Target,
        q4Target,
        jan_target,
        feb_target,
        mar_target,
        apr_target,
        may_target,
        jun_target,
        jul_target,
        aug_target,
        sep_target,
        oct_target,
        nov_target,
        dec_target,
        strategicAxisId,
        objectiveId,
        productId,
        activityId,
        isActive
      } = req.body;

      // Verificar que el indicador existe
      const existingIndicator = await prisma.indicator.findUnique({
        where: { id }
      });

      if (!existingIndicator) {
        return res.status(404).json({ message: 'Indicador no encontrado' });
      }

      // Validar que los niveles padre existen (si se especifican)
      if (strategicAxisId) {
        const exists = await prisma.strategicAxis.findUnique({ where: { id: strategicAxisId } });
        if (!exists) {
          return res.status(400).json({ message: 'El eje estratégico especificado no existe' });
        }
      }

      if (objectiveId) {
        const exists = await prisma.objective.findUnique({ where: { id: objectiveId } });
        if (!exists) {
          return res.status(400).json({ message: 'El objetivo especificado no existe' });
        }
      }

      if (productId) {
        const exists = await prisma.product.findUnique({ where: { id: productId } });
        if (!exists) {
          return res.status(400).json({ message: 'El producto especificado no existe' });
        }
      }

      if (activityId) {
        const exists = await prisma.activity.findUnique({ where: { id: activityId } });
        if (!exists) {
          return res.status(400).json({ message: 'La actividad especificada no existe' });
        }
      }

      // Actualizar indicador
      const updatedIndicator = await prisma.indicator.update({
        where: { id },
        data: {
          name,
          description,
          type,
          measurementUnit,
          baseline,
          annualTarget,
          reportingFrequency,
          q1Target,
          q2Target,
          q3Target,
          q4Target,
          jan_target,
          feb_target,
          mar_target,
          apr_target,
          may_target,
          jun_target,
          jul_target,
          aug_target,
          sep_target,
          oct_target,
          nov_target,
          dec_target,
          strategicAxisId,
          objectiveId,
          productId,
          activityId,
          isActive
        },
        include: {
          strategicAxis: {
            select: { id: true, name: true, code: true }
          },
          objective: {
            select: { id: true, name: true, code: true }
          },
          product: {
            select: { id: true, name: true, code: true }
          },
          activity: {
            select: { id: true, name: true, code: true }
          }
        }
      });

      res.json({
        success: true,
        data: updatedIndicator,
        message: `Indicador "${updatedIndicator.name}" actualizado exitosamente`
      });

    } catch (error) {
      console.error('Error al actualizar indicador:', error);
      res.status(500).json({ 
        success: false,
        data: null,
        message: 'Error interno del servidor al actualizar el indicador'
      });
    }
  }
);

// DELETE /api/indicators/:id - Eliminar indicador
router.delete('/:id',
  auth,
  authorize('delete', 'indicator'),
  [param('id').isUUID().withMessage('ID de indicador inválido')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { id } = req.params;

      // Verificar que el indicador existe y obtener conteos
      const indicator = await prisma.indicator.findUnique({
        where: { id },
        include: {
          _count: {
            select: { progressReports: true }
          }
        }
      });

      if (!indicator) {
        return res.status(404).json({ 
          success: false,
          data: null,
          message: 'Indicador no encontrado' 
        });
      }

      // Verificar si tiene reportes de progreso
      if (indicator._count.progressReports > 0) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `No se puede eliminar el indicador porque tiene ${indicator._count.progressReports} reporte(s) de progreso asociado(s)`
        });
      }

      // Eliminar indicador
      await prisma.indicator.delete({
        where: { id }
      });

      res.json({
        success: true,
        data: { id },
        message: 'Indicador eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar indicador:', error);
      res.status(500).json({ 
        success: false,
        data: null,
        message: 'Error interno del servidor al eliminar el indicador'
      });
    }
  }
);

// GET /api/indicators/levels/options - Obtener opciones para vincular indicadores
router.get('/levels/options',
  auth,
  authorize('read', 'indicator'),
  async (req, res) => {
    try {
      const { year = new Date().getFullYear() } = req.query;

      const [strategicAxes, objectives, products, activities] = await Promise.all([
        prisma.strategicAxis.findMany({
          where: { 
            isActive: true,
            year: parseInt(year)
          },
          select: { 
            id: true, 
            name: true, 
            code: true,
            year: true
          },
          orderBy: { name: 'asc' }
        }),
        
        prisma.objective.findMany({
          where: { 
            isActive: true,
            strategicAxis: {
              year: parseInt(year)
            }
          },
          select: { 
            id: true, 
            name: true, 
            code: true,
            strategicAxis: {
              select: { name: true, code: true }
            }
          },
          orderBy: { name: 'asc' }
        }),
        
        prisma.product.findMany({
          where: { 
            isActive: true,
            objective: {
              strategicAxis: {
                year: parseInt(year)
              }
            }
          },
          select: { 
            id: true, 
            name: true, 
            code: true,
            type: true,
            objective: {
              select: { 
                name: true, 
                code: true,
                strategicAxis: {
                  select: { name: true, code: true }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        }),
        
        prisma.activity.findMany({
          where: { 
            isActive: true,
            product: {
              objective: {
                strategicAxis: {
                  year: parseInt(year)
                }
              }
            }
          },
          select: { 
            id: true, 
            name: true, 
            code: true,
            product: {
              select: { 
                name: true, 
                code: true,
                objective: {
                  select: { 
                    name: true, 
                    code: true,
                    strategicAxis: {
                      select: { name: true, code: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        })
      ]);

      res.json({
        success: true,
        data: {
          strategicAxes,
          objectives,
          products,
          activities
        },
        message: 'Opciones de niveles obtenidas exitosamente'
      });

    } catch (error) {
      console.error('Error al obtener opciones de niveles:', error);
      res.status(500).json({ 
        success: false,
        data: null,
        message: 'Error interno del servidor al obtener opciones de niveles'
      });
    }
  }
);

module.exports = router;
