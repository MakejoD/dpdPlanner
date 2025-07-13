const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/strategic-axes
 * @desc    Obtener lista de ejes estratégicos con paginación y filtros
 * @access  Private (read:strategic_axis)
 */
router.get('/', 
  authenticateToken, 
  authorize('read', 'strategic_axis'),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, year, departmentId, isLocked } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construir filtros
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (year) where.year = parseInt(year);
      if (departmentId) where.departmentId = departmentId;
      if (isLocked !== undefined) where.isLocked = isLocked === 'true';

      // Filtrar por departamento según el rol del usuario
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área') {
        where.departmentId = req.user.departmentId;
      }

      const [strategicAxes, total] = await Promise.all([
        prisma.strategicAxis.findMany({
          where,
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            objectives: {
              include: {
                _count: {
                  select: {
                    products: true
                  }
                }
              }
            },
            _count: {
              select: {
                objectives: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: [
            { year: 'desc' },
            { code: 'asc' }
          ]
        }),
        prisma.strategicAxis.count({ where })
      ]);

      // Agregar estadísticas a cada eje estratégico
      const enrichedAxes = strategicAxes.map(axis => ({
        ...axis,
        stats: {
          totalObjectives: axis._count.objectives,
          totalProducts: axis.objectives.reduce((sum, obj) => sum + obj._count.products, 0)
        }
      }));

      res.json({
        success: true,
        data: enrichedAxes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      logger.error('Error al obtener ejes estratégicos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/strategic-axes/:id
 * @desc    Obtener eje estratégico por ID
 * @access  Private (read:strategic_axis)
 */
router.get('/:id', 
  authenticateToken, 
  authorize('read', 'strategic_axis'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const strategicAxis = await prisma.strategicAxis.findUnique({
        where: { id },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          objectives: {
            include: {
              products: {
                include: {
                  activities: {
                    include: {
                      _count: {
                        select: {
                          progressReports: true
                        }
                      }
                    }
                  },
                  _count: {
                    select: {
                      activities: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  products: true
                }
              }
            }
          },
          _count: {
            select: {
              objectives: true
            }
          }
        }
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
          message: 'No tienes permisos para ver este eje estratégico'
        });
      }

      // Calcular estadísticas detalladas
      const stats = {
        totalObjectives: strategicAxis._count.objectives,
        totalProducts: strategicAxis.objectives.reduce((sum, obj) => sum + obj._count.products, 0),
        totalActivities: strategicAxis.objectives.reduce((sum, obj) => 
          sum + obj.products.reduce((prodSum, prod) => prodSum + prod._count.activities, 0), 0
        ),
        totalProgressReports: strategicAxis.objectives.reduce((sum, obj) => 
          sum + obj.products.reduce((prodSum, prod) => 
            prodSum + prod.activities.reduce((actSum, act) => actSum + act._count.progressReports, 0), 0
          ), 0
        )
      };

      res.json({
        success: true,
        data: {
          ...strategicAxis,
          stats
        }
      });

    } catch (error) {
      logger.error('Error al obtener eje estratégico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/strategic-axes
 * @desc    Crear nuevo eje estratégico
 * @access  Private (create:strategic_axis)
 */
router.post('/', 
  authenticateToken, 
  authorize('create', 'strategic_axis'),
  async (req, res) => {
    try {
      const { code, name, description, year, departmentId } = req.body;

      // Validaciones básicas
      if (!code || !name || !year) {
        return res.status(400).json({
          success: false,
          message: 'Código, nombre y año son requeridos'
        });
      }

      // Determinar departamento
      let finalDepartmentId = req.user.departmentId;
      if (departmentId && req.user.role.name === 'Administrador') {
        // Solo administradores pueden especificar departamento diferente
        const department = await prisma.department.findUnique({
          where: { id: departmentId }
        });

        if (!department) {
          return res.status(400).json({
            success: false,
            message: 'Departamento no válido'
          });
        }
        finalDepartmentId = departmentId;
      }

      // Verificar que el código sea único para el año y departamento
      const existingAxis = await prisma.strategicAxis.findFirst({
        where: {
          code,
          year: parseInt(year),
          departmentId: finalDepartmentId
        }
      });

      if (existingAxis) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un eje estratégico con este código para el año especificado'
        });
      }

      // Crear eje estratégico
      const newAxis = await prisma.strategicAxis.create({
        data: {
          code,
          name,
          description: description || '',
          year: parseInt(year),
          departmentId: finalDepartmentId
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      logger.info(`Eje estratégico creado: ${newAxis.code} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Eje estratégico creado exitosamente',
        data: newAxis
      });

    } catch (error) {
      logger.error('Error al crear eje estratégico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/strategic-axes/:id
 * @desc    Actualizar eje estratégico
 * @access  Private (update:strategic_axis)
 */
router.put('/:id', 
  authenticateToken, 
  authorize('update', 'strategic_axis'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { code, name, description, year } = req.body;

      // Verificar que el eje existe
      const existingAxis = await prisma.strategicAxis.findUnique({
        where: { id }
      });

      if (!existingAxis) {
        return res.status(404).json({
          success: false,
          message: 'Eje estratégico no encontrado'
        });
      }

      // Verificar permisos según rol
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && existingAxis.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este eje estratégico'
        });
      }

      // Verificar si está bloqueado
      if (existingAxis.isLocked && userRole !== 'Administrador') {
        return res.status(400).json({
          success: false,
          message: 'No se puede editar un eje estratégico bloqueado'
        });
      }

      // Preparar datos para actualizar
      const updateData = {};
      
      if (code && code !== existingAxis.code) {
        // Verificar que el nuevo código sea único
        const codeExists = await prisma.strategicAxis.findFirst({
          where: {
            code,
            year: year ? parseInt(year) : existingAxis.year,
            departmentId: existingAxis.departmentId,
            id: { not: id }
          }
        });
        
        if (codeExists) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un eje estratégico con este código'
          });
        }
        
        updateData.code = code;
      }

      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (year) updateData.year = parseInt(year);

      // Actualizar eje estratégico
      const updatedAxis = await prisma.strategicAxis.update({
        where: { id },
        data: updateData,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      logger.info(`Eje estratégico actualizado: ${updatedAxis.code} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Eje estratégico actualizado exitosamente',
        data: updatedAxis
      });

    } catch (error) {
      logger.error('Error al actualizar eje estratégico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/strategic-axes/:id
 * @desc    Eliminar eje estratégico
 * @access  Private (delete:strategic_axis)
 */
router.delete('/:id', 
  authenticateToken, 
  authorize('delete', 'strategic_axis'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el eje existe
      const strategicAxis = await prisma.strategicAxis.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              objectives: true
            }
          }
        }
      });

      if (!strategicAxis) {
        return res.status(404).json({
          success: false,
          message: 'Eje estratégico no encontrado'
        });
      }

      // Verificar permisos según rol
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && strategicAxis.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este eje estratégico'
        });
      }

      // No permitir eliminar si tiene objetivos asociados
      if (strategicAxis._count.objectives > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un eje estratégico que tiene objetivos asociados'
        });
      }

      // Verificar si está bloqueado
      if (strategicAxis.isLocked && userRole !== 'Administrador') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un eje estratégico bloqueado'
        });
      }

      // Eliminar eje estratégico
      await prisma.strategicAxis.delete({
        where: { id }
      });

      logger.info(`Eje estratégico eliminado: ${strategicAxis.code} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Eje estratégico eliminado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar eje estratégico:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/strategic-axes/:id/lock
 * @desc    Bloquear/desbloquear eje estratégico
 * @access  Private (Admin only)
 */
router.put('/:id/lock', 
  authenticateToken, 
  authorize('update', 'strategic_axis'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isLocked } = req.body;

      // Solo administradores pueden bloquear/desbloquear
      if (req.user.role.name !== 'Administrador') {
        return res.status(403).json({
          success: false,
          message: 'Solo los administradores pueden bloquear/desbloquear ejes estratégicos'
        });
      }

      const strategicAxis = await prisma.strategicAxis.findUnique({
        where: { id }
      });

      if (!strategicAxis) {
        return res.status(404).json({
          success: false,
          message: 'Eje estratégico no encontrado'
        });
      }

      const updatedAxis = await prisma.strategicAxis.update({
        where: { id },
        data: { isLocked: Boolean(isLocked) },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      logger.info(`Eje estratégico ${isLocked ? 'bloqueado' : 'desbloqueado'}: ${updatedAxis.code} por ${req.user.email}`);

      res.json({
        success: true,
        message: `Eje estratégico ${isLocked ? 'bloqueado' : 'desbloqueado'} exitosamente`,
        data: updatedAxis
      });

    } catch (error) {
      logger.error('Error al cambiar estado de bloqueo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/strategic-axes/stats/summary
 * @desc    Obtener estadísticas de ejes estratégicos
 * @access  Private (read:strategic_axis)
 */
router.get('/stats/summary', 
  authenticateToken, 
  authorize('read', 'strategic_axis'),
  async (req, res) => {
    try {
      const { year } = req.query;

      // Construir filtros según rol
      const where = {};
      const userRole = req.user.role.name;
      
      if (userRole === 'Director de Área') {
        where.departmentId = req.user.departmentId;
      }

      if (year) {
        where.year = parseInt(year);
      }

      const [
        totalAxes,
        lockedAxes,
        axesByDepartment,
        axesByYear
      ] = await Promise.all([
        prisma.strategicAxis.count({ where }),
        prisma.strategicAxis.count({ 
          where: { ...where, isLocked: true } 
        }),
        prisma.strategicAxis.groupBy({
          by: ['departmentId'],
          where,
          _count: true
        }),
        prisma.strategicAxis.groupBy({
          by: ['year'],
          where,
          _count: true,
          orderBy: { year: 'desc' }
        })
      ]);

      // Obtener nombres de departamentos
      const departmentsWithCounts = await Promise.all(
        axesByDepartment.map(async (deptGroup) => {
          if (!deptGroup.departmentId) {
            return {
              departmentId: null,
              departmentName: 'Sin departamento',
              count: deptGroup._count
            };
          }
          
          const department = await prisma.department.findUnique({
            where: { id: deptGroup.departmentId },
            select: { name: true, code: true }
          });
          return {
            departmentId: deptGroup.departmentId,
            departmentName: department?.name || 'Desconocido',
            departmentCode: department?.code || '',
            count: deptGroup._count
          };
        })
      );

      res.json({
        success: true,
        data: {
          totalAxes,
          lockedAxes,
          unlockedAxes: totalAxes - lockedAxes,
          axesByDepartment: departmentsWithCounts,
          axesByYear: axesByYear.map(item => ({
            year: item.year,
            count: item._count
          }))
        }
      });

    } catch (error) {
      logger.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

module.exports = router;
