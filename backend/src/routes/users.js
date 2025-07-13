const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { validateUser, handleValidationErrors } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/users
 * @desc    Obtener lista de usuarios con paginación y filtros
 * @access  Private (read:user)
 */
router.get('/', 
  authenticateToken, 
  authorize('read', 'user'), 
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, roleId, departmentId, isActive } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construir filtros
      const where = {};
      
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (roleId) where.roleId = roleId;
      if (departmentId) where.departmentId = departmentId;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      // Filtrar por departamento según el rol del usuario
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área') {
        where.departmentId = req.user.departmentId;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' }
          ]
        }),
        prisma.user.count({ where })
      ]);

      // Omitir passwordHash en la respuesta
      const sanitizedUsers = users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json({
        success: true,
        data: sanitizedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      logger.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener usuario por ID
 * @access  Private (read:user)
 */
router.get('/:id', 
  authenticateToken, 
  authorize('read', 'user'), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          activityAssignments: {
            include: {
              activity: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          indicatorAssignments: {
            include: {
              indicator: {
                select: {
                  id: true,
                  name: true,
                  type: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && user.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este usuario'
        });
      }

      // Omitir passwordHash en la respuesta
      const { passwordHash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword
      });

    } catch (error) {
      logger.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/users
 * @desc    Crear nuevo usuario
 * @access  Private (create:user)
 */
router.post('/', 
  authenticateToken, 
  authorize('create', 'user'),
  validateUser,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, firstName, lastName, password, roleId, departmentId } = req.body;

      // Verificar si el email ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Verificar que el rol exista
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Rol no válido'
        });
      }

      // Verificar que el departamento exista (si se proporciona)
      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId }
        });

        if (!department) {
          return res.status(400).json({
            success: false,
            message: 'Departamento no válido'
          });
        }
      }

      // Hash de la contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          roleId,
          departmentId: departmentId || null
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // Omitir passwordHash en la respuesta
      const { passwordHash: _, ...userWithoutPassword } = newUser;

      logger.info(`Usuario creado: ${email} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: userWithoutPassword
      });

    } catch (error) {
      logger.error('Error al crear usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar usuario
 * @access  Private (update:user)
 */
router.put('/:id', 
  authenticateToken, 
  authorize('update', 'user'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { email, firstName, lastName, roleId, departmentId, isActive } = req.body;

      // Verificar que el usuario exista
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && existingUser.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este usuario'
        });
      }

      // Verificar si el email ya existe (si se está cambiando)
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        });

        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está registrado'
          });
        }
      }

      // Verificar que el rol exista (si se está cambiando)
      if (roleId) {
        const role = await prisma.role.findUnique({
          where: { id: roleId }
        });

        if (!role) {
          return res.status(400).json({
            success: false,
            message: 'Rol no válido'
          });
        }
      }

      // Verificar que el departamento exista (si se está cambiando)
      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId }
        });

        if (!department) {
          return res.status(400).json({
            success: false,
            message: 'Departamento no válido'
          });
        }
      }

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(roleId && { roleId }),
          ...(departmentId !== undefined && { departmentId }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // Omitir passwordHash en la respuesta
      const { passwordHash, ...userWithoutPassword } = updatedUser;

      logger.info(`Usuario actualizado: ${updatedUser.email} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: userWithoutPassword
      });

    } catch (error) {
      logger.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar usuario (soft delete)
 * @access  Private (delete:user)
 */
router.delete('/:id', 
  authenticateToken, 
  authorize('delete', 'user'), 
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el usuario exista
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir eliminar el propio usuario
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
      }

      // Verificar permisos de acceso por departamento
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && existingUser.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este usuario'
        });
      }

      // Soft delete - marcar como inactivo
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info(`Usuario desactivado: ${existingUser.email} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Cambiar contraseña de usuario
 * @access  Private (update:user)
 */
router.put('/:id/password', 
  authenticateToken, 
  authorize('update', 'user'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Validaciones básicas
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Verificar que el usuario exista
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Si el usuario cambia su propia contraseña, verificar la actual
      if (id === req.user.id) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Contraseña actual requerida'
          });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
          return res.status(400).json({
            success: false,
            message: 'Contraseña actual incorrecta'
          });
        }
      }

      // Hash de la nueva contraseña
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id },
        data: { passwordHash: newPasswordHash }
      });

      logger.info(`Contraseña actualizada para usuario: ${user.email} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      logger.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/users/stats/summary
 * @desc    Obtener estadísticas de usuarios
 * @access  Private (read:user)
 */
router.get('/stats/summary', 
  authenticateToken, 
  authorize('read', 'user'), 
  async (req, res) => {
    try {
      // Filtrar por departamento según el rol del usuario
      const where = {};
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área') {
        where.departmentId = req.user.departmentId;
      }

      const [totalUsers, activeUsers, usersByRole, usersByDepartment] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({ where: { ...where, isActive: true } }),
        prisma.user.groupBy({
          by: ['roleId'],
          where,
          _count: true
        }),
        prisma.user.groupBy({
          by: ['departmentId'],
          where,
          _count: true
        })
      ]);

      // Obtener nombres de roles
      const rolesWithCounts = await Promise.all(
        usersByRole.map(async (roleGroup) => {
          const role = await prisma.role.findUnique({
            where: { id: roleGroup.roleId },
            select: { name: true }
          });
          return {
            roleId: roleGroup.roleId,
            roleName: role?.name || 'Desconocido',
            count: roleGroup._count
          };
        })
      );

      // Obtener nombres de departamentos
      const departmentsWithCounts = await Promise.all(
        usersByDepartment.map(async (deptGroup) => {
          if (!deptGroup.departmentId) {
            return {
              departmentId: null,
              departmentName: 'Sin departamento',
              count: deptGroup._count
            };
          }
          
          const department = await prisma.department.findUnique({
            where: { id: deptGroup.departmentId },
            select: { name: true }
          });
          return {
            departmentId: deptGroup.departmentId,
            departmentName: department?.name || 'Desconocido',
            count: deptGroup._count
          };
        })
      );

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          usersByRole: rolesWithCounts,
          usersByDepartment: departmentsWithCounts
        }
      });

    } catch (error) {
      logger.error('Error al obtener estadísticas de usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

module.exports = router;
