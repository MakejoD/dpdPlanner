const { PrismaClient } = require('@prisma/client')
const cron = require('node-cron')

const prisma = new PrismaClient()

class AlertService {
  constructor(notificationService) {
    this.notificationService = notificationService
    this.isRunning = false
  }

  // Iniciar el servicio de alertas automáticas
  start() {
    if (this.isRunning) {
      console.log('AlertService ya está ejecutándose')
      return
    }

    console.log('🚨 Iniciando AlertService - Sistema de Alertas Automáticas')
    
    // Ejecutar verificaciones cada hora
    cron.schedule('0 * * * *', () => {
      this.checkAllAlerts()
    })

    // Ejecutar verificaciones diarias a las 8:00 AM
    cron.schedule('0 8 * * *', () => {
      this.checkDailyAlerts()
    })

    // Ejecutar verificaciones semanales los lunes a las 9:00 AM
    cron.schedule('0 9 * * 1', () => {
      this.checkWeeklyAlerts()
    })

    this.isRunning = true
    
    // Ejecutar verificación inicial
    setTimeout(() => this.checkAllAlerts(), 5000)
  }

  // Verificar todas las alertas
  async checkAllAlerts() {
    try {
      console.log('🔍 Verificando alertas automáticas...')
      
      await Promise.all([
        this.checkProgressReportDeadlines(),
        this.checkIndicatorPerformance(),
        this.checkBudgetExecution(),
        this.checkPaccCompliance(),
        this.checkActivityDeadlines()
      ])
      
      console.log('✅ Verificación de alertas completada')
    } catch (error) {
      console.error('❌ Error en verificación de alertas:', error)
    }
  }

