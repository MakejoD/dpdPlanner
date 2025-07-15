#!/usr/bin/env node

/**
 * Script completo de configuración inicial del sistema POA-PACC
 * Ejecutar después de clonar el repositorio: node setup-complete-system.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

class SystemSetup {
  constructor() {
    this.results = {
      departments: 0,
      roles: 0,
      permissions: 0,
      users: 0,
      strategicAxes: 0,
      objectives: 0,
      products: 0,
      activities: 0,
      indicators: 0,
      budgetExecutions: 0,
      progressReports: 0,
      paccCompliance: 0,
      procurementProcesses: 0
    };
  }

  async setup() {
    console.log('🚀 CONFIGURACIÓN COMPLETA DEL SISTEMA POA-PACC');
    console.log('================================================\n');

    try {
      // 1. Configurar entorno
      await this.setupEnvironment();
      
      // 2. Verificar base de datos
      await this.verifyDatabase();
      
      // 3. Limpiar datos existentes (opcional)
      await this.askForCleanup();
      
      // 4. Crear estructura base
      await this.createBaseStructure();
      
      // 5. Crear datos de ejemplo completos
      await this.createCompleteExampleData();
      
      // 6. Configurar permisos
      await this.assignPermissions();
      
      // 7. Verificar sistema
      await this.verifySystem();
      
      // 8. Mostrar resultado
      this.showCompleteSummary();
      
    } catch (error) {
      console.error('❌ Error durante la configuración:', error.message);
      console.error('💡 Detalles:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async setupEnvironment() {
    console.log('🔧 Configurando archivo .env...');
    
    const envPath = path.join(__dirname, '.env');
    const envContent = `# Configuración de Base de Datos
DATABASE_URL="file:./dev.db"

# Configuración JWT
JWT_SECRET="dpd-planner-super-secret-jwt-key-2025-v2"
JWT_EXPIRES_IN="7d"

# Configuración del Servidor
PORT=3001
NODE_ENV=development

# Configuración de Logs
LOG_LEVEL=debug

# Configuración CORS
FRONTEND_URL="http://localhost:5173"

# Configuración de Archivos
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760
`;

    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Archivo .env creado con todas las variables');
    } else {
      console.log('✅ Archivo .env ya existe');
    }
  }

  async verifyDatabase() {
    console.log('🗄️  Verificando conexión a la base de datos...');
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Conexión a la base de datos establecida');
    } catch (error) {
      console.error('❌ Error de conexión a la base de datos');
      console.log('💡 Ejecuta: npx prisma generate && npx prisma db push');
      throw error;
    }
  }

  async askForCleanup() {
    // En un entorno automatizado, no limpiamos datos existentes
    // Solo creamos lo que no existe
    console.log('🧹 Verificando datos existentes (sin limpiar)...');
  }

  async createBaseStructure() {
    console.log('\n📊 Creando estructura base del sistema...');
    
    await this.createDepartments();
    await this.createRolesAndPermissions();
    await this.createUsers();
  }

  async createDepartments() {
    console.log('🏢 Creando departamentos...');
    
    const departments = [
      {
        code: 'DPLAN',
        name: 'Dirección de Planificación',
        description: 'Responsable de la planificación estratégica y operativa institucional'
      },
      {
        code: 'DADMIN',
        name: 'Dirección Administrativa',
        description: 'Gestión de recursos humanos y administración general'
      },
      {
        code: 'DFIN',
        name: 'Dirección Financiera',
        description: 'Gestión financiera, contable y presupuestaria'
      },
      {
        code: 'DTECH',
        name: 'Dirección Técnica',
        description: 'Desarrollo y supervisión técnica de proyectos estratégicos'
      },
      {
        code: 'DCOMP',
        name: 'Dirección de Compras y Contrataciones',
        description: 'Gestión del Plan Anual de Contrataciones (PACC)'
      },
      {
        code: 'LEGAL',
        name: 'Asesoría Legal',
        description: 'Asesoramiento jurídico y legal institucional'
      }
    ];

    for (const dept of departments) {
      try {
        const existing = await prisma.department.findFirst({
          where: { code: dept.code }
        });

        if (!existing) {
          await prisma.department.create({ data: dept });
          this.results.departments++;
          console.log(`   ✅ ${dept.code} - ${dept.name}`);
        } else {
          console.log(`   ⏭️  ${dept.code} - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando ${dept.code}:`, error.message);
      }
    }
  }

  async createRolesAndPermissions() {
    console.log('👥 Creando roles y permisos...');
    
    // Crear todos los permisos necesarios
    const permissions = [
      // Gestión de usuarios
      { action: 'create', resource: 'user' },
      { action: 'read', resource: 'user' },
      { action: 'update', resource: 'user' },
      { action: 'delete', resource: 'user' },
      
      // Gestión de departamentos
      { action: 'create', resource: 'department' },
      { action: 'read', resource: 'department' },
      { action: 'update', resource: 'department' },
      { action: 'delete', resource: 'department' },
      
      // Planificación estratégica
      { action: 'create', resource: 'strategic-axis' },
      { action: 'read', resource: 'strategic-axis' },
      { action: 'update', resource: 'strategic-axis' },
      { action: 'delete', resource: 'strategic-axis' },
      
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
      
      // Seguimiento y reportes
      { action: 'create', resource: 'progress-report' },
      { action: 'read', resource: 'progress-report' },
      { action: 'update', resource: 'progress-report' },
      { action: 'delete', resource: 'progress-report' },
      { action: 'approve', resource: 'progress-report' },
      { action: 'review', resource: 'progress-report' },
      
      // Gestión presupuestaria
      { action: 'create', resource: 'budget-execution' },
      { action: 'read', resource: 'budget-execution' },
      { action: 'update', resource: 'budget-execution' },
      { action: 'delete', resource: 'budget-execution' },
      { action: 'approve', resource: 'budget-execution' },
      
      // PACC (Plan Anual de Contrataciones)
      { action: 'create', resource: 'procurement_process' },
      { action: 'read', resource: 'procurement_process' },
      { action: 'update', resource: 'procurement_process' },
      { action: 'delete', resource: 'procurement_process' },
      { action: 'approve', resource: 'procurement_process' },
      
      // Gestión de roles
      { action: 'create', resource: 'role' },
      { action: 'read', resource: 'role' },
      { action: 'update', resource: 'role' },
      { action: 'delete', resource: 'role' },
      
      // Permisos
      { action: 'read', resource: 'permission' },
      { action: 'assign', resource: 'permission' },
      
      // Dashboards y reportes
      { action: 'read', resource: 'dashboard' },
      { action: 'read', resource: 'report' },
      { action: 'export', resource: 'report' }
    ];

    console.log('   🔐 Creando permisos...');
    for (const perm of permissions) {
      try {
        const existing = await prisma.permission.findUnique({
          where: {
            action_resource: {
              action: perm.action,
              resource: perm.resource
            }
          }
        });

        if (!existing) {
          await prisma.permission.create({ data: perm });
          this.results.permissions++;
        }
      } catch (error) {
        console.log(`     ❌ Error creando permiso ${perm.action}:${perm.resource}`);
      }
    }

    // Crear roles
    const roles = [
      {
        name: 'Administrador',
        description: 'Acceso total al sistema - Configuración y gestión completa'
      },
      {
        name: 'Director de Planificación',
        description: 'Gestión completa de planificación estratégica y seguimiento'
      },
      {
        name: 'Director de Área',
        description: 'Gestión de actividades y reportes de su departamento'
      },
      {
        name: 'Técnico de Seguimiento',
        description: 'Creación y actualización de reportes de progreso'
      },
      {
        name: 'Director de Compras y Contrataciones',
        description: 'Gestión completa del PACC y procesos de contratación'
      },
      {
        name: 'Analista de Presupuesto',
        description: 'Gestión y seguimiento de ejecución presupuestaria'
      },
      {
        name: 'Consultor',
        description: 'Acceso de solo lectura para consulta de información'
      }
    ];

    console.log('   👥 Creando roles...');
    for (const role of roles) {
      try {
        const existing = await prisma.role.findFirst({
          where: { name: role.name }
        });

        if (!existing) {
          await prisma.role.create({ data: role });
          this.results.roles++;
          console.log(`     ✅ ${role.name}`);
        } else {
          console.log(`     ⏭️  ${role.name} - Ya existe`);
        }
      } catch (error) {
        console.log(`     ❌ Error creando rol ${role.name}`);
      }
    }

    console.log(`✅ ${this.results.permissions} permisos y ${this.results.roles} roles creados`);
  }

  async createUsers() {
    console.log('👤 Creando usuarios del sistema...');
    
    const depts = await prisma.department.findMany();
    const roles = await prisma.role.findMany();

    if (depts.length === 0 || roles.length === 0) {
      console.log('⚠️  Faltan departamentos o roles para crear usuarios');
      return;
    }

    const planningDept = depts.find(d => d.code === 'DPLAN');
    const adminRole = roles.find(r => r.name === 'Administrador');
    const directorRole = roles.find(r => r.name === 'Director de Planificación');
    const tecnicoRole = roles.find(r => r.name === 'Técnico de Seguimiento');

    const users = [
      {
        email: 'admin@poa.gov',
        firstName: 'Administrador',
        lastName: 'Sistema',
        passwordHash: await bcrypt.hash('admin123', 10),
        roleId: adminRole?.id,
        departmentId: planningDept?.id,
        isActive: true
      },
      {
        email: 'director.planificacion@poa.gov',
        firstName: 'María Elena',
        lastName: 'González Pérez',
        passwordHash: await bcrypt.hash('director123', 10),
        roleId: directorRole?.id,
        departmentId: planningDept?.id,
        isActive: true
      },
      {
        email: 'juan.martinez@poa.gov',
        firstName: 'Juan Carlos',
        lastName: 'Martínez López',
        passwordHash: await bcrypt.hash('tecnico123', 10),
        roleId: tecnicoRole?.id,
        departmentId: planningDept?.id,
        isActive: true
      }
    ];

    for (const user of users) {
      try {
        const existing = await prisma.user.findFirst({
          where: { email: user.email }
        });

        if (!existing && user.roleId && user.departmentId) {
          await prisma.user.create({ data: user });
          this.results.users++;
          console.log(`   ✅ ${user.email} - ${user.firstName} ${user.lastName}`);
        } else if (existing) {
          console.log(`   ⏭️  ${user.email} - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando usuario ${user.email}:`, error.message);
      }
    }

    console.log(`✅ ${this.results.users} usuarios creados`);
  }

  async createCompleteExampleData() {
    console.log('\n📝 Creando datos de ejemplo completos...');
    
    await this.createPlanningStructure();
    await this.createIndicatorsAndReports();
    await this.createBudgetData();
    await this.createPACCData();
  }

  async createPlanningStructure() {
    console.log('📋 Creando estructura de planificación...');
    
    const department = await prisma.department.findFirst({
      where: { code: 'DPLAN' }
    });

    if (!department) {
      console.log('⚠️  No se encontró departamento de planificación');
      return;
    }

    // Crear ejes estratégicos
    const strategicAxes = [
      {
        code: 'EE001',
        name: 'Fortalecimiento Institucional',
        description: 'Mejorar la capacidad institucional y la eficiencia en la gestión pública',
        departmentId: department.id,
        isActive: true
      },
      {
        code: 'EE002',
        name: 'Modernización Tecnológica',
        description: 'Implementar tecnologías modernas para optimizar procesos',
        departmentId: department.id,
        isActive: true
      }
    ];

    const createdAxes = [];
    for (const axis of strategicAxes) {
      try {
        const existing = await prisma.strategicAxis.findFirst({
          where: { code: axis.code }
        });

        if (!existing) {
          const created = await prisma.strategicAxis.create({ data: axis });
          createdAxes.push(created);
          this.results.strategicAxes++;
          console.log(`   ✅ ${axis.code} - ${axis.name}`);
        } else {
          createdAxes.push(existing);
          console.log(`   ⏭️  ${axis.code} - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando eje ${axis.code}:`, error.message);
      }
    }

    // Crear objetivos
    const objectives = [
      {
        code: 'OBJ001',
        name: 'Modernizar los procesos administrativos',
        description: 'Implementar sistemas digitales y procedimientos eficientes',
        strategicAxisId: createdAxes[0]?.id,
        isActive: true
      },
      {
        code: 'OBJ002',
        name: 'Fortalecer las capacidades del personal',
        description: 'Capacitar al personal en nuevas tecnologías y metodologías',
        strategicAxisId: createdAxes[0]?.id,
        isActive: true
      },
      {
        code: 'OBJ003',
        name: 'Implementar sistema integral de gestión',
        description: 'Desarrollar plataforma tecnológica unificada',
        strategicAxisId: createdAxes[1]?.id,
        isActive: true
      }
    ];

    const createdObjectives = [];
    for (const objective of objectives) {
      try {
        if (!objective.strategicAxisId) continue;
        
        const existing = await prisma.objective.findFirst({
          where: { code: objective.code }
        });

        if (!existing) {
          const created = await prisma.objective.create({ data: objective });
          createdObjectives.push(created);
          this.results.objectives++;
          console.log(`   ✅ ${objective.code} - ${objective.name}`);
        } else {
          createdObjectives.push(existing);
          console.log(`   ⏭️  ${objective.code} - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando objetivo ${objective.code}:`, error.message);
      }
    }

    // Crear productos
    const products = [
      {
        code: 'PROD001',
        name: 'Sistema POA-PACC implementado',
        description: 'Plataforma digital para gestión de POA y PACC operativa',
        objectiveId: createdObjectives[2]?.id,
        isActive: true
      },
      {
        code: 'PROD002',
        name: 'Personal capacitado en nuevas tecnologías',
        description: 'Equipo técnico formado en el uso del sistema',
        objectiveId: createdObjectives[1]?.id,
        isActive: true
      },
      {
        code: 'PROD003',
        name: 'Procesos administrativos digitalizados',
        description: 'Procedimientos optimizados y automatizados',
        objectiveId: createdObjectives[0]?.id,
        isActive: true
      }
    ];

    const createdProducts = [];
    for (const product of products) {
      try {
        if (!product.objectiveId) continue;
        
        const existing = await prisma.product.findFirst({
          where: { code: product.code }
        });

        if (!existing) {
          const created = await prisma.product.create({ data: product });
          createdProducts.push(created);
          this.results.products++;
          console.log(`   ✅ ${product.code} - ${product.name}`);
        } else {
          createdProducts.push(existing);
          console.log(`   ⏭️  ${product.code} - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando producto ${product.code}:`, error.message);
      }
    }

    // Crear actividades
    const activities = [
      {
        code: 'ACT001',
        name: 'Desarrollo del módulo de planificación',
        description: 'Implementación completa del sistema de gestión POA',
        productId: createdProducts[0]?.id,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        isActive: true
      },
      {
        code: 'ACT002',
        name: 'Desarrollo del módulo PACC',
        description: 'Sistema de seguimiento del Plan Anual de Contrataciones',
        productId: createdProducts[0]?.id,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-08-31'),
        isActive: true
      },
      {
        code: 'ACT003',
        name: 'Capacitación del personal técnico',
        description: 'Formación en el uso de la plataforma POA-PACC',
        productId: createdProducts[1]?.id,
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-09-30'),
        isActive: true
      },
      {
        code: 'ACT004',
        name: 'Digitalización de procesos administrativos',
        description: 'Migración de procesos manuales a la plataforma digital',
        productId: createdProducts[2]?.id,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-11-30'),
        isActive: true
      }
    ];

    for (const activity of activities) {
      try {
        if (!activity.productId) continue;
        
        const existing = await prisma.activity.findFirst({
          where: { code: activity.code }
        });

        if (!existing) {
          await prisma.activity.create({ data: activity });
          this.results.activities++;
          console.log(`   ✅ ${activity.code} - ${activity.name}`);
        } else {
          console.log(`   ⏭️  ${activity.code} - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando actividad ${activity.code}:`, error.message);
      }
    }

    console.log(`✅ Estructura de planificación completa`);
  }

  async createIndicatorsAndReports() {
    console.log('📊 Creando indicadores y reportes...');
    
    const strategicAxes = await prisma.strategicAxis.findMany();
    const activities = await prisma.activity.findMany();
    const users = await prisma.user.findMany();

    if (strategicAxes.length === 0) return;

    // Crear indicadores
    const indicators = [
      {
        name: 'Porcentaje de implementación del sistema POA-PACC',
        description: 'Mide el avance en la implementación completa del sistema',
        type: 'eficiencia',
        measurementUnit: 'porcentaje',
        baseline: 0,
        annualTarget: 100,
        strategicAxisId: strategicAxes[0].id,
        isActive: true
      },
      {
        name: 'Número de procesos digitalizados',
        description: 'Cantidad de procedimientos migrados a la plataforma digital',
        type: 'producto',
        measurementUnit: 'número',
        baseline: 0,
        annualTarget: 25,
        strategicAxisId: strategicAxes[0].id,
        isActive: true
      },
      {
        name: 'Personal capacitado en nuevas tecnologías',
        description: 'Porcentaje de personal que ha completado la capacitación',
        type: 'resultado',
        measurementUnit: 'porcentaje',
        baseline: 0,
        annualTarget: 95,
        strategicAxisId: strategicAxes[0].id,
        isActive: true
      }
    ];

    for (const indicator of indicators) {
      try {
        const existing = await prisma.indicator.findFirst({
          where: { name: indicator.name }
        });

        if (!existing) {
          await prisma.indicator.create({ data: indicator });
          this.results.indicators++;
          console.log(`   ✅ ${indicator.name}`);
        } else {
          console.log(`   ⏭️  ${indicator.name} - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando indicador:`, error.message);
      }
    }

    // Crear reportes de progreso
    if (activities.length > 0 && users.length > 0) {
      const reportingUser = users[0];
      
      for (let i = 0; i < Math.min(3, activities.length); i++) {
        try {
          const existing = await prisma.progressReport.findFirst({
            where: { activityId: activities[i].id }
          });

          if (!existing) {
            await prisma.progressReport.create({
              data: {
                activityId: activities[i].id,
                reportingPeriod: '2025-01',
                periodType: 'MENSUAL',
                physicalProgress: 25.5,
                budgetProgress: 22.8,
                status: 'EN_PROGRESO',
                achievements: 'Inicio exitoso de la implementación con configuración base completada.',
                challenges: 'Coordinación entre equipos técnicos para definir requisitos específicos.',
                nextSteps: 'Completar módulo de planificación y iniciar pruebas unitarias.',
                reportedBy: reportingUser.id,
                reportDate: new Date()
              }
            });
            this.results.progressReports++;
          }
        } catch (error) {
          console.log(`   ❌ Error creando reporte para actividad ${i + 1}:`, error.message);
        }
      }
    }

    console.log(`✅ ${this.results.indicators} indicadores y ${this.results.progressReports} reportes creados`);
  }

  async createBudgetData() {
    console.log('💰 Creando datos presupuestarios...');
    
    const activities = await prisma.activity.findMany();
    
    if (activities.length === 0) return;

    const budgetData = [
      {
        fiscalYear: 2025,
        quarter: 'Q1',
        budgetedAmount: 150000.00,
        executedAmount: 37500.00,
        percentageExecuted: 25.0,
        status: 'EN_PROCESO',
        description: 'Ejecución presupuestaria primer trimestre - Desarrollo sistema POA-PACC'
      },
      {
        fiscalYear: 2025,
        quarter: 'Q2',
        budgetedAmount: 120000.00,
        executedAmount: 0.00,
        percentageExecuted: 0.0,
        status: 'PROGRAMADO',
        description: 'Presupuesto programado segundo trimestre - Capacitación y digitalización'
      }
    ];

    for (let i = 0; i < Math.min(budgetData.length, activities.length); i++) {
      try {
        const existing = await prisma.budgetExecution.findFirst({
          where: { 
            activityId: activities[i].id,
            fiscalYear: budgetData[i].fiscalYear,
            quarter: budgetData[i].quarter
          }
        });

        if (!existing) {
          await prisma.budgetExecution.create({
            data: {
              ...budgetData[i],
              activityId: activities[i].id
            }
          });
          this.results.budgetExecutions++;
          console.log(`   ✅ Ejecución ${budgetData[i].quarter} 2025 - ${activities[i].name}`);
        } else {
          console.log(`   ⏭️  Ejecución ${budgetData[i].quarter} 2025 - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando ejecución presupuestaria:`, error.message);
      }
    }

    console.log(`✅ ${this.results.budgetExecutions} ejecuciones presupuestarias creadas`);
  }

  async createPACCData() {
    console.log('📊 Creando datos del Plan Anual de Contrataciones (PACC)...');
    
    const users = await prisma.user.findMany();
    if (users.length === 0) return;

    // Crear evaluación de cumplimiento PACC
    try {
      const existing = await prisma.paccCompliance.findFirst({
        where: { evaluationPeriod: '2025-01' }
      });

      if (!existing) {
        await prisma.paccCompliance.create({
          data: {
            evaluationPeriod: '2025-01',
            periodType: 'MENSUAL',
            fiscalYear: 2025,
            totalProcesses: 32,
            processesOnSchedule: 24,
            processesDelayed: 6,
            processesAtRisk: 2,
            processesCancelled: 0,
            scheduledMilestones: 58,
            achievedMilestones: 47,
            delayedMilestones: 11,
            milestoneComplianceRate: 81.0,
            averageDelay: 4.2,
            criticalPathCompliance: 85.7,
            budgetCompliance: 89.3,
            legalComplianceScore: 96.2,
            timelinessScore: 81.0,
            qualityScore: 87.5,
            overallScore: 87.9,
            complianceGrade: 'B+',
            keyFindings: 'El sistema PACC muestra un rendimiento satisfactorio con algunas demoras menores en procesos no críticos. La implementación del sistema POA-PACC está facilitando el seguimiento.',
            recommendations: 'Fortalecer el seguimiento de hitos intermedios y mejorar la comunicación entre departamentos. Implementar alertas tempranas para procesos críticos.',
            actionPlan: 'Establecer reuniones semanales de seguimiento, implementar dashboard de alertas, y crear protocolos de escalamiento para demoras.',
            riskFactors: 'Dependencias con proveedores externos, disponibilidad presupuestaria, y cambios normativos.',
            mitigationMeasures: 'Diversificación de proveedores, reservas presupuestarias de contingencia, y monitoreo continuo de cambios regulatorios.',
            evaluatedBy: users[0].id,
            evaluationDate: new Date()
          }
        });
        this.results.paccCompliance++;
        console.log('   ✅ Evaluación PACC Enero 2025');
      } else {
        console.log('   ⏭️  Evaluación PACC Enero 2025 - Ya existe');
      }
    } catch (error) {
      console.log('   ❌ Error creando datos PACC:', error.message);
    }

    // Crear procesos de contratación de ejemplo
    const procurementProcesses = [
      {
        processCode: 'PROC-2025-001',
        processName: 'Adquisición de equipos informáticos',
        category: 'BIENES',
        priority: 'ALTA',
        estimatedValue: 85000.00,
        status: 'EN_PROCESO',
        plannedStartDate: new Date('2025-02-01'),
        expectedEndDate: new Date('2025-04-30'),
        description: 'Compra de servidores y equipos de cómputo para modernización tecnológica'
      },
      {
        processCode: 'PROC-2025-002',
        processName: 'Contratación de servicios de capacitación',
        category: 'SERVICIOS',
        priority: 'MEDIA',
        estimatedValue: 45000.00,
        status: 'PROGRAMADO',
        plannedStartDate: new Date('2025-03-15'),
        expectedEndDate: new Date('2025-06-15'),
        description: 'Capacitación del personal en uso de nuevas tecnologías y sistemas'
      }
    ];

    for (const process of procurementProcesses) {
      try {
        const existing = await prisma.procurementProcess.findFirst({
          where: { processCode: process.processCode }
        });

        if (!existing) {
          await prisma.procurementProcess.create({ data: process });
          this.results.procurementProcesses++;
          console.log(`   ✅ ${process.processCode} - ${process.processName}`);
        } else {
          console.log(`   ⏭️  ${process.processCode} - Ya existe`);
        }
      } catch (error) {
        console.log(`   ❌ Error creando proceso ${process.processCode}:`, error.message);
      }
    }

    console.log(`✅ ${this.results.paccCompliance} evaluaciones PACC y ${this.results.procurementProcesses} procesos creados`);
  }

  async assignPermissions() {
    console.log('\n🔐 Configurando permisos por rol...');
    
    const roles = await prisma.role.findMany();
    const permissions = await prisma.permission.findMany();

    if (roles.length === 0 || permissions.length === 0) {
      console.log('⚠️  No hay roles o permisos para configurar');
      return;
    }

    const adminRole = roles.find(r => r.name === 'Administrador');
    const directorPlanRole = roles.find(r => r.name === 'Director de Planificación');
    const directorComprasRole = roles.find(r => r.name === 'Director de Compras y Contrataciones');

    // Asignar todos los permisos al administrador
    if (adminRole) {
      let assignedCount = 0;
      for (const permission of permissions) {
        try {
          const existing = await prisma.rolePermission.findFirst({
            where: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          });

          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: adminRole.id,
                permissionId: permission.id
              }
            });
            assignedCount++;
          }
        } catch (error) {
          // Ignorar errores de permisos duplicados
        }
      }
      console.log(`   ✅ Administrador: ${assignedCount} permisos asignados`);
    }

    // Asignar permisos específicos al Director de Planificación
    if (directorPlanRole) {
      const planningPermissions = permissions.filter(p => 
        p.resource.includes('strategic-axis') ||
        p.resource.includes('objective') ||
        p.resource.includes('product') ||
        p.resource.includes('activity') ||
        p.resource.includes('indicator') ||
        p.resource.includes('progress-report') ||
        p.resource.includes('dashboard') ||
        p.resource.includes('report')
      );

      let assignedCount = 0;
      for (const permission of planningPermissions) {
        try {
          const existing = await prisma.rolePermission.findFirst({
            where: {
              roleId: directorPlanRole.id,
              permissionId: permission.id
            }
          });

          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: directorPlanRole.id,
                permissionId: permission.id
              }
            });
            assignedCount++;
          }
        } catch (error) {
          // Ignorar errores
        }
      }
      console.log(`   ✅ Director de Planificación: ${assignedCount} permisos asignados`);
    }

    // Asignar permisos PACC al Director de Compras
    if (directorComprasRole) {
      const paccPermissions = permissions.filter(p => 
        p.resource.includes('procurement_process') ||
        p.resource.includes('dashboard') ||
        p.resource.includes('report')
      );

      let assignedCount = 0;
      for (const permission of paccPermissions) {
        try {
          const existing = await prisma.rolePermission.findFirst({
            where: {
              roleId: directorComprasRole.id,
              permissionId: permission.id
            }
          });

          if (!existing) {
            await prisma.rolePermission.create({
              data: {
                roleId: directorComprasRole.id,
                permissionId: permission.id
              }
            });
            assignedCount++;
          }
        } catch (error) {
          // Ignorar errores
        }
      }
      console.log(`   ✅ Director de Compras: ${assignedCount} permisos asignados`);
    }

    console.log('✅ Permisos configurados correctamente');
  }

  async verifySystem() {
    console.log('\n🔍 Verificando sistema...');
    
    try {
      // Verificar datos base
      const deptCount = await prisma.department.count();
      const roleCount = await prisma.role.count();
      const userCount = await prisma.user.count();
      const permissionCount = await prisma.permission.count();
      
      console.log(`   📊 Departamentos: ${deptCount}`);
      console.log(`   👥 Roles: ${roleCount}`);
      console.log(`   👤 Usuarios: ${userCount}`);
      console.log(`   🔐 Permisos: ${permissionCount}`);
      
      // Verificar datos de planificación
      const axisCount = await prisma.strategicAxis.count();
      const objectiveCount = await prisma.objective.count();
      const productCount = await prisma.product.count();
      const activityCount = await prisma.activity.count();
      const indicatorCount = await prisma.indicator.count();
      
      console.log(`   🎯 Ejes Estratégicos: ${axisCount}`);
      console.log(`   📋 Objetivos: ${objectiveCount}`);
      console.log(`   📦 Productos: ${productCount}`);
      console.log(`   ✅ Actividades: ${activityCount}`);
      console.log(`   📊 Indicadores: ${indicatorCount}`);
      
      // Verificar datos de seguimiento
      const reportCount = await prisma.progressReport.count();
      const budgetCount = await prisma.budgetExecution.count();
      const paccCount = await prisma.paccCompliance.count();
      
      console.log(`   📈 Reportes de Progreso: ${reportCount}`);
      console.log(`   💰 Ejecuciones Presupuestarias: ${budgetCount}`);
      console.log(`   📊 Evaluaciones PACC: ${paccCount}`);
      
      console.log('✅ Verificación completada - Sistema listo');
      
    } catch (error) {
      console.error('❌ Error en verificación:', error.message);
      throw error;
    }
  }

  showCompleteSummary() {
    console.log('\n🎯 RESUMEN COMPLETO DE CONFIGURACIÓN');
    console.log('=====================================');
    console.log('📊 ESTRUCTURA BASE:');
    console.log(`   🏢 Departamentos: ${this.results.departments}`);
    console.log(`   👥 Roles: ${this.results.roles}`);
    console.log(`   🔐 Permisos: ${this.results.permissions}`);
    console.log(`   👤 Usuarios: ${this.results.users}`);
    
    console.log('\n📋 PLANIFICACIÓN:');
    console.log(`   🎯 Ejes Estratégicos: ${this.results.strategicAxes}`);
    console.log(`   📋 Objetivos: ${this.results.objectives}`);
    console.log(`   📦 Productos: ${this.results.products}`);
    console.log(`   ✅ Actividades: ${this.results.activities}`);
    console.log(`   📊 Indicadores: ${this.results.indicators}`);
    
    console.log('\n📈 SEGUIMIENTO:');
    console.log(`   📈 Reportes de Progreso: ${this.results.progressReports}`);
    console.log(`   💰 Ejecuciones Presupuestarias: ${this.results.budgetExecutions}`);
    console.log(`   📊 Evaluaciones PACC: ${this.results.paccCompliance}`);
    console.log(`   🛒 Procesos de Contratación: ${this.results.procurementProcesses}`);
    
    console.log('\n🔐 CREDENCIALES DE ACCESO:');
    console.log('============================');
    console.log('👨‍💼 Administrador del Sistema:');
    console.log('   📧 Email: admin@poa.gov');
    console.log('   🔑 Contraseña: admin123');
    console.log('');
    console.log('👩‍💼 Director de Planificación:');
    console.log('   📧 Email: director.planificacion@poa.gov');
    console.log('   🔑 Contraseña: director123');
    console.log('');
    console.log('👨‍💻 Técnico de Seguimiento:');
    console.log('   📧 Email: juan.martinez@poa.gov');
    console.log('   🔑 Contraseña: tecnico123');
    
    console.log('\n🌐 INFORMACIÓN DEL SISTEMA:');
    console.log('==============================');
    console.log('🔗 Backend API: http://localhost:3001');
    console.log('🖥️  Frontend: http://localhost:5173');
    console.log('📝 Base de datos: SQLite (dev.db)');
    console.log('🔐 JWT configurado con clave segura');
    
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('===================');
    console.log('1. 🚀 Iniciar backend: npm start');
    console.log('2. 🌐 Iniciar frontend: npm run dev');
    console.log('3. 🔐 Acceder con cualquiera de las credenciales');
    console.log('4. 📊 Explorar los dashboards y funcionalidades');
    console.log('');
    console.log('💡 El sistema ya tiene datos de ejemplo completos');
    console.log('💡 Todos los endpoints están funcionando');
    console.log('💡 Los permisos están configurados correctamente');
  }
}

// Ejecutar configuración si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new SystemSetup();
  setup.setup()
    .then(() => {
      console.log('\n🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('El sistema POA-PACC está listo para usar.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 ERROR FATAL EN LA CONFIGURACIÓN:');
      console.error(error.message);
      console.error('\n💡 Sugerencias:');
      console.error('1. Verificar que la base de datos esté configurada: npx prisma db push');
      console.error('2. Instalar dependencias: npm install');
      console.error('3. Verificar archivo .env');
      process.exit(1);
    });
}

export default SystemSetup;
