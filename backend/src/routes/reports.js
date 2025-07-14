// Ruta: /api/reports - Generación de documentos POA
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

const prisma = new PrismaClient();

// Middleware para validar permisos de exportación
const validateExportPermission = authorize('export', 'report');

/**
 * POST /api/reports/poa-preview
 * Generar vista previa del documento POA
 */
router.post('/poa-preview', auth, validateExportPermission, async (req, res) => {
  try {
    const { type, departmentId, year, includeIndicators, includeBudget } = req.body;

    // Obtener estructura POA
    const strategicAxes = await prisma.strategicAxis.findMany({
      where: { year: parseInt(year) },
      include: {
        objectives: {
          include: {
            products: {
              include: {
                activities: {
                  include: {
                    indicators: includeIndicators,
                    budgetExecutions: includeBudget,
                    assignments: {
                      include: {
                        department: true,
                        user: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Filtrar actividades por departamento si es necesario
    if (type === 'departmental' && departmentId) {
      strategicAxes.forEach(eje => {
        eje.objectives.forEach(objetivo => {
          objetivo.products.forEach(producto => {
            producto.activities = producto.activities.filter(actividad => 
              actividad.assignments.some(assignment => 
                assignment.department?.id === departmentId
              )
            );
          });
          // Eliminar productos sin actividades
          objetivo.products = objetivo.products.filter(producto => 
            producto.activities.length > 0
          );
        });
        // Eliminar objetivos sin productos
        eje.objectives = eje.objectives.filter(objetivo => 
          objetivo.products.length > 0
        );
      });
      // Eliminar ejes sin objetivos
      strategicAxes.filter(eje => eje.objectives.length > 0);
    }

    // Calcular métricas
    let totalActividades = 0;
    let totalIndicadores = 0;
    let presupuestoTotal = 0;
    const departamentos = new Set();

    strategicAxes.forEach(eje => {
      eje.objectives.forEach(objetivo => {
        objetivo.products.forEach(producto => {
          totalActividades += producto.activities.length;
          
          producto.activities.forEach(actividad => {
            if (includeIndicators && actividad.indicators) {
              totalIndicadores += actividad.indicators.length;
            }
            
            if (includeBudget && actividad.budgetExecutions) {
              actividad.budgetExecutions.forEach(budget => {
                presupuestoTotal += parseFloat(budget.assignedAmount) || 0;
              });
            }

            // Obtener departamentos responsables de los assignments
            actividad.assignments?.forEach(assignment => {
              if (assignment.department) {
                departamentos.add(assignment.department.name);
              }
            });
          });
        });
      });
    });

    // Estimar páginas (aproximadamente)
    const paginasEstimadas = Math.ceil(
      (strategicAxes.length * 2) + // Páginas por eje
      (totalActividades * 0.5) + // Actividades por página
      (includeIndicators ? totalIndicadores * 0.3 : 0) + // Indicadores
      (includeBudget ? 5 : 0) // Páginas adicionales para presupuesto
    );

    const preview = {
      totalEjes: strategicAxes.length,
      totalObjetivos: strategicAxes.reduce((sum, eje) => sum + eje.objectives.length, 0),
      totalActividades,
      totalIndicadores,
      presupuestoTotal,
      departamentos: Array.from(departamentos),
      paginasEstimadas,
      structureValid: strategicAxes.length > 0,
      dataComplete: totalActividades > 0
    };

    res.json({
      success: true,
      data: preview
    });

  } catch (error) {
    console.error('Error generando vista previa POA:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando vista previa del documento POA'
    });
  }
});

/**
 * POST /api/reports/generate-poa
 * Generar y descargar documento POA
 */
router.post('/generate-poa', auth, validateExportPermission, async (req, res) => {
  try {
    const { 
      type, 
      departmentId, 
      year, 
      format, 
      includeIndicators, 
      includeBudget, 
      includeResponsibles 
    } = req.body;

    // Obtener datos completos para el documento
    const documentData = await getPoaDocumentData({
      type,
      departmentId,
      year,
      includeIndicators,
      includeBudget,
      includeResponsibles
    });

    // Generar documento según formato
    let documentBuffer;
    let contentType;
    let fileExtension;

    switch (format) {
      case 'pdf':
        documentBuffer = await generatePdfDocument(documentData);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      
      case 'excel':
        documentBuffer = await generateExcelDocument(documentData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
      
      case 'word':
        documentBuffer = await generateWordDocument(documentData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;
      
      default:
        throw new Error('Formato no soportado');
    }

    // Configurar headers para descarga
    const fileName = `POA_${type === 'institutional' ? 'Institucional' : 'Departamental'}_${year}.${fileExtension}`;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', documentBuffer.length);

    res.send(documentBuffer);

  } catch (error) {
    console.error('Error generando documento POA:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando documento POA: ' + error.message
    });
  }
});

/**
 * Función auxiliar para obtener datos del documento POA
 */
async function getPoaDocumentData(options) {
  const { type, departmentId, year, includeIndicators, includeBudget, includeResponsibles } = options;

  // Obtener datos completos
  const strategicAxes = await prisma.strategicAxis.findMany({
    where: { year: parseInt(year) },
    include: {
      objectives: {
        include: {
          products: {
            include: {
              activities: {
                include: {
                  indicators: includeIndicators,
                  budgetExecutions: includeBudget,
                  assignments: includeResponsibles ? {
                    include: {
                      user: true,
                      department: true
                    }
                  } : false
                }
              }
            }
          }
        }
      }
    }
  });

  // Filtrar actividades por departamento si es necesario
  if (type === 'departmental' && departmentId) {
    strategicAxes.forEach(eje => {
      eje.objectives.forEach(objetivo => {
        objetivo.products.forEach(producto => {
          producto.activities = producto.activities.filter(actividad => 
            actividad.assignments.some(assignment => 
              assignment.department?.id === departmentId
            )
          );
        });
        objetivo.products = objetivo.products.filter(producto => 
          producto.activities.length > 0
        );
      });
      eje.objectives = eje.objectives.filter(objetivo => 
        objetivo.products.length > 0
      );
    });
  }

  // Obtener información institucional
  const institution = {
    name: "Dirección de Planificación y Desarrollo",
    year: year,
    generatedAt: new Date().toISOString(),
    generatedBy: "Sistema POA"
  };

  // Obtener departamento específico si aplica
  let departmentInfo = null;
  if (type === 'departmental' && departmentId) {
    departmentInfo = await prisma.department.findUnique({
      where: { id: departmentId }
    });
  }

  return {
    institution,
    departmentInfo,
    strategicAxes,
    options,
    metadata: {
      totalEjes: strategicAxes.length,
      totalObjetivos: strategicAxes.reduce((sum, eje) => sum + eje.objectives.length, 0),
      totalActividades: strategicAxes.reduce((sum, eje) => 
        sum + eje.objectives.reduce((objSum, obj) => 
          objSum + obj.products.reduce((prodSum, prod) => 
            prodSum + prod.activities.length, 0), 0), 0)
    }
  };
}

/**
 * Generar documento PDF
 */
async function generatePdfDocument(data) {
  // Para implementación futura con Puppeteer o jsPDF
  // Por ahora retornamos un placeholder
  return Buffer.from(`
    DOCUMENTO POA ${data.options.type.toUpperCase()}
    
    Institución: ${data.institution.name}
    Año: ${data.institution.year}
    Generado: ${new Date().toLocaleDateString()}
    
    ${data.departmentInfo ? `Departamento: ${data.departmentInfo.name}` : 'Todas las áreas'}
    
    ESTRUCTURA:
    - ${data.metadata.totalEjes} Ejes Estratégicos
    - ${data.metadata.totalObjetivos} Objetivos
    - ${data.metadata.totalActividades} Actividades
    
    [Documento PDF en desarrollo - Funcionalidad base implementada]
  `);
}

/**
 * Generar documento Excel
 */
async function generateExcelDocument(data) {
  // Para implementación futura con ExcelJS
  return Buffer.from(`
    DOCUMENTO EXCEL POA ${data.options.type.toUpperCase()}
    
    Datos estructurados para análisis:
    - Ejes: ${data.metadata.totalEjes}
    - Objetivos: ${data.metadata.totalObjetivos}  
    - Actividades: ${data.metadata.totalActividades}
    
    [Documento Excel en desarrollo - Funcionalidad base implementada]
  `);
}

/**
 * Generar documento Word
 */
async function generateWordDocument(data) {
  // Para implementación futura con docx
  return Buffer.from(`
    DOCUMENTO WORD POA ${data.options.type.toUpperCase()}
    
    Documento editable:
    - Institución: ${data.institution.name}
    - Año: ${data.institution.year}
    - Tipo: ${data.options.type}
    
    [Documento Word en desarrollo - Funcionalidad base implementada]
  `);
}

module.exports = router;
