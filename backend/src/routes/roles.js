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
 * @desc    Obtener lista de roles
 * @access  Private (read:role)
 */
router.get('/', 
  authenticateToken, 
  authorize('read', 'role'), 
  async (req, res) => {
    try {
      const { includePermissions = false } = req.query;

      const roles = await prisma.role.findMany({
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

      res.json(formattedRoles);

    } catch (error) {
      logger.error('Error al obtener roles:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener la lista de roles'
      });
    }
  }
);

/**
 * @route   GET /api/roles/:id
 * @desc    Obtener rol por ID
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
              email: true,
              firstName: true,
              lastName: true,
              isActive: true
            }
          }
        }
      });

      if (!role) {
        return res.status(404).json({
          error: 'Rol no encontrado',
          message: 'El rol solicitado no existe'
        });
      }

      const formattedRole = {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          action: rp.permission.action,
          resource: rp.permission.resource
        })),
        users: role.users
      };

      res.json(formattedRole);

    } catch (error) {
      logger.error('Error al obtener rol:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener el rol'
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
  validateRole,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, permissionIds = [] } = req.body;

      // Verificar si el nombre ya existe
      const existingRole = await prisma.role.findUnique({
        where: { name }
      });

      if (existingRole) {
        return res.status(400).json({
          error: 'Nombre de rol ya existe',
          message: 'Ya existe un rol con este nombre'
        });
      }

      // Verificar que los permisos existen
      if (permissionIds.length > 0) {
        const existingPermissions = await prisma.permission.findMany({
          where: {
            id: { in: permissionIds }
          }
        });

        if (existingPermissions.length !== permissionIds.length) {
          return res.status(400).json({
            error: 'Permisos no válidos',
            message: 'Algunos permisos especificados no existen'
          });
        }
      }

      // Crear rol
      const newRole = await prisma.role.create({
        data: {
          name,
          description,
          rolePermissions: {
            create: permissionIds.map(permissionId => ({
              permissionId
            }))
          }
        },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      logger.info(`Rol creado: ${newRole.name} por ${req.user.email}`);

      const formattedRole = {
        id: newRole.id,
        name: newRole.name,
        description: newRole.description,
        isActive: newRole.isActive,
        createdAt: newRole.createdAt,
        permissions: newRole.rolePermissions.map(rp => ({
          id: rp.permission.id,
          action: rp.permission.action,
          resource: rp.permission.resource
        }))
      };

      res.status(201).json({
        message: 'Rol creado exitosamente',
        role: formattedRole
      });

    } catch (error) {
      logger.error('Error al crear rol:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al crear el rol'
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

      // Verificar que el rol existe
      const existingRole = await prisma.role.findUnique({
        where: { id }
      });

      if (!existingRole) {
        return res.status(404).json({
          error: 'Rol no encontrado',
          message: 'El rol especificado no existe'
        });
      }

      // Preparar datos para actualizar
      const updateData = {};
      
      if (name && name !== existingRole.name) {
        // Verificar que el nuevo nombre no esté en uso
        const nameExists = await prisma.role.findUnique({
          where: { name }
        });
        
        if (nameExists) {
          return res.status(400).json({
            error: 'Nombre de rol ya existe',
            message: 'Ya existe un rol con este nombre'
          });
        }
        
        updateData.name = name;
      }

      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Actualizar rol
      const updatedRole = await prisma.role.update({
        where: { id },
        data: updateData
      });

      // Actualizar permisos si se proporcionan
      if (permissionIds !== undefined) {
        // Eliminar permisos actuales
        await prisma.rolePermission.deleteMany({
          where: { roleId: id }
        });

        // Agregar nuevos permisos
        if (permissionIds.length > 0) {
          await prisma.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({
              roleId: id,
              permissionId
            }))
          });
        }
      }

      // Obtener rol actualizado con permisos
      const roleWithPermissions = await prisma.role.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      logger.info(`Rol actualizado: ${updatedRole.name} por ${req.user.email}`);

      const formattedRole = {
        id: roleWithPermissions.id,
        name: roleWithPermissions.name,
        description: roleWithPermissions.description,
        isActive: roleWithPermissions.isActive,
        createdAt: roleWithPermissions.createdAt,
        updatedAt: roleWithPermissions.updatedAt,
        permissions: roleWithPermissions.rolePermissions.map(rp => ({
          id: rp.permission.id,
          action: rp.permission.action,
          resource: rp.permission.resource
        }))
      };

      res.json({
        message: 'Rol actualizado exitosamente',
        role: formattedRole
      });

    } catch (error) {
      logger.error('Error al actualizar rol:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al actualizar el rol'
      });
    }
  }
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Eliminar rol
 * @access  Private (delete:role)
 */
router.delete('/:id', 
  authenticateToken, 
  authorize('delete', 'role'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el rol existe
      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      if (!role) {
        return res.status(404).json({
          error: 'Rol no encontrado',
          message: 'El rol especificado no existe'
        });
      }

      // No permitir eliminar rol con usuarios asignados
      if (role._count.users > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'Este rol tiene usuarios asignados. Primero reasigne los usuarios a otro rol.'
        });
      }

      // Eliminar permisos del rol
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Eliminar rol
      await prisma.role.delete({
        where: { id }
      });

      logger.info(`Rol eliminado: ${role.name} por ${req.user.email}`);

      res.json({
        message: 'Rol eliminado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar rol:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al eliminar el rol'
      });
    }
  }
);

