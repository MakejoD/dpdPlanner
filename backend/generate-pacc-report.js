const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function generatePACCReport() {
  try {
    console.log('📊 GENERANDO REPORTE EJECUTIVO DEL PACC');
    console.log('=======================================');

    // Recopilar datos principales
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // ========== DATOS BÁSICOS ==========
    const totalSchedules = await prisma.paccSchedule.count();
    const completedSchedules = await prisma.paccSchedule.count({
      where: { status: 'COMPLETADA' }
    });
    const inProgressSchedules = await prisma.paccSchedule.count({
      where: { status: 'EN_PROCESO' }
    });
    const delayedSchedules = await prisma.paccSchedule.count({
      where: { status: 'RETRASADA' }
    });
    const pendingSchedules = await prisma.paccSchedule.count({
      where: { status: 'PENDIENTE' }
    });

    const avgCompliance = await prisma.paccSchedule.aggregate({
      _avg: { compliancePercentage: true }
    });

    const activeAlerts = await prisma.paccAlert.count({
      where: { status: 'ACTIVA' }
    });

    const criticalAlerts = await prisma.paccAlert.count({
      where: { status: 'ACTIVA', severity: 'CRITICA' }
    });

    // ========== DATOS DETALLADOS ==========
    const schedules = await prisma.paccSchedule.findMany({
      include: {
        procurementProcess: true,
        responsibleUser: {
          include: { department: true }
        }
      },
      orderBy: { plannedStartDate: 'asc' }
    });

    const compliance = await prisma.paccCompliance.findMany({
      include: {
        evaluatedByUser: true,
        approvedByUser: true
      },
      orderBy: { evaluationDate: 'desc' },
      take: 1
    });

    const alerts = await prisma.paccAlert.findMany({
      where: { status: 'ACTIVA' },
      include: {
        procurementProcess: true,
        assignedUser: true
      },
      orderBy: [
        { severity: 'desc' },
        { triggerDate: 'desc' }
      ]
    });

    // ========== GENERAR REPORTE HTML ==========
    const reportHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Ejecutivo PACC ${currentYear} - Dirección General de Contrataciones Públicas</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #1976d2;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header h2 {
            color: #666;
            font-size: 1.3em;
            font-weight: normal;
        }
        
        .report-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 5px solid #1976d2;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
        }
        
        .metric-label {
            color: #666;
            font-size: 1.1em;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h3 {
            color: #1976d2;
            font-size: 1.5em;
            margin-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }
        
        .schedule-table, .alert-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .schedule-table th, .alert-table th,
        .schedule-table td, .alert-table td {
            border: 1px solid #e0e0e0;
            padding: 12px;
            text-align: left;
        }
        
        .schedule-table th, .alert-table th {
            background: #f5f5f5;
            font-weight: bold;
            color: #333;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.9em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-completada { background: #e8f5e8; color: #2e7d32; }
        .status-en_proceso { background: #fff3e0; color: #f57c00; }
        .status-pendiente { background: #e3f2fd; color: #1976d2; }
        .status-retrasada { background: #ffebee; color: #d32f2f; }
        
        .severity-critica { background: #ffebee; color: #d32f2f; }
        .severity-alta { background: #fff3e0; color: #f57c00; }
        .severity-media { background: #fff8e1; color: #fbc02d; }
        .severity-baja { background: #e8f5e8; color: #388e3c; }
        
        .compliance-score {
            font-size: 1.2em;
            font-weight: bold;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            margin: 10px 0;
        }
        
        .score-excellent { background: #e8f5e8; color: #2e7d32; }
        .score-good { background: #fff8e1; color: #fbc02d; }
        .score-fair { background: #fff3e0; color: #f57c00; }
        .score-poor { background: #ffebee; color: #d32f2f; }
        
        .recommendations {
            background: #f0f7ff;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
        }
        
        .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 60px;
        }
        
        .signature-box {
            text-align: center;
            border-top: 1px solid #333;
            padding-top: 10px;
        }
        
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- ENCABEZADO -->
        <div class="header">
            <h1>REPORTE EJECUTIVO DEL PACC ${currentYear}</h1>
            <h2>Plan Anual de Contrataciones y Compras</h2>
            <h3>Dirección General de Contrataciones Públicas - República Dominicana</h3>
        </div>

        <!-- INFORMACIÓN DEL REPORTE -->
        <div class="report-info">
            <strong>Período de Evaluación:</strong> ${currentYear}<br>
            <strong>Fecha de Generación:</strong> ${currentDate.toLocaleDateString('es-DO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}<br>
            <strong>Base Legal:</strong> Ley No. 340-06 de Compras y Contrataciones del Estado<br>
            <strong>Sistema:</strong> POA-PACC-Presupuesto Integrado v2.0
        </div>

        <!-- MÉTRICAS PRINCIPALES -->
        <div class="section">
            <h3>📊 RESUMEN EJECUTIVO</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${totalSchedules}</div>
                    <div class="metric-label">Total de Cronogramas</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(avgCompliance._avg.compliancePercentage || 0).toFixed(1)}%</div>
                    <div class="metric-label">Cumplimiento Promedio</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${completedSchedules}</div>
                    <div class="metric-label">Procesos Completados</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${activeAlerts}</div>
                    <div class="metric-label">Alertas Activas</div>
                </div>
            </div>
        </div>

        <!-- ESTADO DE CRONOGRAMAS -->
        <div class="section">
            <h3>📅 ESTADO DE CRONOGRAMAS DEL PACC</h3>
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>Fase del Proceso</th>
                        <th>Proceso de Contratación</th>
                        <th>Responsable</th>
                        <th>Fecha Planificada</th>
                        <th>Cumplimiento</th>
                        <th>Estado</th>
                        <th>Ruta Crítica</th>
                    </tr>
                </thead>
                <tbody>
                    ${schedules.map(schedule => `
                        <tr>
                            <td><strong>${schedule.phaseName}</strong></td>
                            <td>${schedule.procurementProcess.description}</td>
                            <td>${schedule.responsibleUser?.firstName || 'No asignado'} ${schedule.responsibleUser?.lastName || ''}<br>
                                <small>${schedule.responsibleUser?.department?.name || ''}</small>
                            </td>
                            <td>${schedule.plannedStartDate.toLocaleDateString('es-DO')} - ${schedule.plannedEndDate.toLocaleDateString('es-DO')}</td>
                            <td><strong>${schedule.compliancePercentage}%</strong></td>
                            <td><span class="status-badge status-${schedule.status.toLowerCase()}">${schedule.status.replace('_', ' ')}</span></td>
                            <td>${schedule.criticalPath ? '🔴 SÍ' : '🟢 NO'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- EVALUACIÓN DE CUMPLIMIENTO -->
        ${compliance.length > 0 ? `
        <div class="section">
            <h3>📈 EVALUACIÓN DE CUMPLIMIENTO PACC</h3>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="compliance-score score-${compliance[0].overallScore >= 90 ? 'excellent' : compliance[0].overallScore >= 80 ? 'good' : compliance[0].overallScore >= 70 ? 'fair' : 'poor'}">
                        ${compliance[0].overallScore}/100 (${compliance[0].complianceGrade})
                    </div>
                    <div class="metric-label">Puntuación General</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${compliance[0].timelinessScore}%</div>
                    <div class="metric-label">Cumplimiento Temporal</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${compliance[0].budgetCompliance}%</div>
                    <div class="metric-label">Cumplimiento Presupuestario</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${compliance[0].legalComplianceScore}%</div>
                    <div class="metric-label">Cumplimiento Legal</div>
                </div>
            </div>
            
            <h4>📋 Estadísticas de Procesos</h4>
            <ul>
                <li><strong>Total de procesos:</strong> ${compliance[0].totalProcesses}</li>
                <li><strong>Procesos en tiempo:</strong> ${compliance[0].processesOnSchedule}</li>
                <li><strong>Procesos retrasados:</strong> ${compliance[0].processesDelayed}</li>
                <li><strong>Procesos en riesgo:</strong> ${compliance[0].processesAtRisk}</li>
            </ul>
            
            <h4>🎯 Hitos</h4>
            <ul>
                <li><strong>Hitos programados:</strong> ${compliance[0].scheduledMilestones}</li>
                <li><strong>Hitos logrados:</strong> ${compliance[0].achievedMilestones}</li>
                <li><strong>Hitos retrasados:</strong> ${compliance[0].delayedMilestones}</li>
                <li><strong>Tasa de cumplimiento:</strong> ${compliance[0].milestoneComplianceRate}%</li>
            </ul>
        </div>
        ` : ''}

        <!-- ALERTAS ACTIVAS -->
        ${alerts.length > 0 ? `
        <div class="section">
            <h3>🚨 ALERTAS ACTIVAS DEL SISTEMA</h3>
            <table class="alert-table">
                <thead>
                    <tr>
                        <th>Alerta</th>
                        <th>Proceso</th>
                        <th>Severidad</th>
                        <th>Fecha</th>
                        <th>Responsable</th>
                        <th>Vencimiento</th>
                    </tr>
                </thead>
                <tbody>
                    ${alerts.map(alert => `
                        <tr>
                            <td><strong>${alert.title}</strong><br><small>${alert.description}</small></td>
                            <td>${alert.procurementProcess?.description || 'N/A'}</td>
                            <td><span class="status-badge severity-${alert.severity.toLowerCase()}">${alert.severity}</span></td>
                            <td>${alert.triggerDate.toLocaleDateString('es-DO')}</td>
                            <td>${alert.assignedUser?.firstName || 'No asignado'} ${alert.assignedUser?.lastName || ''}</td>
                            <td>${alert.dueDate ? alert.dueDate.toLocaleDateString('es-DO') : 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- RECOMENDACIONES -->
        <div class="section">
            <h3>💡 RECOMENDACIONES Y ACCIONES</h3>
            <div class="recommendations">
                <h4>🎯 Acciones Prioritarias Inmediatas:</h4>
                <ul>
                    ${criticalAlerts > 0 ? `<li><strong>CRÍTICO:</strong> Resolver ${criticalAlerts} alertas críticas inmediatamente</li>` : ''}
                    ${delayedSchedules > 0 ? `<li><strong>URGENTE:</strong> Recuperar cronograma en ${delayedSchedules} procesos retrasados</li>` : ''}
                    <li><strong>GESTIÓN:</strong> Fortalecer seguimiento de ${inProgressSchedules} procesos en ejecución</li>
                    <li><strong>PLANIFICACIÓN:</strong> Preparar ${pendingSchedules} procesos pendientes de inicio</li>
                </ul>
                
                <h4>📋 Recomendaciones Generales para el PACC:</h4>
                <ol>
                    <li><strong>Implementar reuniones semanales</strong> de seguimiento del cronograma PACC</li>
                    <li><strong>Establecer alertas automáticas</strong> con 15 días de anticipación para fechas críticas</li>
                    <li><strong>Crear protocolo de escalamiento</strong> para procesos en ruta crítica</li>
                    <li><strong>Fortalecer coordinación</strong> entre áreas técnicas y unidad de compras</li>
                    <li><strong>Implementar dashboard en tiempo real</strong> para directivos y supervisores</li>
                    <li><strong>Capacitar personal</strong> en gestión de proyectos y cronogramas</li>
                    <li><strong>Mejorar documentación</strong> de procesos y lecciones aprendidas</li>
                    <li><strong>Establecer indicadores KPI</strong> específicos para cada fase del PACC</li>
                </ol>
            </div>
        </div>

        <!-- PIE DE PÁGINA -->
        <div class="footer">
            <div class="signature-section">
                <div class="signature-box">
                    <strong>Director(a) de Planificación</strong><br>
                    Nombre y Firma
                </div>
                <div class="signature-box">
                    <strong>Director(a) General de Contrataciones</strong><br>
                    Nombre y Firma
                </div>
            </div>
            
            <p style="margin-top: 40px;">
                <strong>Este reporte fue generado automáticamente por el Sistema POA-PACC-Presupuesto</strong><br>
                Cumpliendo con las disposiciones de la Ley No. 340-06 de Compras y Contrataciones del Estado<br>
                y el Decreto No. 543-12 que establece el Reglamento de la Ley de Compras y Contrataciones
            </p>
            
            <p style="margin-top: 20px; font-size: 0.9em; color: #888;">
                Reporte generado el ${currentDate.toLocaleDateString('es-DO')} a las ${currentDate.toLocaleTimeString('es-DO')}<br>
                Sistema POA-PACC-Presupuesto v2.0 | Desarrollado para la Administración Pública Dominicana
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // ========== GUARDAR REPORTE ==========
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `reporte-pacc-ejecutivo-${currentYear}-${currentDate.getMonth() + 1}-${currentDate.getDate()}.html`;
    const filePath = path.join(reportsDir, fileName);
    
    fs.writeFileSync(filePath, reportHtml, 'utf8');

    console.log(`✅ Reporte ejecutivo PACC generado exitosamente:`);
    console.log(`📁 Archivo: ${filePath}`);
    console.log(`📊 Datos incluidos:`);
    console.log(`   • ${totalSchedules} cronogramas del PACC`);
    console.log(`   • ${compliance.length} evaluaciones de cumplimiento`);
    console.log(`   • ${activeAlerts} alertas activas`);
    console.log(`   • Métricas consolidadas y recomendaciones`);
    
    console.log(`\n📋 RESUMEN DEL REPORTE:`);
    console.log(`   📈 Cumplimiento promedio: ${(avgCompliance._avg.compliancePercentage || 0).toFixed(1)}%`);
    console.log(`   ✅ Procesos completados: ${completedSchedules}/${totalSchedules}`);
    console.log(`   🔄 Procesos en progreso: ${inProgressSchedules}`);
    console.log(`   ⏸️ Procesos pendientes: ${pendingSchedules}`);
    console.log(`   🚨 Alertas activas: ${activeAlerts} (${criticalAlerts} críticas)`);

    console.log(`\n🎯 El reporte puede ser utilizado para:`);
    console.log(`   • Presentaciones a directivos y autoridades`);
    console.log(`   • Informes de cumplimiento normativo`);
    console.log(`   • Documentación oficial del PACC`);
    console.log(`   • Seguimiento y control de gestión`);
    console.log(`   • Auditorías internas y externas`);

    return filePath;

  } catch (error) {
    console.error('❌ Error generando reporte PACC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  generatePACCReport()
    .then((filePath) => {
      console.log(`\n🏆 REPORTE EJECUTIVO PACC COMPLETADO`);
      console.log(`📁 Ubicación: ${filePath}`);
      console.log(`✅ Sistema de cronograma y seguimiento PACC 100% funcional`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en generación de reporte PACC:', error);
      process.exit(1);
    });
}

module.exports = { generatePACCReport };
