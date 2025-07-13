const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const { body, query, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Constants for approval statuses and actions
const APPROVAL_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED', 
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN'
};

const APPROVAL_ACTION = {
  CREATED: 'CREATED',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED', 
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  MODIFIED: 'MODIFIED'
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/approvals/pending
 * @desc    Obtener reportes pendientes de aprobación para el usuario actual
 * @access  Private (requiere permisos de aprobación)
 */
router.get('/pending', 
  auth,
  authorize('approve', 'progress-report'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
    query('departmentId').optional().isUUID().withMessage('ID de departamento inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, departmentId } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const user = req.user;

      // Construir filtros según el rol del usuario
      let where = {
        status: APPROVAL_STATUS.SUBMITTED
      };

      // Si es Director de Área, solo puede ver reportes de su departamento
      if (user.role.name === 'Director de Área') {
        where.OR = [
          {
            activity: {
              product: {
                objective: {
                  strategicAxis: {
                    departmentId: user.departmentId
                  }
                }
              }
            }
          },
          {
            indicator: {
              strategicAxis: {
                departmentId: user.departmentId
              }
            }
          }
        ];
      }

      // Filtro adicional por departamento (para administradores)
      if (departmentId && user.role.name === 'Administrador') {
        where.OR = [
          {
            activity: {
              product: {
                objective: {
                  strategicAxis: {
                    departmentId: departmentId
                  }
                }
              }
            }
          },
          {
            indicator: {
              strategicAxis: {
                departmentId: departmentId
              }
            }
          }
        ];
      }

      const [reports, total] = await Promise.all([
        prisma.progressReport.findMany({
          where,
          include: {
            reportedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: {
                  select: { id: true, name: true }
                }
              }
            },
            activity: {
              select: {
                id: true,
                name: true,
                code: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    objective: {
                      select: {
                        id: true,
                        name: true,
                        strategicAxis: {
                          select: {
                            id: true,
                            name: true,
                            department: {
                              select: { id: true, name: true }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            indicator: {
              select: {
                id: true,
                name: true,
                type: true,
                measurementUnit: true,
                strategicAxis: {
                  select: {
                    id: true,
                    name: true,
                    department: {
                      select: { id: true, name: true }
                    }
                  }
                }
              }
            },
            attachments: {
              select: {
                id: true,
                filename: true,
                size: true,
                mimetype: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: [
            { submittedAt: 'asc' },
            { createdAt: 'asc' }
          ]
        }),
        prisma.progressReport.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        },
        message: `${reports.length} reportes pendientes de aprobación`
      });

    } catch (error) {
      logger.error('Error al obtener reportes pendientes:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor'
      });
    }
  }
);

/**
 * @route   POST /api/approvals/:reportId/approve
 * @desc    Aprobar un reporte de progreso
 * @access  Private (requiere permisos de aprobación)
 */
router.post('/:reportId/approve',
  auth,
  authorize('approve', 'progress-report'),
  [
    param('reportId').isUUID().withMessage('ID de reporte inválido'),
    body('comments').optional().isString().isLength({ max: 1000 }).withMessage('Los comentarios no pueden exceder 1000 caracteres')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { comments } = req.body;
      const user = req.user;

      // Verificar que el reporte existe y está en estado SUBMITTED
      const report = await prisma.progressReport.findUnique({
        where: { id: reportId },
        include: {
          reportedBy: {
            select: { firstName: true, lastName: true, email: true }
          },
          activity: {
            include: {
              product: {
                include: {
                  objective: {
                    include: {
                      strategicAxis: {
                        include: { department: true }
                      }
                    }
                  }
                }
              }
            }
          },
          indicator: {
            include: {
              strategicAxis: {
                include: { department: true }
              }
            }
          }
        }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Reporte no encontrado'
        });
      }

      if (report.status !== APPROVAL_STATUS.SUBMITTED) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `El reporte debe estar en estado SUBMITTED para ser aprobado. Estado actual: ${report.status}`
        });
      }

      // Verificar permisos específicos por departamento
      const reportDepartmentId = report.activity?.product?.objective?.strategicAxis?.departmentId ||
                                 report.indicator?.strategicAxis?.departmentId;

      if (user.role.name === 'Director de Área' && reportDepartmentId !== user.departmentId) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'No tienes permisos para aprobar reportes de este departamento'
        });
      }

      // Aprobar el reporte
      const updatedReport = await prisma.$transaction(async (tx) => {
        // Actualizar el reporte
        const updated = await tx.progressReport.update({
          where: { id: reportId },
          data: {
            status: APPROVAL_STATUS.APPROVED,
            reviewComments: comments,
            reviewedAt: new Date(),
            reviewedById: user.id
          },
          include: {
            reportedBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            reviewedBy: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        });

        // Crear entrada en el historial de aprobaciones
        await tx.reportApprovalHistory.create({
          data: {
            progressReportId: reportId,
            action: APPROVAL_ACTION.APPROVED,
            comments: comments,
            actionById: user.id
          }
        });

        return updated;
      });

      logger.info(`Reporte ${reportId} aprobado por ${user.email}`);

      res.json({
        success: true,
        data: updatedReport,
        message: `Reporte aprobado exitosamente`
      });

    } catch (error) {
      logger.error('Error al aprobar reporte:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor'
      });
    }
  }
);

