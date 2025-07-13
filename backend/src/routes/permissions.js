const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/permissions
 * @desc    Obtener lista de permisos
 * @access  Private (read:permission)
 */
router.get('/', 
  authenticateToken, 
  authorize('read', 'permission'), 
  async (req, res) => {
    try {
      const { groupBy = false } = req.query;

      const permissions = await prisma.permission.findMany({
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' }
        ]
      });

      if (groupBy === 'resource') {
        // Agrupar permisos por recurso
        const groupedPermissions = permissions.reduce((acc, permission) => {
          if (!acc[permission.resource]) {
            acc[permission.resource] = [];
          }
          acc[permission.resource].push({
            id: permission.id,
            action: permission.action,
            description: `${permission.action} ${permission.resource}`
          });
          return acc;
        }, {});

        return res.json({
          success: true,
          data: groupedPermissions,
          message: `Permisos agrupados por recurso`
        });
      }

      res.json({
        success: true,
        data: permissions,
        message: `${permissions.length} permisos encontrados`
      });

    } catch (error) {
      logger.error('Error al obtener permisos:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener la lista de permisos'
      });
    }
  }
);

/**
 * @route   GET /api/permissions/:id
 * @desc    Obtener permiso por ID
 * @access  Private (read:permission)
 */
router.get('/:id', 
  authenticateToken, 
  authorize('read', 'permission'), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const permission = await prisma.permission.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      });

      if (!permission) {
        return res.status(404).json({
          error: 'Permiso no encontrado',
          message: 'El permiso solicitado no existe'
        });
      }

      const formattedPermission = {
        id: permission.id,
        action: permission.action,
        resource: permission.resource,
        roles: permission.rolePermissions.map(rp => rp.role)
      };

      res.json(formattedPermission);

    } catch (error) {
      logger.error('Error al obtener permiso:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener el permiso'
      });
    }
  }
);

/**
 * @route   POST /api/permissions
 * @desc    Crear nuevo permiso
 * @access  Private (create:permission)
 */
router.post('/', 
  authenticateToken, 
  authorize('create', 'permission'),
  async (req, res) => {
    try {
      const { action, resource } = req.body;

      // Validaciones
      if (!action || !resource) {
        return res.status(400).json({
          error: 'Datos requeridos',
          message: 'Debe proporcionar acción y recurso'
        });
      }

      // Verificar si la combinación ya existe
      const existingPermission = await prisma.permission.findUnique({
        where: {
          action_resource: {
            action: action.toLowerCase(),
            resource: resource.toLowerCase()
          }
        }
      });

      if (existingPermission) {
        return res.status(400).json({
          error: 'Permiso ya existe',
          message: 'Ya existe un permiso con esta combinación de acción y recurso'
        });
      }

      // Crear permiso
      const newPermission = await prisma.permission.create({
        data: {
          action: action.toLowerCase(),
          resource: resource.toLowerCase()
        }
      });

      logger.info(`Permiso creado: ${newPermission.action}:${newPermission.resource} por ${req.user.email}`);

      res.status(201).json({
        message: 'Permiso creado exitosamente',
        permission: newPermission
      });

    } catch (error) {
      logger.error('Error al crear permiso:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al crear el permiso'
      });
    }
  }
);

/**
 * @route   PUT /api/permissions/:id
 * @desc    Actualizar permiso
 * @access  Private (update:permission)
 */
router.put('/:id', 
  authenticateToken, 
  authorize('update', 'permission'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action, resource } = req.body;

      // Verificar que el permiso existe
      const existingPermission = await prisma.permission.findUnique({
        where: { id }
      });

      if (!existingPermission) {
        return res.status(404).json({
          error: 'Permiso no encontrado',
          message: 'El permiso especificado no existe'
        });
      }

      // Preparar datos para actualizar
      const updateData = {};
      
      if (action) updateData.action = action.toLowerCase();
      if (resource) updateData.resource = resource.toLowerCase();

      // Si se está actualizando, verificar que la nueva combinación no exista
      if (action || resource) {
        const newAction = action ? action.toLowerCase() : existingPermission.action;
        const newResource = resource ? resource.toLowerCase() : existingPermission.resource;

        const duplicatePermission = await prisma.permission.findFirst({
          where: {
            action: newAction,
            resource: newResource,
            NOT: { id: id }
          }
        });

        if (duplicatePermission) {
          return res.status(400).json({
            error: 'Permiso ya existe',
            message: 'Ya existe un permiso con esta combinación de acción y recurso'
          });
        }
      }

      // Actualizar permiso
      const updatedPermission = await prisma.permission.update({
        where: { id },
        data: updateData
      });

      logger.info(`Permiso actualizado: ${updatedPermission.action}:${updatedPermission.resource} por ${req.user.email}`);

      res.json({
        message: 'Permiso actualizado exitosamente',
        permission: updatedPermission
      });

    } catch (error) {
      logger.error('Error al actualizar permiso:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al actualizar el permiso'
      });
    }
  }
);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Eliminar permiso
 * @access  Private (delete:permission)
 */
