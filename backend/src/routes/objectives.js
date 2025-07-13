const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { validateObjective, handleValidationErrors } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/objectives
 * @desc    Obtener todos los objetivos con filtros
 * @access  Private (read:objective)
 */
router.get('/', 
  authenticateToken, 
  authorize('read', 'objective'),
  async (req, res) => {
    try {
      const { 
        strategicAxisId, 
        year, 
        departmentId, 
        isActive, 
        search,
        page = 1,
        limit = 50
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      let where = {};

      // Filtro por eje estratégico
      if (strategicAxisId) {
        where.strategicAxisId = strategicAxisId;
      }

      // Filtro por año (a través del eje estratégico)
      if (year) {
        where.strategicAxis = {
          year: parseInt(year)
        };
      }

      // Filtro por departamento (a través del eje estratégico)
      if (departmentId) {
        where.strategicAxis = {
          ...where.strategicAxis,
          departmentId: departmentId
        };
      }

      // Filtro por estado activo
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // Filtro por búsqueda en nombre y descripción
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Filtrar por departamento según el rol del usuario
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área') {
        where.strategicAxis = {
          ...where.strategicAxis,
          departmentId: req.user.departmentId
        };
      }

      const [objectives, total] = await Promise.all([
        prisma.objective.findMany({
          where,
          include: {
            strategicAxis: {
              select: { 
                id: true, 
                name: true, 
                code: true, 
                year: true,
                department: {
                  select: { id: true, name: true, code: true }
                }
              }
            },
            products: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                code: true,
                type: true
              }
            },
            indicators: {
              select: {
                id: true,
                name: true,
                type: true,
                measurementUnit: true,
                annualTarget: true
              }
            },
            _count: {
              select: { 
                products: true,
                indicators: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: [
            { strategicAxis: { year: 'desc' } },
            { strategicAxis: { code: 'asc' } },
            { order: 'asc' },
            { code: 'asc' }
          ]
        }),
        prisma.objective.count({ where })
      ]);

      res.json({
        success: true,
        data: objectives,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      logger.error('Error al obtener objetivos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/objectives/by-strategic-axis/:strategicAxisId
 * @desc    Obtener objetivos por eje estratégico
 * @access  Private (read:objective)
 */
router.get('/by-strategic-axis/:strategicAxisId', 
  authenticateToken, 
  authorize('read', 'objective'),
  async (req, res) => {
    try {
      const { strategicAxisId } = req.params;

      // Verificar que el eje estratégico exista
      const strategicAxis = await prisma.strategicAxis.findUnique({
        where: { id: strategicAxisId }
      });

      if (!strategicAxis) {
        return res.status(404).json({
          success: false,
          message: 'Eje estratégico no encontrado'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && strategicAxis.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver objetivos de este eje estratégico'
        });
      }

      const objectives = await prisma.objective.findMany({
        where: { 
          strategicAxisId,
          isActive: true 
        },
        include: {
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              code: true,
              type: true
            }
          },
          indicators: {
            select: {
              id: true,
              name: true,
              type: true,
              measurementUnit: true,
              annualTarget: true
            }
          },
          _count: {
            select: { 
              products: true,
              indicators: true
            }
          }
        },
        orderBy: [
          { order: 'asc' },
          { code: 'asc' }
        ]
      });

      res.json({
        success: true,
        data: objectives,
        message: `${objectives.length} objetivos encontrados para el eje estratégico`
      });

    } catch (error) {
      logger.error('Error al obtener objetivos por eje estratégico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/objectives
 * @desc    Crear nuevo objetivo
 * @access  Private (create:objective)
 */
router.post('/', 
  authenticateToken, 
  authorize('create', 'objective'),
  async (req, res) => {
    try {
      const { 
        name, 
        description, 
        code, 
        strategicAxisId,
        order = 0
      } = req.body;

      // Validaciones básicas
      if (!name || !code || !strategicAxisId) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, código y eje estratégico son requeridos'
        });
      }

      // Verificar que el eje estratégico exista
      const strategicAxis = await prisma.strategicAxis.findUnique({
        where: { id: strategicAxisId }
      });

      if (!strategicAxis) {
        return res.status(400).json({
          success: false,
          message: 'Eje estratégico no válido'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && strategicAxis.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear objetivos en este eje estratégico'
        });
      }

      // Verificar que el código sea único para el eje estratégico
      const existingObjective = await prisma.objective.findFirst({
        where: { 
          code,
          strategicAxisId
        }
      });

      if (existingObjective) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un objetivo con este código en el eje estratégico especificado'
        });
      }

      // Crear objetivo
      const newObjective = await prisma.objective.create({
        data: {
          name,
          description,
          code,
          strategicAxisId,
          order: parseInt(order) || 0
        },
        include: {
          strategicAxis: {
            select: { 
              id: true, 
              name: true, 
              code: true, 
              year: true,
              department: {
                select: { id: true, name: true, code: true }
              }
            }
          },
          _count: {
            select: {
              products: true,
              indicators: true
            }
          }
        }
      });

      logger.info(`Objetivo creado: ${code} - ${name} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Objetivo creado exitosamente',
        data: newObjective
      });

    } catch (error) {
      logger.error('Error al crear objetivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/objectives/:id
 * @desc    Obtener objetivo por ID
 * @access  Private (read:objective)
 */
router.get('/:id', 
  authenticateToken, 
  authorize('read', 'objective'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const objective = await prisma.objective.findUnique({
        where: { id },
        include: {
          strategicAxis: {
            select: { 
              id: true, 
              name: true, 
              code: true, 
              year: true,
              department: {
                select: { id: true, name: true, code: true }
              }
            }
          },
          products: {
            where: { isActive: true },
            include: {
              activities: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  code: true,
                  startDate: true,
                  endDate: true
                }
              },
              _count: {
                select: {
                  activities: true,
                  indicators: true
                }
              }
            }
          },
          indicators: {
            select: {
              id: true,
              name: true,
              type: true,
              measurementUnit: true,
              annualTarget: true,
              baseline: true,
              q1Target: true,
              q2Target: true,
              q3Target: true,
              q4Target: true
            }
          },
          _count: {
            select: {
              products: true,
              indicators: true
            }
          }
        }
      });

      if (!objective) {
        return res.status(404).json({
          success: false,
          message: 'Objetivo no encontrado'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && objective.strategicAxis.department?.id !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este objetivo'
        });
      }

      res.json({
        success: true,
        data: objective
      });

    } catch (error) {
      logger.error('Error al obtener objetivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/objectives/:id
 * @desc    Actualizar objetivo
 * @access  Private (update:objective)
 */
router.put('/:id', 
  authenticateToken, 
  authorize('update', 'objective'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, code, strategicAxisId, order, isActive } = req.body;

      // Verificar que el objetivo exista
      const existingObjective = await prisma.objective.findUnique({
        where: { id },
        include: {
          strategicAxis: true
        }
      });

      if (!existingObjective) {
        return res.status(404).json({
          success: false,
          message: 'Objetivo no encontrado'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && existingObjective.strategicAxis.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este objetivo'
        });
      }

      // Verificar que el eje estratégico exista (si se está cambiando)
      if (strategicAxisId && strategicAxisId !== existingObjective.strategicAxisId) {
        const strategicAxis = await prisma.strategicAxis.findUnique({
          where: { id: strategicAxisId }
        });

        if (!strategicAxis) {
          return res.status(400).json({
            success: false,
            message: 'Eje estratégico no válido'
          });
        }

        // Verificar permisos para el nuevo eje estratégico
        if (userRole === 'Director de Área' && strategicAxis.departmentId !== req.user.departmentId) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para mover objetivos a este eje estratégico'
          });
        }
      }

      // Verificar que el código sea único (si se está cambiando)
      if (code && code !== existingObjective.code) {
        const targetAxisId = strategicAxisId || existingObjective.strategicAxisId;
        const codeExists = await prisma.objective.findFirst({
          where: {
            code,
            strategicAxisId: targetAxisId,
            id: { not: id }
          }
        });

        if (codeExists) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un objetivo con este código en el eje estratégico especificado'
          });
        }
      }

      // Actualizar objetivo
      const updatedObjective = await prisma.objective.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(code && { code }),
          ...(strategicAxisId && { strategicAxisId }),
          ...(order !== undefined && { order: parseInt(order) }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          strategicAxis: {
            select: { 
              id: true, 
              name: true, 
              code: true, 
              year: true,
              department: {
                select: { id: true, name: true, code: true }
              }
            }
          },
          _count: {
            select: {
              products: true,
              indicators: true
            }
          }
        }
      });

      logger.info(`Objetivo actualizado: ${updatedObjective.code} - ${updatedObjective.name} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Objetivo actualizado exitosamente',
        data: updatedObjective
      });

    } catch (error) {
      logger.error('Error al actualizar objetivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/objectives/:id
 * @desc    Eliminar objetivo (soft delete)
 * @access  Private (delete:objective)
 */
router.delete('/:id', 
  authenticateToken, 
  authorize('delete', 'objective'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el objetivo exista
      const existingObjective = await prisma.objective.findUnique({
        where: { id },
        include: {
          strategicAxis: true,
          _count: {
            select: {
              products: true,
              indicators: true
            }
          }
        }
      });

      if (!existingObjective) {
        return res.status(404).json({
          success: false,
          message: 'Objetivo no encontrado'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && existingObjective.strategicAxis.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este objetivo'
        });
      }

      // Verificar si tiene productos o indicadores asociados
      if (existingObjective._count.products > 0 || existingObjective._count.indicators > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar el objetivo porque tiene ${existingObjective._count.products} producto(s) y ${existingObjective._count.indicators} indicador(es) asociado(s)`
        });
      }

      // Soft delete - marcar como inactivo
      await prisma.objective.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info(`Objetivo desactivado: ${existingObjective.code} - ${existingObjective.name} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Objetivo desactivado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar objetivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/objectives/stats/summary
 * @desc    Obtener estadísticas de objetivos
 * @access  Private (read:objective)
 */
router.get('/stats/summary', 
  authenticateToken, 
  authorize('read', 'objective'), 
  async (req, res) => {
    try {
      const { year, strategicAxisId } = req.query;
      const where = {};
      
      if (strategicAxisId) {
        where.strategicAxisId = strategicAxisId;
      }

      if (year) {
        where.strategicAxis = {
          year: parseInt(year)
        };
      }

      // Filtrar por departamento según el rol del usuario
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área') {
        where.strategicAxis = {
          ...where.strategicAxis,
          departmentId: req.user.departmentId
        };
      }

      const [
        totalObjectives, 
        activeObjectives, 
        objectivesByAxis,
        objectivesByDepartment
      ] = await Promise.all([
        prisma.objective.count({ where }),
        prisma.objective.count({ where: { ...where, isActive: true } }),
        prisma.objective.groupBy({
          by: ['strategicAxisId'],
          where,
          _count: true
        }),
        prisma.objective.findMany({
          where,
          include: {
            strategicAxis: {
              include: {
                department: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        })
      ]);

      // Agrupar por departamento
      const deptGroups = objectivesByDepartment.reduce((acc, obj) => {
        const deptId = obj.strategicAxis.departmentId;
        const deptName = obj.strategicAxis.department?.name || 'Sin departamento';
        if (!acc[deptId]) {
          acc[deptId] = { departmentId: deptId, departmentName: deptName, count: 0 };
        }
        acc[deptId].count++;
        return acc;
      }, {});

      // Obtener nombres de ejes estratégicos
      const axesWithCounts = await Promise.all(
        objectivesByAxis.map(async (axisGroup) => {
          const axis = await prisma.strategicAxis.findUnique({
            where: { id: axisGroup.strategicAxisId },
            select: { name: true, code: true }
          });
          return {
            strategicAxisId: axisGroup.strategicAxisId,
            axisName: axis?.name || 'Desconocido',
            axisCode: axis?.code || 'N/A',
            count: axisGroup._count
          };
        })
      );

      res.json({
        success: true,
        data: {
          totalObjectives,
          activeObjectives,
          inactiveObjectives: totalObjectives - activeObjectives,
          objectivesByAxis: axesWithCounts,
          objectivesByDepartment: Object.values(deptGroups)
        }
      });

    } catch (error) {
      logger.error('Error al obtener estadísticas de objetivos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

module.exports = router;
