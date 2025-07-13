const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { validateRole, handleValidationErrors } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/roles
 * @desc    Obtener lista de roles con permisos
 * @access  Private (read:role)
 */
router.get('/', 
  authenticateToken, 
  authorize('read', 'role'), 
  async (req, res) => {
    try {
      const { includePermissions = false, isActive } = req.query;

      const where = {};
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const roles = await prisma.role.findMany({
        where,
        include: {
          ...(includePermissions === 'true' && {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }),
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      const formattedRoles = roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.users,
        ...(includePermissions === 'true' && {
          permissions: role.rolePermissions.map(rp => ({
            id: rp.permission.id,
            action: rp.permission.action,
            resource: rp.permission.resource
          }))
        })
      }));

      res.json({
        success: true,
        data: formattedRoles
      });

    } catch (error) {
      logger.error('Error al obtener roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/roles/:id
 * @desc    Obtener rol por ID con permisos
 * @access  Private (read:role)
 */
router.get('/:id', 
  authenticateToken, 
  authorize('read', 'role'), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          },
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isActive: true
            }
          },
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      const formattedRole = {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.users,
        permissions: role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          action: rp.permission.action,
          resource: rp.permission.resource
        })),
        users: role.users
      };

      res.json({
        success: true,
        data: formattedRole
      });

    } catch (error) {
      logger.error('Error al obtener rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/roles
 * @desc    Crear nuevo rol
 * @access  Private (create:role)
 */
router.post('/', 
  authenticateToken, 
  authorize('create', 'role'),
  async (req, res) => {
    try {
      const { name, description, permissionIds = [] } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del rol es requerido'
        });
      }

      // Verificar si el nombre ya existe
      const existingRole = await prisma.role.findUnique({
        where: { name }
      });

      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un rol con este nombre'
        });
      }

      // Verificar que todos los permisos existan
      if (permissionIds.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: {
            id: { in: permissionIds }
          }
        });

        if (permissions.length !== permissionIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Algunos permisos especificados no existen'
          });
        }
      }

      // Crear rol en una transacción
      const newRole = await prisma.$transaction(async (tx) => {
        // Crear el rol
        const role = await tx.role.create({
          data: {
            name,
            description
          }
        });

        // Asignar permisos si se proporcionaron
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({
              roleId: role.id,
              permissionId
            }))
          });
        }

        // Retornar el rol con permisos
        return await tx.role.findUnique({
          where: { id: role.id },
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        });
      });

      const formattedRole = {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        isActive: newRole.isActive,
        createdAt: newRole.createdAt,
        updatedAt: newRole.updatedAt,
        permissions: newRole.rolePermissions.map(rp => ({
          id: rp.permission.id,
          action: rp.permission.action,
          resource: rp.permission.resource
        }))
      };

      logger.info(`Rol creado: ${name} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Rol creado exitosamente',
        data: formattedRole
      });

    } catch (error) {
      logger.error('Error al crear rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Actualizar rol
 * @access  Private (update:role)
 */
router.put('/:id', 
  authenticateToken, 
  authorize('update', 'role'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isActive, permissionIds } = req.body;

      // Verificar que el rol exista
      const existingRole = await prisma.role.findUnique({
        where: { id }
      });

      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Verificar si el nombre ya existe (si se está cambiando)
      if (name && name !== existingRole.name) {
        const nameExists = await prisma.role.findUnique({
          where: { name }
        });

        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un rol con este nombre'
          });
        }
      }

      // Verificar que todos los permisos existan (si se proporcionan)
      if (permissionIds && permissionIds.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: {
            id: { in: permissionIds }
          }
        });

        if (permissions.length !== permissionIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Algunos permisos especificados no existen'
          });
        }
      }

      // Actualizar rol en una transacción
      const updatedRole = await prisma.$transaction(async (tx) => {
        // Actualizar datos básicos del rol
        const role = await tx.role.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(isActive !== undefined && { isActive })
          }
        });

        // Actualizar permisos si se proporcionaron
        if (permissionIds !== undefined) {
          // Eliminar permisos actuales
          await tx.rolePermission.deleteMany({
            where: { roleId: id }
          });

          // Agregar nuevos permisos
          if (permissionIds.length > 0) {
            await tx.rolePermission.createMany({
              data: permissionIds.map(permissionId => ({
                roleId: id,
                permissionId
              }))
            });
          }
        }

        // Retornar el rol actualizado con permisos
        return await tx.role.findUnique({
          where: { id },
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        });
      });

      const formattedRole = {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        isActive: updatedRole.isActive,
        createdAt: updatedRole.createdAt,
        updatedAt: updatedRole.updatedAt,
        permissions: updatedRole.rolePermissions.map(rp => ({
          id: rp.permission.id,
          action: rp.permission.action,
          resource: rp.permission.resource
        }))
      };

      logger.info(`Rol actualizado: ${updatedRole.name} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Rol actualizado exitosamente',
        data: formattedRole
      });

    } catch (error) {
      logger.error('Error al actualizar rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Eliminar rol (soft delete)
 * @access  Private (delete:role)
 */
router.delete('/:id', 
  authenticateToken, 
  authorize('delete', 'role'), 
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el rol exista
      const existingRole = await prisma.role.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Verificar si hay usuarios asignados
      if (existingRole._count.users > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar el rol porque tiene ${existingRole._count.users} usuario(s) asignado(s)`
        });
      }

      // Soft delete - marcar como inactivo
      await prisma.role.update({
        where: { id },
        data: { isActive: false }
      });

      logger.info(`Rol desactivado: ${existingRole.name} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Rol desactivado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar rol:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

module.exports = router;