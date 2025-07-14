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

    // Enviar buffer binario directamente
    res.end(documentBuffer);

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
            prodSum + prod.activities.length, 0), 0), 0),
      presupuestoTotal: strategicAxes.reduce((sum, eje) => 
        sum + eje.objectives.reduce((objSum, obj) => 
          objSum + obj.products.reduce((prodSum, prod) => 
            prodSum + prod.activities.reduce((actSum, act) => 
              actSum + (act.budgetExecutions?.reduce((budgetSum, budget) => 
                budgetSum + (parseFloat(budget.assignedAmount) || 0), 0) || 0), 0), 0), 0), 0)
    }
  };
}

/**
 * Generar documento PDF
 */
async function generatePdfDocument(data) {
  const puppeteer = require('puppeteer');
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Crear contenido HTML para el PDF
    const htmlContent = generateHtmlContent(data);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true
    });
    
    await browser.close();
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    // Fallback: PDF simple con texto
    return generateSimplePdf(data);
  }
}

/**
 * Generar documento Excel
 */
async function generateExcelDocument(data) {
  const ExcelJS = require('exceljs');
  
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Metadatos del workbook
    workbook.creator = 'Sistema POA';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Hoja de resumen
    const summarySheet = workbook.addWorksheet('Resumen POA');
    
    // Encabezados principales
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `PLAN OPERATIVO ANUAL (POA) ${data.institution.year}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    
    // Información básica
    summarySheet.addRow([]);
    summarySheet.addRow(['Institución:', data.institution.name]);
    summarySheet.addRow(['Tipo:', data.options.type === 'institutional' ? 'Institucional' : 'Departamental']);
    if (data.departmentInfo) {
      summarySheet.addRow(['Departamento:', data.departmentInfo.name]);
    }
    summarySheet.addRow(['Generado:', new Date().toLocaleDateString()]);
    summarySheet.addRow([]);
    
    // Métricas
    summarySheet.addRow(['MÉTRICAS GENERALES']);
    summarySheet.addRow(['Ejes Estratégicos:', data.metadata.totalEjes]);
    summarySheet.addRow(['Objetivos:', data.metadata.totalObjetivos]);
    summarySheet.addRow(['Actividades:', data.metadata.totalActividades]);
    if (data.options.includeBudget) {
      summarySheet.addRow(['Presupuesto Total:', data.metadata.presupuestoTotal]);
    }
    
    // Hoja de actividades detalladas
    const activitiesSheet = workbook.addWorksheet('Actividades Detalladas');
    
    // Headers de la tabla de actividades
    const headers = ['Eje Estratégico', 'Objetivo', 'Producto', 'Actividad'];
    if (data.options.includeBudget) {
      headers.push('Presupuesto Asignado');
    }
    if (data.options.includeResponsibles) {
      headers.push('Responsable');
    }
    
    activitiesSheet.addRow(headers);
    
    // Formatear headers
    const headerRow = activitiesSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    
    // Agregar datos de actividades
    data.strategicAxes.forEach(eje => {
      eje.objectives.forEach(objetivo => {
        objetivo.products.forEach(producto => {
          producto.activities.forEach(actividad => {
            const row = [
              eje.name,
              objetivo.name,
              producto.name,
              actividad.name
            ];
            
            if (data.options.includeBudget) {
              const presupuesto = actividad.budgetExecutions?.reduce((sum, budget) => 
                sum + (parseFloat(budget.assignedAmount) || 0), 0) || 0;
              row.push(presupuesto);
            }
            
            if (data.options.includeResponsibles) {
              const responsable = actividad.assignments?.[0]?.department?.name || 'No asignado';
              row.push(responsable);
            }
            
            activitiesSheet.addRow(row);
          });
        });
      });
    });
    
    // Formatear columnas
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 40;
    
    activitiesSheet.getColumn(1).width = 30; // Eje
    activitiesSheet.getColumn(2).width = 35; // Objetivo  
    activitiesSheet.getColumn(3).width = 30; // Producto
    activitiesSheet.getColumn(4).width = 45; // Actividad
    
    if (data.options.includeBudget) {
      activitiesSheet.getColumn(5).width = 18; // Presupuesto
      activitiesSheet.getColumn(5).numFmt = '"$"#,##0.00'; // Formato moneda
    }
    
    if (data.options.includeResponsibles) {
      const responsableCol = data.options.includeBudget ? 6 : 5;
      activitiesSheet.getColumn(responsableCol).width = 25; // Responsable
    }
    
    // Generar buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
    
  } catch (error) {
    console.error('Error generando Excel:', error);
    // Fallback a texto si hay error
    return generateFallbackExcel(data);
  }
}

/**
 * Generar documento Word
 */
async function generateWordDocument(data) {
  const officegen = require('officegen');
  
  const docx = officegen('docx');
  
  // Título principal
  let pObj = docx.createP();
  pObj.addText('PLAN OPERATIVO ANUAL (POA) ' + data.institution.year, {
    bold: true,
    font_size: 18,
    align: 'center'
  });
  
  // Información institucional
  pObj = docx.createP();
  pObj.addText('\nInstitución: ' + data.institution.name, { bold: true });
  
  pObj = docx.createP();
  pObj.addText('Tipo: ' + (data.options.type === 'institutional' ? 'Institucional' : 'Departamental'));
  
  if (data.departmentInfo) {
    pObj = docx.createP();
    pObj.addText('Departamento: ' + data.departmentInfo.name);
  }
  
  pObj = docx.createP();
  pObj.addText('Fecha de generación: ' + new Date().toLocaleDateString());
  
  // Métricas
  pObj = docx.createP();
  pObj.addText('\nRESUMEN EJECUTIVO', { bold: true, font_size: 14 });
  
  pObj = docx.createP();
  pObj.addText(`• Ejes Estratégicos: ${data.metadata.totalEjes}`);
  pObj = docx.createP();
  pObj.addText(`• Objetivos: ${data.metadata.totalObjetivos}`);
  pObj = docx.createP();
  pObj.addText(`• Actividades: ${data.metadata.totalActividades}`);
  pObj = docx.createP();
  pObj.addText(`• Presupuesto Total: ${data.metadata.presupuestoTotal}`);
  
  // Estructura detallada
  pObj = docx.createP();
  pObj.addText('\nESTRUCTURA DETALLADA', { bold: true, font_size: 14 });
  
  data.strategicAxes.forEach((eje, ejeIndex) => {
    pObj = docx.createP();
    pObj.addText(`\n${ejeIndex + 1}. ${eje.name}`, { bold: true, font_size: 12 });
    
    eje.objectives.forEach((objetivo, objIndex) => {
      pObj = docx.createP();
      pObj.addText(`   ${ejeIndex + 1}.${objIndex + 1} ${objetivo.name}`, { bold: true });
      
      objetivo.products.forEach((producto, prodIndex) => {
        pObj = docx.createP();
        pObj.addText(`      ${ejeIndex + 1}.${objIndex + 1}.${prodIndex + 1} ${producto.name}`);
        
        producto.activities.forEach((actividad, actIndex) => {
          const presupuesto = actividad.budgetExecutions?.reduce((sum, budget) => 
            sum + (parseFloat(budget.assignedAmount) || 0), 0) || 0;
          
          pObj = docx.createP();
          pObj.addText(`         • ${actividad.name} (Presupuesto: ${presupuesto})`);
        });
      });
    });
  });
  
  return new Promise((resolve, reject) => {
    const chunks = [];
    docx.on('data', (chunk) => chunks.push(chunk));
    docx.on('end', () => resolve(Buffer.concat(chunks)));
    docx.on('error', reject);
    docx.generate();
  });
}

/**
 * Generar contenido HTML para PDF
 */
function generateHtmlContent(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>POA ${data.institution.year}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .subtitle { font-size: 16px; color: #7f8c8d; margin-top: 10px; }
        .info-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
        .metric { text-align: center; padding: 10px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #3498db; }
        .metric-label { font-size: 12px; color: #7f8c8d; }
        .eje { margin: 20px 0; border-left: 4px solid #3498db; padding-left: 15px; }
        .objetivo { margin: 15px 0; padding-left: 20px; }
        .producto { margin: 10px 0; padding-left: 30px; color: #2c3e50; }
        .actividad { margin: 5px 0; padding-left: 40px; font-size: 14px; color: #5d6d7e; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">PLAN OPERATIVO ANUAL (POA)</div>
        <div class="subtitle">${data.institution.name} - ${data.institution.year}</div>
        ${data.departmentInfo ? `<div class="subtitle">Departamento: ${data.departmentInfo.name}</div>` : ''}
      </div>
      
      <div class="info-section">
        <h3>Información General</h3>
        <p><strong>Tipo:</strong> ${data.options.type === 'institutional' ? 'Institucional' : 'Departamental'}</p>
        <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Incluye indicadores:</strong> ${data.options.includeIndicators ? 'Sí' : 'No'}</p>
        <p><strong>Incluye presupuesto:</strong> ${data.options.includeBudget ? 'Sí' : 'No'}</p>
      </div>
      
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${data.metadata.totalEjes}</div>
          <div class="metric-label">Ejes Estratégicos</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.metadata.totalObjetivos}</div>
          <div class="metric-label">Objetivos</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.metadata.totalActividades}</div>
          <div class="metric-label">Actividades</div>
        </div>
        <div class="metric">
          <div class="metric-value">$${(data.metadata.presupuestoTotal || 0).toLocaleString()}</div>
          <div class="metric-label">Presupuesto Total</div>
        </div>
      </div>
      
      <div class="page-break"></div>
      <h2>Estructura Detallada</h2>
      
      ${data.strategicAxes.map((eje, ejeIndex) => `
        <div class="eje">
          <h3>${ejeIndex + 1}. ${eje.name}</h3>
          ${eje.objectives.map((objetivo, objIndex) => `
            <div class="objetivo">
              <h4>${ejeIndex + 1}.${objIndex + 1} ${objetivo.name}</h4>
              ${objetivo.products.map((producto, prodIndex) => `
                <div class="producto">
                  <strong>${ejeIndex + 1}.${objIndex + 1}.${prodIndex + 1} ${producto.name}</strong>
                  ${producto.activities.map(actividad => {
                    const presupuesto = actividad.budgetExecutions?.reduce((sum, budget) => 
                      sum + (parseFloat(budget.assignedAmount) || 0), 0) || 0;
                    const responsable = actividad.assignments?.[0]?.department?.name || 'No asignado';
                    return `
                      <div class="actividad">
                        • ${actividad.name}
                        ${data.options.includeBudget ? `<br>&nbsp;&nbsp;Presupuesto: $${presupuesto.toLocaleString()}` : ''}
                        ${data.options.includeResponsibles ? `<br>&nbsp;&nbsp;Responsable: ${responsable}` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

/**
 * Fallback: Generar PDF simple sin Puppeteer
 */
function generateSimplePdf(data) {
  const content = `
PLAN OPERATIVO ANUAL (POA) ${data.institution.year}

Institución: ${data.institution.name}
Tipo: ${data.options.type === 'institutional' ? 'Institucional' : 'Departamental'}
${data.departmentInfo ? `Departamento: ${data.departmentInfo.name}` : ''}
Fecha: ${new Date().toLocaleDateString()}

RESUMEN:
- Ejes Estratégicos: ${data.metadata.totalEjes}
- Objetivos: ${data.metadata.totalObjetivos}
- Actividades: ${data.metadata.totalActividades}
- Presupuesto Total: $${(data.metadata.presupuestoTotal || 0).toLocaleString()}

ESTRUCTURA DETALLADA:

${data.strategicAxes.map((eje, ejeIndex) => `
${ejeIndex + 1}. ${eje.name}
${eje.objectives.map((objetivo, objIndex) => `
   ${ejeIndex + 1}.${objIndex + 1} ${objetivo.name}
${objetivo.products.map((producto, prodIndex) => `
      ${ejeIndex + 1}.${objIndex + 1}.${prodIndex + 1} ${producto.name}
${producto.activities.map(actividad => {
  const presupuesto = actividad.budgetExecutions?.reduce((sum, budget) => 
    sum + (parseFloat(budget.assignedAmount) || 0), 0) || 0;
  return `         • ${actividad.name} (Presupuesto: $${presupuesto.toLocaleString()})`;
}).join('\n')}
`).join('')}
`).join('')}
`).join('')}

---
Documento generado automáticamente por el Sistema POA
${new Date().toISOString()}
  `;
  
  return Buffer.from(content, 'utf8');
}

/**
 * Fallback: Generar Excel simple como CSV
 */
function generateFallbackExcel(data) {
  const csvContent = `PLAN OPERATIVO ANUAL (POA) ${data.institution.year}
Institución,${data.institution.name}
Tipo,${data.options.type === 'institutional' ? 'Institucional' : 'Departamental'}
${data.departmentInfo ? `Departamento,${data.departmentInfo.name}` : ''}
Generado,${new Date().toLocaleDateString()}

MÉTRICAS GENERALES
Ejes Estratégicos,${data.metadata.totalEjes}
Objetivos,${data.metadata.totalObjetivos}
Actividades,${data.metadata.totalActividades}
${data.options.includeBudget ? `Presupuesto Total,${data.metadata.presupuestoTotal}` : ''}

ACTIVIDADES DETALLADAS
Eje Estratégico,Objetivo,Producto,Actividad${data.options.includeBudget ? ',Presupuesto' : ''}${data.options.includeResponsibles ? ',Responsable' : ''}
${data.strategicAxes.map(eje => 
  eje.objectives.map(objetivo => 
    objetivo.products.map(producto => 
      producto.activities.map(actividad => {
        const presupuesto = actividad.budgetExecutions?.reduce((sum, budget) => 
          sum + (parseFloat(budget.assignedAmount) || 0), 0) || 0;
        const responsable = actividad.assignments?.[0]?.department?.name || 'No asignado';
        
        let row = `"${eje.name}","${objetivo.name}","${producto.name}","${actividad.name}"`;
        if (data.options.includeBudget) row += `,${presupuesto}`;
        if (data.options.includeResponsibles) row += `,"${responsable}"`;
        return row;
      }).join('\n')
    ).join('\n')
  ).join('\n')
).join('\n')}`;
  
  return Buffer.from(csvContent, 'utf8');
}

module.exports = router;
