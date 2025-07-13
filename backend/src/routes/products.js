const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware para validar errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Datos inválidos',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/products
 * @desc    Obtener todos los productos/servicios con filtros opcionales
 * @access  Private (requiere permiso read:product)
 */
router.get('/', 
  auth, 
  authorize('read', 'product'),
  [
    query('objectiveId').optional().isUUID().withMessage('objectiveId debe ser un UUID válido'),
    query('type').optional().isIn(['PRODUCT', 'SERVICE']).withMessage('type debe ser PRODUCT o SERVICE'),
    query('active').optional().isBoolean().withMessage('active debe ser true o false')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { objectiveId, type, active } = req.query;
      
      // Construir filtros
      const where = {};
      
      if (objectiveId) {
        where.objectiveId = objectiveId;
      }
      
      if (type) {
        where.type = type;
      }
      
      if (active !== undefined) {
        where.isActive = active === 'true';
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          objective: {
            include: {
              strategicAxis: {
                include: {
                  department: true
                }
              }
            }
          },
          _count: {
            select: {
              activities: true,
              indicators: true
            }
          }
        },
        orderBy: [
          { objective: { strategicAxis: { code: 'asc' } } },
          { objective: { code: 'asc' } },
          { order: 'asc' },
          { code: 'asc' }
        ]
      });

      logger.info(`Productos consultados: ${products.length} encontrados`, {
        service: 'poa-api',
        userId: req.user.userId,
        filters: { objectiveId, type, active }
      });

      res.json({
        success: true,
        data: products,
        message: `${products.length} productos encontrados`
      });
    } catch (error) {
      logger.error('Error al obtener productos:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error al obtener los productos'
      });
    }
  }
);

/**
 * @route   GET /api/products/:id
 * @desc    Obtener un producto específico por ID
 * @access  Private (requiere permiso read:product)
 */
router.get('/:id',
  auth,
  authorize('read', 'product'),
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          objective: {
            include: {
              strategicAxis: {
                include: {
                  department: true
                }
              }
            }
          },
          activities: {
            orderBy: { order: 'asc' }
          },
          indicators: {
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              activities: true,
              indicators: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'El producto especificado no existe'
        });
      }

      logger.info(`Producto consultado: ${product.code}`, {
        service: 'poa-api',
        userId: req.user.userId,
        productId: id
      });

      res.json({
        success: true,
        data: product,
        message: 'Producto encontrado'
      });
    } catch (error) {
      logger.error('Error al obtener producto:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error al obtener el producto'
      });
    }
  }
);

/**
 * @route   POST /api/products
 * @desc    Crear un nuevo producto/servicio
 * @access  Private (requiere permiso create:product)
 */
router.post('/',
  auth,
  authorize('create', 'product'),
  [
    body('name')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('code')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('El código debe tener entre 2 y 20 caracteres')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage('El código solo puede contener letras mayúsculas, números y guiones'),
    body('type')
      .isIn(['PRODUCT', 'SERVICE'])
      .withMessage('El tipo debe ser PRODUCT o SERVICE'),
    body('objectiveId')
      .isUUID()
      .withMessage('objectiveId debe ser un UUID válido'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('El orden debe ser un número entero no negativo')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, code, type, objectiveId, order = 0 } = req.body;

      // Verificar que el objetivo existe
      const objective = await prisma.objective.findUnique({
        where: { id: objectiveId },
        include: {
          strategicAxis: true
        }
      });

      if (!objective) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'El objetivo especificado no existe'
        });
      }

      // Verificar que el código es único dentro del objetivo
      const existingProduct = await prisma.product.findFirst({
        where: {
          objectiveId,
          code
        }
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          data: null,
          message: `Ya existe un producto con el código "${code}" en este objetivo`
        });
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          code,
          type,
          objectiveId,
          order
        },
        include: {
          objective: {
            include: {
              strategicAxis: {
                include: {
                  department: true
                }
              }
            }
          },
          _count: {
            select: {
              activities: true,
              indicators: true
            }
          }
        }
      });

      logger.info(`Producto creado: ${product.code}`, {
        service: 'poa-api',
        userId: req.user.userId,
        productId: product.id,
        objectiveId
      });

      res.status(201).json({
        success: true,
        data: product,
        message: `Producto "${product.name}" creado exitosamente`
      });
    } catch (error) {
      logger.error('Error al crear producto:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error al crear el producto'
      });
    }
  }
);

