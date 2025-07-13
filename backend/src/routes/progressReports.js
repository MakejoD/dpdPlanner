const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Configuración de multer para archivos adjuntos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/progress-reports';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar nombre único: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: fileFilter
});

// GET /api/progress-reports - Obtener reportes de progreso
router.get('/', auth, async (req, res) => {
  try {
    const { user } = req;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      activityId, 
      indicatorId, 
      periodType,
      reportedBy 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construir filtros basados en el rol del usuario
    let whereClause = {};

    // Si es técnico registrador, solo ver sus propios reportes
    if (user.role.name === 'Técnico Registrador') {
      whereClause.reportedById = user.id;
    }
    // Si es director de área, ver reportes de su departamento
    else if (user.role.name === 'Director de Área') {
      whereClause.reportedBy = {
        departmentId: user.departmentId
      };
    }
    // Administrador y Director de Planificación pueden ver todos

    // Aplicar filtros adicionales
    if (status) whereClause.status = status;
    if (activityId) whereClause.activityId = activityId;
    if (indicatorId) whereClause.indicatorId = indicatorId;
    if (periodType) whereClause.periodType = periodType;
    if (reportedBy) whereClause.reportedById = reportedBy;

    const [reports, totalCount] = await Promise.all([
      prisma.progressReport.findMany({
        where: whereClause,
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
          },
          indicator: true,
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          attachments: true
        },
        skip,
        take: parseInt(limit),
        orderBy: [
          { createdAt: 'desc' }
        ]
      }),
      prisma.progressReport.count({ where: whereClause })
    ]);

    res.json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalReports: totalCount,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo reportes de progreso:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// GET /api/progress-reports/my-assignments - Obtener actividades e indicadores asignados
router.get('/my-assignments', auth, authorize('read', 'progress_report'), async (req, res) => {
  try {
    const { user } = req;

    // Obtener actividades asignadas al usuario
    const activities = await prisma.activity.findMany({
      where: {
        assignments: {
          some: {
            userId: user.id
          }
        },
        isActive: true
      },
      include: {
        product: {
          include: {
            objective: {
              include: {
                strategicAxis: true
              }
            }
          }
        },
        indicators: {
          where: {
            isActive: true
          }
        },
        progressReports: {
          where: {
            reportedById: user.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Solo el último reporte
        }
      }
    });

    // Obtener indicadores directamente asignados (no vinculados a actividades)
    const directIndicators = await prisma.indicator.findMany({
      where: {
        indicatorAssignments: {
          some: {
            userId: user.id
          }
        },
        activityId: null, // Indicadores no vinculados a actividades
        isActive: true
      },
      include: {
        strategicAxis: true,
        objective: {
          include: {
            strategicAxis: true
          }
        },
        product: {
          include: {
            objective: {
              include: {
                strategicAxis: true
              }
            }
          }
        },
        progressReports: {
          where: {
            reportedById: user.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    res.json({
      activities,
      directIndicators
    });

  } catch (error) {
    console.error('Error obteniendo asignaciones:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// POST /api/progress-reports - Crear nuevo reporte de progreso
router.post('/', auth, authorize('create', 'progress_report'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { user } = req;
    const {
      activityId,
      indicatorId,
      periodType, // 'trimestral', 'mensual', 'semanal'
      period, // '2024-Q1', '2024-01', etc.
      currentValue,
      targetValue,
      executionPercentage,
      qualitativeComments,
      challenges,
      nextSteps
    } = req.body;

    // Validaciones
    if (!activityId && !indicatorId) {
      return res.status(400).json({
        error: 'Debe especificar una actividad o un indicador'
      });
    }

    if (activityId && indicatorId) {
      return res.status(400).json({
        error: 'No puede especificar tanto actividad como indicador'
      });
    }

    // Verificar que el usuario tenga asignada la actividad/indicador
    if (activityId) {
      const activity = await prisma.activity.findFirst({
        where: {
          id: activityId,
          assignments: {
            some: {
              userId: user.id
            }
          }
        }
      });

      if (!activity) {
        return res.status(403).json({
          error: 'No tiene permisos para reportar esta actividad'
        });
      }
    }

    if (indicatorId) {
      const indicator = await prisma.indicator.findFirst({
        where: {
          id: indicatorId,
          indicatorAssignments: {
            some: {
              userId: user.id
            }
          }
        }
      });

      if (!indicator) {
        return res.status(403).json({
          error: 'No tiene permisos para reportar este indicador'
        });
      }
    }

    // Verificar que no existe un reporte para el mismo período
    const existingReport = await prisma.progressReport.findFirst({
      where: {
        reportedById: user.id,
        activityId: activityId || null,
        indicatorId: indicatorId || null,
        periodType,
        period
      }
    });

    if (existingReport) {
      return res.status(400).json({
        error: 'Ya existe un reporte para este período'
      });
    }

    // Crear el reporte usando transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el reporte
      const report = await tx.progressReport.create({
        data: {
          activityId: activityId || null,
          indicatorId: indicatorId || null,
          reportedById: user.id,
          periodType,
          period,
          currentValue: parseFloat(currentValue) || 0,
          targetValue: parseFloat(targetValue) || 0,
          executionPercentage: parseFloat(executionPercentage) || 0,
          qualitativeComments: qualitativeComments || '',
          challenges: challenges || '',
          nextSteps: nextSteps || '',
          status: 'pendiente' // pendiente, aprobado, rechazado
        }
      });

      // Crear archivos adjuntos si existen
      if (req.files && req.files.length > 0) {
        const attachments = req.files.map(file => ({
          progressReportId: report.id,
          filename: file.originalname,
          filepath: file.path,
          size: file.size,
          mimetype: file.mimetype
        }));

        await tx.progressReportAttachment.createMany({
          data: attachments
        });
      }

      return report;
    });

    // Obtener el reporte completo con relaciones
    const completeReport = await prisma.progressReport.findUnique({
      where: { id: result.id },
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
        },
        indicator: true,
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: true
      }
    });

    res.status(201).json(completeReport);

  } catch (error) {
    console.error('Error creando reporte de progreso:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// PUT /api/progress-reports/:id - Actualizar reporte de progreso
router.put('/:id', auth, authorize('update', 'progress_report'), upload.array('attachments', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const {
      currentValue,
      targetValue,
      executionPercentage,
      qualitativeComments,
      challenges,
      nextSteps
    } = req.body;

    // Obtener el reporte actual
    const existingReport = await prisma.progressReport.findUnique({
      where: { id },
      include: {
        reportedBy: true
      }
    });

    if (!existingReport) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    // Verificar permisos: solo el autor puede editar y solo si está pendiente
    if (existingReport.reportedById !== user.id) {
      return res.status(403).json({
        error: 'No tiene permisos para editar este reporte'
      });
    }

    if (existingReport.status !== 'pendiente') {
      return res.status(400).json({
        error: 'Solo se pueden editar reportes pendientes'
      });
    }

    // Actualizar usando transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar el reporte
      const updatedReport = await tx.progressReport.update({
        where: { id },
        data: {
          currentValue: parseFloat(currentValue) || existingReport.currentValue,
          targetValue: parseFloat(targetValue) || existingReport.targetValue,
          executionPercentage: parseFloat(executionPercentage) || existingReport.executionPercentage,
          qualitativeComments: qualitativeComments || existingReport.qualitativeComments,
          challenges: challenges || existingReport.challenges,
          nextSteps: nextSteps || existingReport.nextSteps,
          updatedAt: new Date()
        }
      });

      // Agregar nuevos archivos adjuntos si existen
      if (req.files && req.files.length > 0) {
        const attachments = req.files.map(file => ({
          progressReportId: id,
          filename: file.originalname,
          filepath: file.path,
          size: file.size,
          mimetype: file.mimetype
        }));

        await tx.progressReportAttachment.createMany({
          data: attachments
        });
      }

      return updatedReport;
    });

    // Obtener el reporte completo
    const completeReport = await prisma.progressReport.findUnique({
      where: { id },
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
        },
        indicator: true,
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: true
      }
    });

    res.json(completeReport);

  } catch (error) {
    console.error('Error actualizando reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// PUT /api/progress-reports/:id/review - Aprobar/Rechazar reporte
router.put('/:id/review', auth, authorize('approve', 'progress_report'), async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { action, reviewComments } = req.body; // action: 'aprobar' | 'rechazar'

    if (!['aprobar', 'rechazar'].includes(action)) {
      return res.status(400).json({
        error: 'Acción debe ser "aprobar" o "rechazar"'
      });
    }

    // Obtener el reporte
    const report = await prisma.progressReport.findUnique({
      where: { id },
      include: {
        reportedBy: {
          include: {
            department: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    // Verificar que el usuario puede revisar este reporte
    // Director de Área solo puede revisar reportes de su departamento
    if (user.role.name === 'Director de Área') {
      if (report.reportedBy.departmentId !== user.departmentId) {
        return res.status(403).json({
          error: 'Solo puede revisar reportes de su departamento'
        });
      }
    }

    if (report.status !== 'pendiente') {
      return res.status(400).json({
        error: 'Solo se pueden revisar reportes pendientes'
      });
    }

    // Actualizar el reporte
    const updatedReport = await prisma.progressReport.update({
      where: { id },
      data: {
        status: action === 'aprobar' ? 'aprobado' : 'rechazado',
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewComments: reviewComments || ''
      },
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
        },
        indicator: true,
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        attachments: true
      }
    });

    res.json(updatedReport);

  } catch (error) {
    console.error('Error revisando reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// DELETE /api/progress-reports/:id - Eliminar reporte
router.delete('/:id', auth, authorize('delete', 'progress_report'), async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const report = await prisma.progressReport.findUnique({
      where: { id },
      include: {
        attachments: true
      }
    });

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    // Solo el autor puede eliminar y solo si está pendiente
    if (report.reportedById !== user.id && user.role.name !== 'Administrador') {
      return res.status(403).json({
        error: 'No tiene permisos para eliminar este reporte'
      });
    }

    if (report.status !== 'pendiente' && user.role.name !== 'Administrador') {
      return res.status(400).json({
        error: 'Solo se pueden eliminar reportes pendientes'
      });
    }

    // Eliminar archivos físicos
    if (report.attachments.length > 0) {
      report.attachments.forEach(attachment => {
        if (fs.existsSync(attachment.filepath)) {
          fs.unlinkSync(attachment.filepath);
        }
      });
    }

    // Eliminar reporte (cascada eliminará attachments)
    await prisma.progressReport.delete({
      where: { id }
    });

    res.json({ message: 'Reporte eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando reporte:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// DELETE /api/progress-reports/:id/attachments/:attachmentId - Eliminar archivo adjunto
router.delete('/:id/attachments/:attachmentId', auth, async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const { user } = req;

    // Verificar que el reporte pertenece al usuario
    const report = await prisma.progressReport.findUnique({
      where: { id }
    });

    if (!report) {
      return res.status(404).json({
        error: 'Reporte no encontrado'
      });
    }

    if (report.reportedById !== user.id && user.role.name !== 'Administrador') {
      return res.status(403).json({
        error: 'No tiene permisos para eliminar archivos de este reporte'
      });
    }

    // Obtener el archivo
    const attachment = await prisma.progressReportAttachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) {
      return res.status(404).json({
        error: 'Archivo no encontrado'
      });
    }

    // Eliminar archivo físico
    if (fs.existsSync(attachment.filepath)) {
      fs.unlinkSync(attachment.filepath);
    }

    // Eliminar registro de la base de datos
    await prisma.progressReportAttachment.delete({
      where: { id: attachmentId }
    });

    res.json({ message: 'Archivo eliminado exitosamente' });

  } catch (error) {
    console.error('Error eliminando archivo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// GET /api/progress-reports/download/:attachmentId - Descargar archivo adjunto
router.get('/download/:attachmentId', auth, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const { user } = req;

    const attachment = await prisma.progressReportAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        progressReport: {
          include: {
            reportedBy: true
          }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({
        error: 'Archivo no encontrado'
      });
    }

    // Verificar permisos de acceso al archivo
    const canAccess = 
      attachment.progressReport.reportedById === user.id || // Es el autor
      user.role.name === 'Administrador' || // Es administrador
      user.role.name === 'Director de Planificación' || // Director de planificación
      (user.role.name === 'Director de Área' && 
       attachment.progressReport.reportedBy.departmentId === user.departmentId); // Director del mismo departamento

    if (!canAccess) {
      return res.status(403).json({
        error: 'No tiene permisos para descargar este archivo'
      });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(attachment.filepath)) {
      return res.status(404).json({
        error: 'Archivo no encontrado en el servidor'
      });
    }

    // Descargar archivo
    res.download(attachment.filepath, attachment.filename);

  } catch (error) {
    console.error('Error descargando archivo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

module.exports = router;