router.delete('/:id', 
  authenticateToken, 
  authorize('delete', 'permission'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el permiso existe
      const permission = await prisma.permission.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              rolePermissions: true
            }
          }
        }
      });

      if (!permission) {
        return res.status(404).json({
          error: 'Permiso no encontrado',
          message: 'El permiso especificado no existe'
        });
      }

      // No permitir eliminar permiso asignado a roles
      if (permission._count.rolePermissions > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'Este permiso está asignado a uno o más roles. Primero remuévalo de los roles.'
        });
      }

      // Eliminar permiso
      await prisma.permission.delete({
        where: { id }
      });

      logger.info(`Permiso eliminado: ${permission.action}:${permission.resource} por ${req.user.email}`);

      res.json({
        message: 'Permiso eliminado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar permiso:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al eliminar el permiso'
      });
    }
  }
);

/**
 * @route   POST /api/permissions/seed
 * @desc    Crear permisos predefinidos del sistema
 * @access  Private (create:permission) - Solo administrador
 */
router.post('/seed', 
  authenticateToken, 
  authorize('create', 'permission'),
  async (req, res) => {
    try {
      // Solo permitir a administradores
      if (req.user.role.name !== 'Administrador') {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'Solo los administradores pueden ejecutar el seed de permisos'
        });
      }

      const systemPermissions = [
        // Permisos de usuarios
        { action: 'create', resource: 'user' },
        { action: 'read', resource: 'user' },
        { action: 'update', resource: 'user' },
        { action: 'delete', resource: 'user' },
        
        // Permisos de roles
        { action: 'create', resource: 'role' },
        { action: 'read', resource: 'role' },
        { action: 'update', resource: 'role' },
        { action: 'delete', resource: 'role' },
        
        // Permisos de permisos
        { action: 'create', resource: 'permission' },
        { action: 'read', resource: 'permission' },
        { action: 'update', resource: 'permission' },
        { action: 'delete', resource: 'permission' },
        
        // Permisos de departamentos
        { action: 'create', resource: 'department' },
        { action: 'read', resource: 'department' },
        { action: 'update', resource: 'department' },
        { action: 'delete', resource: 'department' },
        
        // Permisos de planificación
        { action: 'create', resource: 'strategic_axis' },
        { action: 'read', resource: 'strategic_axis' },
        { action: 'update', resource: 'strategic_axis' },
        { action: 'delete', resource: 'strategic_axis' },
        { action: 'lock', resource: 'strategic_axis' },
        
        { action: 'create', resource: 'objective' },
        { action: 'read', resource: 'objective' },
        { action: 'update', resource: 'objective' },
        { action: 'delete', resource: 'objective' },
        
        { action: 'create', resource: 'product' },
        { action: 'read', resource: 'product' },
        { action: 'update', resource: 'product' },
        { action: 'delete', resource: 'product' },
        
        { action: 'create', resource: 'activity' },
        { action: 'read', resource: 'activity' },
        { action: 'update', resource: 'activity' },
        { action: 'delete', resource: 'activity' },
        
        { action: 'create', resource: 'indicator' },
        { action: 'read', resource: 'indicator' },
        { action: 'update', resource: 'indicator' },
        { action: 'delete', resource: 'indicator' },
        
        // Permisos de seguimiento
        { action: 'create', resource: 'progress_report' },
        { action: 'read', resource: 'progress_report' },
        { action: 'update', resource: 'progress_report' },
        { action: 'delete', resource: 'progress_report' },
        { action: 'approve', resource: 'progress_report' },
        { action: 'reject', resource: 'progress_report' },
        
        // Permisos de presupuesto
        { action: 'create', resource: 'budget' },
        { action: 'read', resource: 'budget' },
        { action: 'update', resource: 'budget' },
        { action: 'delete', resource: 'budget' },
        
        // Permisos de dashboard
        { action: 'read', resource: 'dashboard' },
        { action: 'export', resource: 'report' }
      ];

      // Crear permisos en lotes (ignorar duplicados)
      await prisma.permission.createMany({
        data: systemPermissions,
        skipDuplicates: true
      });

      logger.info(`Permisos del sistema creados por ${req.user.email}`);

      res.json({
        message: 'Permisos del sistema creados exitosamente',
        count: systemPermissions.length
      });

    } catch (error) {
      logger.error('Error al crear permisos del sistema:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al crear permisos del sistema'
      });
    }
  }
);

module.exports = router;
