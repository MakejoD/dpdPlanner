const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { validateDepartment, handleValidationErrors } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/departments
 * @desc    Obtener lista de departamentos
 * @access  Private (read:department)
 */
router.get('/', 
  authenticateToken, 
  authorize('read', 'department'), 
  async (req, res) => {
    try {
      const { includeHierarchy = false, parentId } = req.query;

      let where = {};
      
      if (parentId === 'null' || parentId === '') {
        where.parentId = null; // Solo departamentos raíz
      } else if (parentId) {
        where.parentId = parentId; // Hijos de un departamento específico
      }

      const departments = await prisma.department.findMany({
        where,
        include: {
          parent: true,
          children: includeHierarchy === 'true',
          _count: {
            select: {
              users: true,
              children: true,
              strategicAxes: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json({
        success: true,
        data: departments,
        message: `${departments.length} departamentos encontrados`
      });

    } catch (error) {
      logger.error('Error al obtener departamentos:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener la lista de departamentos'
      });
    }
  }
);

/**
 * @route   GET /api/departments/tree
 * @desc    Obtener estructura completa de departamentos
 * @access  Private (read:department)
 */
router.get('/tree', 
  authenticateToken, 
  authorize('read', 'department'), 
  async (req, res) => {
    try {
      // Función recursiva para construir el árbol
      const buildTree = async (parentId = null) => {
        const departments = await prisma.department.findMany({
          where: { parentId },
          include: {
            _count: {
              select: {
                users: true,
                strategicAxes: true
              }
            }
          },
          orderBy: { name: 'asc' }
        });

        return Promise.all(departments.map(async (dept) => ({
          ...dept,
          children: await buildTree(dept.id)
        })));
      };

      const tree = await buildTree();
      res.json(tree);

    } catch (error) {
      logger.error('Error al obtener árbol de departamentos:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener la estructura de departamentos'
      });
    }
  }
);

/**
 * @route   GET /api/departments/:id
 * @desc    Obtener departamento por ID
 * @access  Private (read:department)
 */
router.get('/:id', 
  authenticateToken, 
  authorize('read', 'department'), 
  async (req, res) => {
    try {
      const { id } = req.params;

      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          parent: true,
          children: {
            include: {
              _count: {
                select: {
                  users: true
                }
              }
            }
          },
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          },
          strategicAxes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              code: true,
              year: true
            }
          }
        }
      });

      if (!department) {
        return res.status(404).json({
          error: 'Departamento no encontrado',
          message: 'El departamento solicitado no existe'
        });
      }

      res.json(department);

    } catch (error) {
      logger.error('Error al obtener departamento:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al obtener el departamento'
      });
    }
  }
);

/**
 * @route   POST /api/departments
 * @desc    Crear nuevo departamento
 * @access  Private (create:department)
 */
router.post('/', 
  authenticateToken, 
  authorize('create', 'department'),
  validateDepartment,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, code, parentId } = req.body;

      // Verificar si el nombre ya existe
      const existingDepartment = await prisma.department.findUnique({
        where: { name }
      });

      if (existingDepartment) {
        return res.status(400).json({
          error: 'Nombre ya existe',
          message: 'Ya existe un departamento con este nombre'
        });
      }

      // Verificar código único si se proporciona
      if (code) {
        const existingCode = await prisma.department.findUnique({
          where: { code }
        });

        if (existingCode) {
          return res.status(400).json({
            error: 'Código ya existe',
            message: 'Ya existe un departamento con este código'
          });
        }
      }

      // Verificar departamento padre si se proporciona
      if (parentId) {
        const parent = await prisma.department.findUnique({
          where: { id: parentId }
        });

        if (!parent) {
          return res.status(400).json({
            error: 'Departamento padre no válido',
            message: 'El departamento padre especificado no existe'
          });
        }
      }

      // Crear departamento
      const newDepartment = await prisma.department.create({
        data: {
          name,
          description,
          code,
          parentId
        },
        include: {
          parent: true
        }
      });

      logger.info(`Departamento creado: ${newDepartment.name} por ${req.user.email}`);

      res.status(201).json({
        message: 'Departamento creado exitosamente',
        department: newDepartment
      });

    } catch (error) {
      logger.error('Error al crear departamento:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al crear el departamento'
      });
    }
  }
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Actualizar departamento
 * @access  Private (update:department)
 */
router.put('/:id', 
  authenticateToken, 
  authorize('update', 'department'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, code, parentId, isActive } = req.body;

      // Verificar que el departamento existe
      const existingDepartment = await prisma.department.findUnique({
        where: { id }
      });

      if (!existingDepartment) {
        return res.status(404).json({
          error: 'Departamento no encontrado',
          message: 'El departamento especificado no existe'
        });
      }

      // Verificar que no se esté intentando establecer como padre a sí mismo o a sus descendientes
      if (parentId && parentId === id) {
        return res.status(400).json({
          error: 'Referencia circular',
          message: 'Un departamento no puede ser padre de sí mismo'
        });
      }

      // Preparar datos para actualizar
      const updateData = {};
      
      if (name && name !== existingDepartment.name) {
        // Verificar que el nuevo nombre no esté en uso
        const nameExists = await prisma.department.findUnique({
          where: { name }
        });
        
        if (nameExists) {
          return res.status(400).json({
            error: 'Nombre ya existe',
            message: 'Ya existe un departamento con este nombre'
          });
        }
        
        updateData.name = name;
      }

      if (code && code !== existingDepartment.code) {
        // Verificar que el nuevo código no esté en uso
        const codeExists = await prisma.department.findUnique({
          where: { code }
        });
        
        if (codeExists) {
          return res.status(400).json({
            error: 'Código ya existe',
            message: 'Ya existe un departamento con este código'
          });
        }
        
        updateData.code = code;
      }

      if (description !== undefined) updateData.description = description;
      if (parentId !== undefined) updateData.parentId = parentId;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Actualizar departamento
      const updatedDepartment = await prisma.department.update({
        where: { id },
        data: updateData,
        include: {
          parent: true,
          children: true
        }
      });

      logger.info(`Departamento actualizado: ${updatedDepartment.name} por ${req.user.email}`);

      res.json({
        message: 'Departamento actualizado exitosamente',
        department: updatedDepartment
      });

    } catch (error) {
      logger.error('Error al actualizar departamento:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al actualizar el departamento'
      });
    }
  }
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Eliminar departamento
 * @access  Private (delete:department)
 */
router.delete('/:id', 
  authenticateToken, 
  authorize('delete', 'department'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el departamento existe
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              children: true,
              strategicAxes: true
            }
          }
        }
      });

      if (!department) {
        return res.status(404).json({
          error: 'Departamento no encontrado',
          message: 'El departamento especificado no existe'
        });
      }

      // No permitir eliminar departamento con usuarios asignados
      if (department._count.users > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'Este departamento tiene usuarios asignados. Primero reasigne los usuarios.'
        });
      }

      // No permitir eliminar departamento con subdepartamentos
      if (department._count.children > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'Este departamento tiene subdepartamentos. Primero elimine o reasigne los subdepartamentos.'
        });
      }

      // No permitir eliminar departamento con ejes estratégicos
      if (department._count.strategicAxes > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'Este departamento tiene ejes estratégicos asociados.'
        });
      }

      // Eliminar departamento
      await prisma.department.delete({
        where: { id }
      });

      logger.info(`Departamento eliminado: ${department.name} por ${req.user.email}`);

      res.json({
        message: 'Departamento eliminado exitosamente'
      });

    } catch (error) {
      logger.error('Error al eliminar departamento:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al eliminar el departamento'
      });
    }
  }
);

module.exports = router;
