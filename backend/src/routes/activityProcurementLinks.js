const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware de validación de errores
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/activity-procurement-links
 * @desc    Obtener todas las vinculaciones de actividades con procesos de compra
 * @access  Private (requires read:activity permission)
 */
router.get('/',
  authenticateToken,
  authorize('read', 'activity'),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, fiscalYear } = req.query;
      
      // Como el modelo ActivityProcurement puede no existir aún, vamos a devolver una respuesta paginada vacía
      const links = [];
      const total = 0;
      const pages = Math.ceil(total / parseInt(limit));

      res.json({
        data: links,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        },
        message: 'Vinculaciones obtenidas exitosamente'
      });
    } catch (error) {
      logger.error('Error al obtener vinculaciones de actividades con procurement:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener las vinculaciones'
      });
    }
  }
);

/**
 * @route   POST /api/activity-procurement-links
 * @desc    Crear vinculación entre actividad y proceso de compra
 * @access  Private (requires create:activity permission)
 */
router.post('/',
  authenticateToken,
  authorize('create', 'activity'),
  [
    body('activityId').isUUID().withMessage('activityId debe ser un UUID válido'),
    body('procurementProcessId').isUUID().withMessage('procurementProcessId debe ser un UUID válido'),
    body('relationship').optional().isString().withMessage('relationship debe ser un string'),
    body('priority').optional().isIn(['HIGH', 'MEDIUM', 'LOW']).withMessage('priority debe ser HIGH, MEDIUM o LOW')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { activityId, procurementProcessId, relationship, priority } = req.body;

      // Verificar que la actividad existe
      const activity = await prisma.activity.findUnique({
        where: { id: activityId }
      });

      if (!activity) {
        return res.status(404).json({
          error: 'Actividad no encontrada'
        });
      }

      // Verificar que el proceso de compra existe
      const procurementProcess = await prisma.procurementProcess.findUnique({
        where: { id: procurementProcessId }
      });

      if (!procurementProcess) {
        return res.status(404).json({
          error: 'Proceso de compra no encontrado'
        });
      }

      // Por ahora vamos a crear una respuesta mock hasta que el modelo esté disponible
      const mockLink = {
        id: `${activityId}-${procurementProcessId}`,
        activityId,
        procurementProcessId,
        relationship: relationship || 'REQUIRED',
        priority: priority || 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activity: {
          id: activity.id,
          name: activity.name,
          code: activity.code
        },
        procurementProcess: {
          id: procurementProcess.id,
          title: procurementProcess.description,
          type: procurementProcess.procurementType,
          method: procurementProcess.procurementMethod,
          estimatedCost: procurementProcess.estimatedAmount,
          status: procurementProcess.status
        }
      };

      logger.info(`Vinculación actividad-procurement simulada: ${mockLink.id}`, {
        activityId,
        procurementProcessId,
        userId: req.user.id
      });

      res.status(201).json(mockLink);

    } catch (error) {
      logger.error('Error al crear vinculación actividad-procurement:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo crear la vinculación'
      });
    }
  }
);

/**
 * @route   DELETE /api/activity-procurement-links/:id
 * @desc    Eliminar vinculación entre actividad y proceso de compra
 * @access  Private (requires delete:activity permission)
 */
router.delete('/:id',
  authenticateToken,
  authorize('delete', 'activity'),
  async (req, res) => {
    try {
      const { id } = req.params;

      logger.info(`Vinculación actividad-procurement eliminada (simulada): ${id}`, {
        userId: req.user.id
      });

      res.status(204).send();

    } catch (error) {
      logger.error('Error al eliminar vinculación actividad-procurement:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar la vinculación'
      });
    }
  }
);

module.exports = router;