/**
 * @route   POST /api/approvals/:reportId/reject
 * @desc    Rechazar un reporte de progreso
 * @access  Private (requiere permisos de aprobación)
 */
router.post('/:reportId/reject',
  auth,
  authorize('approve', 'progress-report'),
  [
    param('reportId').isUUID().withMessage('ID de reporte inválido'),
    body('rejectionReason').notEmpty().isString().isLength({ min: 10, max: 1000 }).withMessage('La razón del rechazo es requerida (10-1000 caracteres)'),
    body('comments').optional().isString().isLength({ max: 1000 }).withMessage('Los comentarios no pueden exceder 1000 caracteres')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { rejectionReason, comments } = req.body;
      const user = req.user;

      // Verificar que el reporte existe y está en estado SUBMITTED
      const report = await prisma.progressReport.findUnique({
        where: { id: reportId },
        include: {
          activity: {
            include: {
              product: {
                include: {
                  objective: {
                    include: {
                      strategicAxis: {
                        include: { department: true }
                      }
                    }
                  }
                }
              }
            }
          },
          indicator: {
            include: {
              strategicAxis: {
                include: { department: true }
              }
            }
          }
        }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          data: null,
          message: 'Reporte no encontrado'
        });
      }

      if (report.status !== APPROVAL_STATUS.SUBMITTED) {
        return res.status(400).json({
          success: false,
          data: null,
          message: `El reporte debe estar en estado SUBMITTED para ser rechazado. Estado actual: ${report.status}`
        });
      }

      // Verificar permisos específicos por departamento
      const reportDepartmentId = report.activity?.product?.objective?.strategicAxis?.departmentId ||
                                 report.indicator?.strategicAxis?.departmentId;

      if (user.role.name === 'Director de Área' && reportDepartmentId !== user.departmentId) {
        return res.status(403).json({
          success: false,
          data: null,
          message: 'No tienes permisos para rechazar reportes de este departamento'
        });
      }

      // Rechazar el reporte
      const updatedReport = await prisma.$transaction(async (tx) => {
        // Actualizar el reporte
        const updated = await tx.progressReport.update({
          where: { id: reportId },
          data: {
            status: APPROVAL_STATUS.REJECTED,
            rejectionReason: rejectionReason,
            reviewComments: comments,
            reviewedAt: new Date(),
            reviewedById: user.id
          },
          include: {
            reportedBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            reviewedBy: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        });

        // Crear entrada en el historial de aprobaciones
        await tx.reportApprovalHistory.create({
          data: {
            progressReportId: reportId,
            action: APPROVAL_ACTION.REJECTED,
            comments: `${rejectionReason}${comments ? ' | ' + comments : ''}`,
            actionById: user.id
          }
        });

        return updated;
      });

      logger.info(`Reporte ${reportId} rechazado por ${user.email}: ${rejectionReason}`);

      res.json({
        success: true,
        data: updatedReport,
        message: `Reporte rechazado`
      });

    } catch (error) {
      logger.error('Error al rechazar reporte:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor'
      });
    }
  }
);