/**
 * @route   PUT /api/products/:id
 * @desc    Actualizar un producto existente
 * @access  Private (requiere permiso update:product)
 */
router.put('/:id',
  auth,
  authorize('update', 'product'),
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido'),
    body('name')
      .trim()
      .isLength({ min: 3, max: 255 })
      .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('code')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('El código debe tener entre 2 y 20 caracteres')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage('El código solo puede contener letras mayúsculas, números y guiones'),
    body('type')
      .isIn(['PRODUCT', 'SERVICE'])
      .withMessage('El tipo debe ser PRODUCT o SERVICE'),
    body('objectiveId')
      .isUUID()
      .withMessage('objectiveId debe ser un UUID válido'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('El orden debe ser un número entero no negativo'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive debe ser true o false')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, code, type, objectiveId, order, isActive } = req.body;

      // Verificar que el producto existe
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      });

      if (!existingProduct) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          message: 'El producto especificado no existe'
        });
      }

      // Verificar que el objetivo existe
      const objective = await prisma.objective.findUnique({
        where: { id: objectiveId }
      });

      if (!objective) {
        return res.status(404).json({
          error: 'Objetivo no encontrado',
          message: 'El objetivo especificado no existe'
        });
      }

      // Verificar que el código es único dentro del objetivo (excluyendo el producto actual)
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          objectiveId,
          code,
          id: { not: id }
        }
      });

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          data: null,
          message: `Ya existe otro producto con el código "${code}" en este objetivo`
        });
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          code,
          type,
          objectiveId,
          order,
          ...(isActive !== undefined && { isActive })
        },
        include: {
          objective: {
            include: {
              strategicAxis: {
                include: {
                  department: true
                }
              }
            }
          },
          _count: {
            select: {
              activities: true,
              indicators: true
            }
          }
        }
      });

      logger.info(`Producto actualizado: ${updatedProduct.code}`, {
        service: 'poa-api',
        userId: req.user.userId,
        productId: id
      });

      res.json({
        success: true,
        data: updatedProduct,
        message: `Producto "${updatedProduct.name}" actualizado exitosamente`
      });
    } catch (error) {
      logger.error('Error al actualizar producto:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error al actualizar el producto'
      });
    }
  }
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Eliminar un producto
 * @access  Private (requiere permiso delete:product)
 */
router.delete('/:id',
  auth,
  authorize('delete', 'product'),
  [
    param('id').isUUID().withMessage('ID debe ser un UUID válido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Verificar que el producto existe
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              activities: true,
              indicators: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'El producto especificado no existe'
        });
      }

      // Verificar dependencias
      if (product._count.activities > 0) {
        return res.status(409).json({
          success: false,
          data: null,
          message: `No se puede eliminar el producto porque tiene ${product._count.activities} actividades asociadas`
        });
      }

      if (product._count.indicators > 0) {
        return res.status(409).json({
          success: false,
          data: null,
          message: `No se puede eliminar el producto porque tiene ${product._count.indicators} indicadores asociados`
        });
      }

      await prisma.product.delete({
        where: { id }
      });

      logger.info(`Producto eliminado: ${product.code}`, {
        service: 'poa-api',
        userId: req.user.userId,
        productId: id
      });

      res.json({
        success: true,
        data: {
          id: product.id,
          code: product.code,
          name: product.name
        },
        message: `Producto "${product.name}" eliminado exitosamente`
      });
    } catch (error) {
      logger.error('Error al eliminar producto:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error al eliminar el producto'
      });
    }
  }
);

module.exports = router;