/**
 * @route   POST /api/roles/:id/permissions
 * @desc    Agregar permisos a un rol
 * @access  Private (update:role)
 */
router.post('/:id/permissions', 
  authenticateToken, 
  authorize('update', 'role'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;

      if (!permissionIds || !Array.isArray(permissionIds)) {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: 'Debe proporcionar un array de IDs de permisos'
        });
      }

      // Verificar que el rol existe
      const role = await prisma.role.findUnique({
        where: { id }
      });

      if (!role) {
        return res.status(404).json({
          error: 'Rol no encontrado',
          message: 'El rol especificado no existe'
        });
      }

      // Verificar que los permisos existen
      const existingPermissions = await prisma.permission.findMany({
        where: {
          id: { in: permissionIds }
        }
      });

      if (existingPermissions.length !== permissionIds.length) {
        return res.status(400).json({
          error: 'Permisos no válidos',
          message: 'Algunos permisos especificados no existen'
        });
      }

      // Agregar permisos (ignorar duplicados)
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId: id,
          permissionId
        })),
        skipDuplicates: true
      });

      logger.info(`Permisos agregados al rol: ${role.name} por ${req.user.email}`);

      res.json({
        message: 'Permisos agregados exitosamente'
      });

    } catch (error) {
      logger.error('Error al agregar permisos:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al agregar permisos al rol'
      });
    }
  }
);

/**
 * @route   DELETE /api/roles/:id/permissions/:permissionId
 * @desc    Remover permiso de un rol
 * @access  Private (update:role)
 */
router.delete('/:id/permissions/:permissionId', 
  authenticateToken, 
  authorize('update', 'role'),
  async (req, res) => {
    try {
      const { id, permissionId } = req.params;

      // Verificar que la relación existe
      const rolePermission = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: id,
            permissionId: permissionId
          }
        }
      });

      if (!rolePermission) {
        return res.status(404).json({
          error: 'Relación no encontrada',
          message: 'El rol no tiene este permiso asignado'
        });
      }

      // Eliminar permiso del rol
      await prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId: id,
            permissionId: permissionId
          }
        }
      });

      logger.info(`Permiso removido del rol por ${req.user.email}`);

      res.json({
        message: 'Permiso removido exitosamente'
      });

    } catch (error) {
      logger.error('Error al remover permiso:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al remover permiso del rol'
      });
    }
  }
);

module.exports = router;