/**
 * @route   GET /api/approvals/:reportId/history
 * @desc    Obtener historial de aprobaciones de un reporte
 * @access  Private
 */
router.get('/:reportId/history',
  auth,
  [
    param('reportId').isUUID().withMessage('ID de reporte inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { reportId } = req.params;

      const history = await prisma.reportApprovalHistory.findMany({
        where: { progressReportId: reportId },
        include: {
          actionBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.json({
        success: true,
        data: history,
        message: `${history.length} entradas en el historial`
      });

    } catch (error) {
      logger.error('Error al obtener historial de aprobaciones:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor'
      });
    }
  }
);

/**
 * @route   GET /api/approvals/my-reports
 * @desc    Obtener reportes del usuario actual con su estado de aprobación
 * @access  Private
 */
router.get('/my-reports',
  auth,
  [
    query('status').optional().isIn(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'WITHDRAWN']).withMessage('Estado inválido'),
    query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const user = req.user;

      let where = {
        reportedById: user.id
      };

      if (status) {
        where.status = status;
      }

      const [reports, total] = await Promise.all([
        prisma.progressReport.findMany({
          where,
          include: {
            activity: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            indicator: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            reviewedBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            _count: {
              select: {
                attachments: true,
                approvalHistory: true
              }
            }
          },
          skip,
          take: parseInt(limit),
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.progressReport.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        },
        message: `${reports.length} reportes encontrados`
      });

    } catch (error) {
      logger.error('Error al obtener reportes del usuario:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor'
      });
    }
  }
);

/**
 * @route   GET /api/approvals/stats
 * @desc    Obtener estadísticas de aprobaciones
 * @access  Private (requiere permisos de aprobación)
 */
router.get('/stats',
  auth,
  authorize('approve', 'progress-report'),
  async (req, res) => {
    try {
      const user = req.user;

      // Construir filtros según el rol del usuario
      let baseWhere = {};

      if (user.role.name === 'Director de Área') {
        baseWhere.OR = [
          {
            activity: {
              product: {
                objective: {
                  strategicAxis: {
                    departmentId: user.departmentId
                  }
                }
              }
            }
          },
          {
            indicator: {
              strategicAxis: {
                departmentId: user.departmentId
              }
            }
          }
        ];
      }

      const [
        pendingCount,
        approvedCount,
        rejectedCount,
        totalCount,
        recentApprovals
      ] = await Promise.all([
        prisma.progressReport.count({
          where: { ...baseWhere, status: APPROVAL_STATUS.SUBMITTED }
        }),
        prisma.progressReport.count({
          where: { ...baseWhere, status: APPROVAL_STATUS.APPROVED }
        }),
        prisma.progressReport.count({
          where: { ...baseWhere, status: APPROVAL_STATUS.REJECTED }
        }),
        prisma.progressReport.count({ where: baseWhere }),
        prisma.progressReport.findMany({
          where: {
            ...baseWhere,
            status: { in: [APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED] },
            reviewedAt: { not: null }
          },
          include: {
            reportedBy: {
              select: { firstName: true, lastName: true }
            },
            reviewedBy: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { reviewedAt: 'desc' },
          take: 5
        })
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            total: totalCount,
            approvalRate: totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : 0
          },
          recentApprovals
        },
        message: 'Estadísticas de aprobaciones obtenidas'
      });

    } catch (error) {
      logger.error('Error al obtener estadísticas de aprobaciones:', error);
      res.status(500).json({
        success: false,
        data: null,
        message: 'Error interno del servidor'
      });
    }
  }
);

module.exports = router;