  // Verificar reportes de avance vencidos o próximos a vencer
  async checkProgressReportDeadlines() {
    try {
      const now = new Date()
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))
      const oneWeekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))

      // Reportes vencidos (basados en fecha de creación + período)
      const overdueReports = await prisma.progressReport.findMany({
        where: {
          status: 'pendiente',
          createdAt: {
            lt: threeDaysFromNow  // Reportes que llevan más de 3 días pendientes
          }
        },
        include: {
          indicator: {
            include: {
              indicatorAssignments: {
                include: {
                  user: true
                }
              }
            }
          },
          activity: {
            include: {
              assignments: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      })

      // Notificar reportes vencidos
      for (const report of overdueReports) {
        const assignments = report.indicator?.indicatorAssignments || report.activity?.assignments || []
        const userIds = assignments.map(assignment => assignment.user.id)

        if (userIds.length > 0) {
          await this.notificationService.sendNotificationToUsers(userIds, {
            title: '⚠️ Reporte de Avance Pendiente',
            message: `El reporte para "${report.indicator?.name || report.activity?.name}" lleva más de 3 días pendiente desde ${report.createdAt.toLocaleDateString()}`,
            type: 'WARNING',
            priority: 'HIGH',
            data: {
              reportId: report.id,
              type: 'pending_report',
              createdAt: report.createdAt
            }
          })
        }
      }

      // Reportes próximos a vencer (una semana pendientes)
      const upcomingReports = await prisma.progressReport.findMany({
        where: {
          status: 'pendiente',
          createdAt: {
            gte: threeDaysFromNow,
            lte: oneWeekFromNow
          }
        },
        include: {
          indicator: {
            include: {
              indicatorAssignments: {
                include: {
                  user: true
                }
              }
            }
          },
          activity: {
            include: {
              assignments: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      })

      // Notificar reportes próximos a vencer
      for (const report of upcomingReports) {
        const assignments = report.indicator?.indicatorAssignments || report.activity?.assignments || []
        const userIds = assignments.map(assignment => assignment.user.id)

        if (userIds.length > 0) {
          await this.notificationService.sendNotificationToUsers(userIds, {
            title: '⏰ Recordatorio de Reporte Pendiente',
            message: `El reporte para "${report.indicator?.name || report.activity?.name}" está pendiente desde ${report.createdAt.toLocaleDateString()}`,
            type: 'INFO',
            priority: 'MEDIUM',
            data: {
              reportId: report.id,
              type: 'reminder_report',
              createdAt: report.createdAt
            }
          })
        }
      }

      console.log(`📊 Reportes verificados: ${overdueReports.length} pendientes urgentes, ${upcomingReports.length} recordatorios enviados`)

    } catch (error) {
      console.error('Error verificando deadlines de reportes:', error)
    }
  }

  // Verificar rendimiento de indicadores
  async checkIndicatorPerformance() {
    try {
      const indicators = await prisma.indicator.findMany({
        include: {
          progressReports: {
            where: {
              status: 'aprobado'
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          indicatorAssignments: {
            include: {
              user: true
            }
          }
        }
      })

      for (const indicator of indicators) {
        if (indicator.progressReports.length === 0) continue

        const latestReport = indicator.progressReports[0]
        const achievedPercentage = (latestReport.achievedValue / indicator.targetValue) * 100

        let alertType = null
        let alertMessage = ''
        let priority = 'MEDIUM'

        if (achievedPercentage < 50) {
          alertType = 'ERROR'
          alertMessage = `⚠️ Indicador "${indicator.name}" tiene un rendimiento crítico (${achievedPercentage.toFixed(1)}%)`
          priority = 'HIGH'
        } else if (achievedPercentage < 75) {
          alertType = 'WARNING'
          alertMessage = `📉 Indicador "${indicator.name}" tiene un rendimiento bajo (${achievedPercentage.toFixed(1)}%)`
          priority = 'MEDIUM'
        }

        if (alertType) {
          const userIds = indicator.indicatorAssignments.map(assignment => assignment.user.id)
          
          if (userIds.length > 0) {
            await this.notificationService.sendNotificationToUsers(userIds, {
              title: 'Alerta de Rendimiento de Indicador',
              message: alertMessage,
              type: alertType,
              priority: priority,
              data: {
                indicatorId: indicator.id,
                type: 'performance_alert',
                achievedPercentage: achievedPercentage
              }
            })
          }
        }
      }

    } catch (error) {
      console.error('Error verificando rendimiento de indicadores:', error)
    }
  }

  // Verificar ejecución presupuestaria
  async checkBudgetExecution() {
    try {
      const budgetExecutions = await prisma.budgetExecution.findMany({
        include: {
          activity: {
            include: {
              assignments: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      })

      for (const execution of budgetExecutions) {
        const executionPercentage = (execution.executedAmount / execution.assignedAmount) * 100

        let alertType = null
        let alertMessage = ''
        let priority = 'MEDIUM'

        if (executionPercentage > 90) {
          alertType = 'WARNING'
          alertMessage = `💰 Actividad "${execution.activity.name}" ha ejecutado ${executionPercentage.toFixed(1)}% de su presupuesto`
          priority = 'MEDIUM'
        } else if (executionPercentage > 100) {
          alertType = 'ERROR'
          alertMessage = `🚨 Actividad "${execution.activity.name}" ha excedido su presupuesto (${executionPercentage.toFixed(1)}%)`
          priority = 'HIGH'
        }

        if (alertType) {
          const userIds = execution.activity.assignments.map(assignment => assignment.user.id)
          
          if (userIds.length > 0) {
            await this.notificationService.sendNotificationToUsers(userIds, {
              title: 'Alerta de Ejecución Presupuestaria',
              message: alertMessage,
              type: alertType,
              priority: priority,
              data: {
                budgetExecutionId: execution.id,
                activityId: execution.activity.id,
                type: 'budget_alert',
                executionPercentage: executionPercentage
              }
            })
          }
        }
      }

    } catch (error) {
      console.error('Error verificando ejecución presupuestaria:', error)
    }
  }

  // Verificar cumplimiento PACC
  async checkPaccCompliance() {
    try {
      const paccSchedules = await prisma.paccSchedule.findMany({
        include: {
          procurementProcess: true,
          responsibleUser: true,
          alerts: true
        }
      })

      const now = new Date()

      for (const schedule of paccSchedules) {
        // Verificar fechas límite
        if (schedule.plannedEndDate < now && schedule.status !== 'COMPLETADA') {
          if (schedule.responsibleUser) {
            await this.notificationService.sendNotificationToUser(schedule.responsibleUser.id, {
              title: '🚨 Cronograma PACC Vencido',
              message: `El cronograma "${schedule.phaseName}" venció el ${schedule.plannedEndDate.toLocaleDateString()}`,
              type: 'ERROR',
              priority: 'HIGH',
              data: {
                scheduleId: schedule.id,
                type: 'pacc_deadline',
                plannedEndDate: schedule.plannedEndDate
              }
            })
          }
        }

        // Verificar próximos vencimientos (7 días)
        const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))
        if (schedule.plannedEndDate <= sevenDaysFromNow && schedule.plannedEndDate > now && schedule.status === 'PENDIENTE') {
          if (schedule.responsibleUser) {
            await this.notificationService.sendNotificationToUser(schedule.responsibleUser.id, {
              title: '⏰ Cronograma PACC Próximo a Vencer',
              message: `El cronograma "${schedule.phaseName}" vence el ${schedule.plannedEndDate.toLocaleDateString()}`,
              type: 'WARNING',
              priority: 'MEDIUM',
              data: {
                scheduleId: schedule.id,
                type: 'pacc_upcoming',
                plannedEndDate: schedule.plannedEndDate
              }
            })
          }
        }
      }

      console.log(`📅 Cronogramas PACC verificados: ${paccSchedules.length} total`)

    } catch (error) {
      console.error('Error verificando cumplimiento PACC:', error)
    }
  }

  // Verificar deadlines de actividades
  async checkActivityDeadlines() {
    try {
      const now = new Date()
      const oneWeekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))

      const activities = await prisma.activity.findMany({
        where: {
          isActive: true,
          endDate: {
            lte: oneWeekFromNow,
            not: null
          }
        },
        include: {
          assignments: {
            include: {
              user: true
            }
          }
        }
      })

      for (const activity of activities) {
        const userIds = activity.assignments.map(assignment => assignment.user.id)
        
        if (userIds.length > 0) {
          const isOverdue = activity.endDate < now
          
          await this.notificationService.sendNotificationToUsers(userIds, {
            title: isOverdue ? '🚨 Actividad Vencida' : '⏰ Actividad Próxima a Vencer',
            message: isOverdue 
              ? `La actividad "${activity.name}" venció el ${activity.endDate.toLocaleDateString()}`
              : `La actividad "${activity.name}" vence el ${activity.endDate.toLocaleDateString()}`,
            type: isOverdue ? 'ERROR' : 'WARNING',
            priority: isOverdue ? 'HIGH' : 'MEDIUM',
            data: {
              activityId: activity.id,
              type: 'activity_deadline',
              endDate: activity.endDate
            }
          })
        }
      }

    } catch (error) {
      console.error('Error verificando deadlines de actividades:', error)
    }
  }

  // Verificaciones diarias
  async checkDailyAlerts() {
    try {
      console.log('📅 Ejecutando verificaciones diarias...')
      
      // Notificar resumen diario a directores
      await this.sendDailySummaryToDirectors()
      
    } catch (error) {
      console.error('Error en verificaciones diarias:', error)
    }
  }

  // Verificaciones semanales
  async checkWeeklyAlerts() {
    try {
      console.log('📊 Ejecutando verificaciones semanales...')
      
      // Notificar resumen semanal a administradores
      await this.sendWeeklySummaryToAdmins()
      
    } catch (error) {
      console.error('Error en verificaciones semanales:', error)
    }
  }

  // Enviar resumen diario a directores
  async sendDailySummaryToDirectors() {
    try {
      const directors = await prisma.user.findMany({
        where: {
          role: {
            name: {
              contains: 'Director'
            }
          }
        }
      })

      // Obtener estadísticas del día
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const stats = await this.getDailyStats(today, tomorrow)
      
      const directorIds = directors.map(director => director.id)
      
      if (directorIds.length > 0) {
        await this.notificationService.sendNotificationToUsers(directorIds, {
          title: '📊 Resumen Diario del Sistema POA',
          message: `Reportes enviados: ${stats.reportsSubmitted}, Pendientes: ${stats.reportsPending}, Actividades vencidas: ${stats.activitiesOverdue}`,
          type: 'INFO',
          priority: 'LOW',
          data: {
            type: 'daily_summary',
            stats: stats
          }
        })
      }

    } catch (error) {
      console.error('Error enviando resumen diario:', error)
    }
  }

  // Enviar resumen semanal a administradores
  async sendWeeklySummaryToAdmins() {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: {
            name: 'Administrador del Sistema'
          }
        }
      })

      // Obtener estadísticas de la semana
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const stats = await this.getWeeklyStats(weekAgo, new Date())
      
      const adminIds = admins.map(admin => admin.id)
      
      if (adminIds.length > 0) {
        await this.notificationService.sendNotificationToUsers(adminIds, {
          title: '📈 Resumen Semanal del Sistema POA',
          message: `Esta semana: ${stats.totalReports} reportes, ${stats.activitiesCompleted} actividades completadas, ${stats.budgetExecuted}% presupuesto ejecutado`,
          type: 'INFO',
          priority: 'LOW',
          data: {
            type: 'weekly_summary',
            stats: stats
          }
        })
      }

    } catch (error) {
      console.error('Error enviando resumen semanal:', error)
    }
  }

  // Obtener estadísticas diarias
  async getDailyStats(startDate, endDate) {
    const [reportsSubmitted, reportsPending, activitiesOverdue] = await Promise.all([
      prisma.progressReport.count({
        where: {
          updatedAt: {
            gte: startDate,
            lt: endDate
          },
          status: 'SUBMITTED'
        }
      }),
      prisma.progressReport.count({
        where: {
          status: 'DRAFT'
        }
      }),
      prisma.activity.count({
        where: {
          endDate: {
            lt: new Date()
          },
          status: {
            not: 'COMPLETED'
          }
        }
      })
    ])

    return {
      reportsSubmitted,
      reportsPending,
      activitiesOverdue
    }
  }

  // Obtener estadísticas semanales
  async getWeeklyStats(startDate, endDate) {
    const [totalReports, activitiesCompleted, budgetExecutions] = await Promise.all([
      prisma.progressReport.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        }
      }),
      prisma.activity.count({
        where: {
          updatedAt: {
            gte: startDate,
            lt: endDate
          },
          status: 'COMPLETED'
        }
      }),
      prisma.budgetExecution.findMany({
        select: {
          assignedAmount: true,
          executedAmount: true
        }
      })
    ])

    const totalAssigned = budgetExecutions.reduce((sum, budget) => sum + budget.assignedAmount, 0)
    const totalExecuted = budgetExecutions.reduce((sum, budget) => sum + budget.executedAmount, 0)
    const budgetExecuted = totalAssigned > 0 ? (totalExecuted / totalAssigned) * 100 : 0

    return {
      totalReports,
      activitiesCompleted,
      budgetExecuted: Math.round(budgetExecuted)
    }
  }

  // Parar el servicio
  stop() {
    this.isRunning = false
    console.log('🛑 AlertService detenido')
  }
}

module.exports = AlertService
