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
 * @desc    Obtener lista de usuarios
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
            role: true,
            department: true,
            _count: {
              select: {
                activityAssignments: true,
                progressReports: true
              }
            }
          },
          orderBy: [
            { lastName: 'asc' },
            { firstName: 'asc' }
          ],
          skip,
          take: parseInt(limit)
        }),
        prisma.user.count({ where })
      ]);

      // Remover información sensible
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        department: user.department,
        stats: {
          assignedActivities: user._count.activityAssignments,
          progressReports: user._count.progressReports
        }
      }));

      res.json({
        users: safeUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalUsers: total,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      logger.error('Error al obtener usuarios:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener la lista de usuarios'
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
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          department: true,
          activityAssignments: {
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
          _count: {
            select: {
              progressReports: true,
              approvedReports: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario solicitado no existe'
        });
      }

      // Verificar permisos de acceso según rol
      const userRole = req.user.role.name;
      if (userRole === 'Director de Área' && user.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tiene permisos para ver este usuario'
        });
      }

      if (userRole === 'Técnico Registrador' && user.id !== req.user.id) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo puede ver su propia información'
        });
      }

      // Preparar respuesta sin datos sensibles
      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        department: user.department,
        assignedActivities: user.activityAssignments,
        stats: {
          progressReports: user._count.progressReports,
          approvedReports: user._count.approvedReports
        },
        permissions: user.role.rolePermissions.map(rp => ({
          action: rp.permission.action,
          resource: rp.permission.resource
        }))
      };

      res.json(safeUser);

    } catch (error) {
      logger.error('Error al obtener usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener el usuario'
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
          error: 'Email ya registrado',
          message: 'Ya existe un usuario con este email'
        });
      }

      // Verificar que el rol existe
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        return res.status(400).json({
          error: 'Rol no válido',
          message: 'El rol especificado no existe'
        });
      }

      // Verificar departamento si se proporciona
      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId }
        });

        if (!department) {
          return res.status(400).json({
            error: 'Departamento no válido',
            message: 'El departamento especificado no existe'
          });
        }
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 12);

      // Crear usuario
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          roleId,
          departmentId
        },
        include: {
          role: true,
          department: true
        }
      });

      logger.info(`Usuario creado: ${newUser.email} por ${req.user.email}`);

      // Respuesta sin datos sensibles
      const safeUser = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        role: newUser.role,
        department: newUser.department
      };

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: safeUser
      });

    } catch (error) {
      logger.error('Error al crear usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al crear el usuario'
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

      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario especificado no existe'
        });
      }

      // Preparar datos para actualizar
      const updateData = {};
      
      if (email && email !== existingUser.email) {
        // Verificar que el nuevo email no esté en uso
        const emailExists = await prisma.user.findUnique({
          where: { email }
        });
        
        if (emailExists) {
          return res.status(400).json({
            error: 'Email ya registrado',
            message: 'Ya existe un usuario con este email'
          });
        }
        
        updateData.email = email;
      }

      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (roleId) updateData.roleId = roleId;
      if (departmentId !== undefined) updateData.departmentId = departmentId;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Actualizar usuario
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          role: true,
          department: true
        }
      });

      logger.info(`Usuario actualizado: ${updatedUser.email} por ${req.user.email}`);

      // Respuesta sin datos sensibles
      const safeUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        role: updatedUser.role,
        department: updatedUser.department
      };

      res.json({
        message: 'Usuario actualizado exitosamente',
        user: safeUser
      });

    } catch (error) {
      logger.error('Error al actualizar usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al actualizar el usuario'
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

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario especificado no existe'
        });
      }

      // No permitir eliminar el propio usuario
      if (user.id === req.user.id) {
        return res.status(400).json({
          error: 'Acción no permitida',
          message: 'No puede eliminar su propia cuenta'
        });
      }

      // Soft delete - desactivar usuario
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info(`Usuario desactivado: ${user.email} por ${req.user.email}`);

      res.json({
        message: 'Usuario desactivado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar usuario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al eliminar el usuario'
      });
    }
  }
);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Cambiar contraseña de usuario
 * @access  Private
 */
router.put('/:id/password', 
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Validar que el usuario solo pueda cambiar su propia contraseña o sea admin
      if (id !== req.user.id && req.user.role.name !== 'Administrador') {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo puede cambiar su propia contraseña'
        });
      }

      // Validaciones básicas
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          error: 'Contraseña inválida',
          message: 'La nueva contraseña debe tener al menos 8 caracteres'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario especificado no existe'
        });
      }

      // Si no es admin, verificar contraseña actual
      if (req.user.role.name !== 'Administrador') {
        if (!currentPassword) {
          return res.status(400).json({
            error: 'Contraseña actual requerida',
            message: 'Debe proporcionar la contraseña actual'
          });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
          return res.status(400).json({
            error: 'Contraseña incorrecta',
            message: 'La contraseña actual no es correcta'
          });
        }
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id },
        data: { passwordHash: newPasswordHash }
      });

      logger.info(`Contraseña cambiada para usuario: ${user.email}`);

      res.json({
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      logger.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al cambiar la contraseña'
      });
    }
  }
);

module.exports = router;
