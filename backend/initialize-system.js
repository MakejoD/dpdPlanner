#!/usr/bin/env node

/**
 * Script de inicialización completa del sistema POA-PACC
 * Este script debe ejecutarse después de clonar el repositorio
 * para configurar completamente la aplicación con datos de ejemplo.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class SystemInitializer {
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

  async initialize() {
    console.log('🚀 INICIALIZANDO SISTEMA POA-PACC');
    console.log('=====================================\n');

    try {
      // 1. Verificar y crear archivo .env
      await this.setupEnvironment();
      
      // 2. Verificar base de datos
      await this.checkDatabase();
      
      // 3. Crear datos base del sistema
      await this.createSystemData();
      
      // 4. Crear datos de ejemplo
      await this.createSampleData();
      
      // 5. Configurar permisos
      await this.setupPermissions();
      
      // 6. Mostrar resumen
      this.showSummary();
      
      console.log('\n✅ ¡SISTEMA INICIALIZADO EXITOSAMENTE!');
      console.log('=====================================');
      console.log('🔐 Usuario administrador:');
      console.log('   Email: admin@poa.gov');
      console.log('   Contraseña: admin123');
      console.log('\n🌐 Servidor backend: http://localhost:3001');
      console.log('🖥️  Aplicación frontend: http://localhost:5173');
      console.log('\n📝 Para iniciar el sistema:');
      console.log('   Backend: npm start');
      console.log('   Frontend: npm run dev');

    } catch (error) {
      console.error('❌ Error durante la inicialización:', error.message);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async setupEnvironment() {
    console.log('🔧 Configurando variables de entorno...');
    
    const envPath = path.join(__dirname, '.env');
    const envContent = `# Configuración de Base de Datos
DATABASE_URL="file:./dev.db"

# Configuración JWT
JWT_SECRET="dpd-planner-jwt-secret-key-2025-production"
JWT_EXPIRES_IN="7d"

# Configuración del Servidor
PORT=3001
NODE_ENV=development

# Configuración de Logs
LOG_LEVEL=info
`;

    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Archivo .env creado');
    } else {
      // Verificar que contenga las variables necesarias
      const currentEnv = fs.readFileSync(envPath, 'utf8');
      if (!currentEnv.includes('JWT_SECRET')) {
        fs.appendFileSync(envPath, '\n# JWT Configuration\nJWT_SECRET="dpd-planner-jwt-secret-key-2025-production"\nJWT_EXPIRES_IN="7d"\n');
        console.log('✅ Variables JWT añadidas al .env');
      }
    }
  }

  async checkDatabase() {
    console.log('🗄️  Verificando conexión a la base de datos...');
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Conexión a la base de datos exitosa');
    } catch (error) {
      console.log('❌ Error de conexión a la base de datos');
      console.log('💡 Ejecuta: npx prisma db push');
      throw error;
    }
  }

  async createSystemData() {
    console.log('\n📊 Creando datos base del sistema...');
    
    // Crear departamentos
    await this.createDepartments();
    
    // Crear roles y permisos
    await this.createRolesAndPermissions();
    
    // Crear usuarios
    await this.createUsers();
  }

  async createDepartments() {
    console.log('🏢 Creando departamentos...');
    
    const departments = [
      {
        code: 'DPLAN',
        name: 'Dirección de Planificación',
        description: 'Responsable de la planificación estratégica y operativa'
      },
      {
        code: 'DADMIN',
        name: 'Dirección Administrativa',
        description: 'Gestión administrativa y recursos humanos'
      },
      {
        code: 'DFIN',
        name: 'Dirección Financiera',
        description: 'Gestión financiera y presupuestaria'
      },
      {
        code: 'DTECH',
        name: 'Dirección Técnica',
        description: 'Desarrollo y supervisión técnica de proyectos'
      },
      {
        code: 'DCOMP',
        name: 'Dirección de Compras y Contrataciones',
        description: 'Gestión de procesos de adquisiciones'
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
        }
      } catch (error) {
        console.log(`⚠️  Error creando departamento ${dept.code}:`, error.message);
      }
    }

    console.log(`✅ ${this.results.departments} departamentos creados`);
  }

  async createRolesAndPermissions() {
    console.log('👥 Creando roles y permisos...');
    
    // Crear permisos
    const permissions = [
      // Permisos básicos
      { action: 'create', resource: 'user' },
      { action: 'read', resource: 'user' },
      { action: 'update', resource: 'user' },
      { action: 'delete', resource: 'user' },
      
      // Permisos de departamentos
      { action: 'create', resource: 'department' },
      { action: 'read', resource: 'department' },
      { action: 'update', resource: 'department' },
      { action: 'delete', resource: 'department' },
      
      // Permisos de planificación
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
      
      // Permisos de seguimiento
      { action: 'create', resource: 'progress-report' },
      { action: 'read', resource: 'progress-report' },
      { action: 'update', resource: 'progress-report' },
      { action: 'delete', resource: 'progress-report' },
      { action: 'approve', resource: 'progress-report' },
      
      // Permisos de presupuesto
      { action: 'create', resource: 'budget-execution' },
      { action: 'read', resource: 'budget-execution' },
      { action: 'update', resource: 'budget-execution' },
      { action: 'delete', resource: 'budget-execution' },
      
      // Permisos PACC
      { action: 'create', resource: 'procurement_process' },
      { action: 'read', resource: 'procurement_process' },
      { action: 'update', resource: 'procurement_process' },
      { action: 'delete', resource: 'procurement_process' },
      
      // Permisos de roles
      { action: 'create', resource: 'role' },
      { action: 'read', resource: 'role' },
      { action: 'update', resource: 'role' },
      { action: 'delete', resource: 'role' },
      
      { action: 'read', resource: 'permission' }
    ];

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
        console.log(`⚠️  Error creando permiso ${perm.action}:${perm.resource}:`, error.message);
      }
    }

    // Crear roles
    const roles = [
      {
        name: 'Administrador',
        description: 'Acceso total al sistema'
      },
      {
        name: 'Director de Planificación',
        description: 'Gestión de planificación estratégica'
      },
      {
        name: 'Director de Área',
        description: 'Gestión de su departamento específico'
      },
      {
        name: 'Técnico de Seguimiento',
        description: 'Seguimiento y reporte de actividades'
      },
      {
        name: 'Director de Compras y Contrataciones',
        description: 'Gestión de procesos de adquisiciones'
      }
    ];

    for (const role of roles) {
      try {
        const existing = await prisma.role.findFirst({
          where: { name: role.name }
        });

        if (!existing) {
          await prisma.role.create({ data: role });
          this.results.roles++;
        }
      } catch (error) {
        console.log(`⚠️  Error creando rol ${role.name}:`, error.message);
      }
    }

    console.log(`✅ ${this.results.permissions} permisos y ${this.results.roles} roles creados`);
  }

  async createUsers() {
    console.log('👤 Creando usuarios...');
    
    const planningDept = await prisma.department.findFirst({
      where: { code: 'DPLAN' }
    });
    
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrador' }
    });

    if (!planningDept || !adminRole) {
      console.log('⚠️  No se pueden crear usuarios sin departamentos y roles');
      return;
    }

    const users = [
      {
        email: 'admin@poa.gov',
        firstName: 'Administrador',
        lastName: 'Sistema',
        passwordHash: await bcrypt.hash('admin123', 10),
        roleId: adminRole.id,
        departmentId: planningDept.id,
        isActive: true
      }
    ];

    for (const user of users) {
      try {
        const existing = await prisma.user.findFirst({
          where: { email: user.email }
        });

        if (!existing) {
          await prisma.user.create({ data: user });
          this.results.users++;
        }
      } catch (error) {
        console.log(`⚠️  Error creando usuario ${user.email}:`, error.message);
      }
    }

    console.log(`✅ ${this.results.users} usuarios creados`);
  }

  async createSampleData() {
    console.log('\n📝 Creando datos de ejemplo...');
    
    await this.createPlanningData();
    await this.createBudgetData();
    await this.createPACCData();
  }

  async createPlanningData() {
    console.log('📋 Creando estructura de planificación...');
    
    const department = await prisma.department.findFirst();
    if (!department) return;

    // Crear eje estratégico
    let strategicAxis;
    try {
      strategicAxis = await prisma.strategicAxis.findFirst();
      if (!strategicAxis) {
        strategicAxis = await prisma.strategicAxis.create({
          data: {
            code: 'EE001',
            name: 'Fortalecimiento Institucional',
            description: 'Mejorar la capacidad institucional y la eficiencia en la gestión',
            departmentId: department.id,
            isActive: true
          }
        });
        this.results.strategicAxes++;
      }
    } catch (error) {
      console.log('⚠️  Error creando eje estratégico:', error.message);
      return;
    }

    // Crear objetivo
    let objective;
    try {
      objective = await prisma.objective.findFirst();
      if (!objective) {
        objective = await prisma.objective.create({
          data: {
            code: 'OBJ001',
            name: 'Modernizar los procesos administrativos',
            description: 'Implementar tecnologías y procedimientos modernos',
            strategicAxisId: strategicAxis.id,
            isActive: true
          }
        });
        this.results.objectives++;
      }
    } catch (error) {
      console.log('⚠️  Error creando objetivo:', error.message);
      return;
    }

    // Crear producto
    let product;
    try {
      product = await prisma.product.findFirst();
      if (!product) {
        product = await prisma.product.create({
          data: {
            code: 'PROD001',
            name: 'Sistema de gestión digital implementado',
            description: 'Sistema POA-PACC operativo',
            objectiveId: objective.id,
            isActive: true
          }
        });
        this.results.products++;
      }
    } catch (error) {
      console.log('⚠️  Error creando producto:', error.message);
      return;
    }

    // Crear actividades
    try {
      const activityExists = await prisma.activity.findFirst();
      if (!activityExists) {
        await prisma.activity.create({
          data: {
            code: 'ACT001',
            name: 'Desarrollo del sistema POA-PACC',
            description: 'Implementación completa del sistema de planificación',
            productId: product.id,
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-12-31'),
            isActive: true
          }
        });
        this.results.activities++;
      }
    } catch (error) {
      console.log('⚠️  Error creando actividad:', error.message);
    }

    // Crear indicadores
    try {
      const indicatorExists = await prisma.indicator.findFirst();
      if (!indicatorExists) {
        await prisma.indicator.create({
          data: {
            name: 'Porcentaje de implementación del sistema',
            description: 'Mide el avance en la implementación del sistema POA-PACC',
            type: 'eficiencia',
            measurementUnit: 'porcentaje',
            baseline: 0,
            annualTarget: 100,
            strategicAxisId: strategicAxis.id,
            isActive: true
          }
        });
        this.results.indicators++;
      }
    } catch (error) {
      console.log('⚠️  Error creando indicador:', error.message);
    }

    console.log(`✅ Estructura de planificación creada`);
  }

  async createBudgetData() {
    console.log('💰 Creando datos presupuestarios...');
    
    try {
      const activity = await prisma.activity.findFirst();
      const budgetExists = await prisma.budgetExecution.findFirst();
      
      if (activity && !budgetExists) {
        await prisma.budgetExecution.create({
          data: {
            activityId: activity.id,
            fiscalYear: 2025,
            quarter: 'Q1',
            budgetedAmount: 100000.00,
            executedAmount: 25000.00,
            percentageExecuted: 25.0,
            status: 'EN_PROCESO',
            description: 'Ejecución presupuestaria primer trimestre 2025'
          }
        });
        this.results.budgetExecutions++;
      }
    } catch (error) {
      console.log('⚠️  Error creando datos presupuestarios:', error.message);
    }

    console.log(`✅ ${this.results.budgetExecutions} ejecuciones presupuestarias creadas`);
  }

  async createPACCData() {
    console.log('📊 Creando datos PACC...');
    
    try {
      // Crear evaluación de cumplimiento PACC
      const complianceExists = await prisma.paccCompliance.findFirst();
      if (!complianceExists) {
        const user = await prisma.user.findFirst();
        if (user) {
          await prisma.paccCompliance.create({
            data: {
              evaluationPeriod: '2025-01',
              periodType: 'MENSUAL',
              fiscalYear: 2025,
              totalProcesses: 25,
              processesOnSchedule: 18,
              processesDelayed: 5,
              processesAtRisk: 2,
              processesCancelled: 0,
              scheduledMilestones: 45,
              achievedMilestones: 38,
              delayedMilestones: 7,
              milestoneComplianceRate: 84.4,
              averageDelay: 3.2,
              criticalPathCompliance: 88.5,
              budgetCompliance: 92.1,
              legalComplianceScore: 95.0,
              timelinessScore: 84.4,
              qualityScore: 89.7,
              overallScore: 89.7,
              complianceGrade: 'B+',
              keyFindings: 'Sistema funcionando adecuadamente con algunas demoras menores en procesos no críticos.',
              recommendations: 'Mejorar seguimiento de hitos intermedios y comunicación entre departamentos.',
              actionPlan: 'Implementar alertas tempranas y reuniones semanales de seguimiento.',
              riskFactors: 'Dependencias externas y disponibilidad de presupuesto.',
              mitigationMeasures: 'Planes de contingencia y reservas presupuestarias.',
              evaluatedBy: user.id,
              evaluationDate: new Date()
            }
          });
          this.results.paccCompliance++;
        }
      }
    } catch (error) {
      console.log('⚠️  Error creando datos PACC:', error.message);
    }

    console.log(`✅ ${this.results.paccCompliance} evaluaciones PACC creadas`);
  }

  async setupPermissions() {
    console.log('\n🔐 Configurando permisos...');
    
    try {
      const adminRole = await prisma.role.findFirst({
        where: { name: 'Administrador' }
      });

      if (!adminRole) {
        console.log('⚠️  No se encontró el rol de administrador');
        return;
      }

      const permissions = await prisma.permission.findMany();
      let assignedCount = 0;

      for (const permission of permissions) {
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
      }

      console.log(`✅ ${assignedCount} permisos asignados al administrador`);
    } catch (error) {
      console.log('⚠️  Error configurando permisos:', error.message);
    }
  }

  showSummary() {
    console.log('\n📊 RESUMEN DE INICIALIZACIÓN');
    console.log('============================');
    console.log(`🏢 Departamentos: ${this.results.departments}`);
    console.log(`👥 Roles: ${this.results.roles}`);
    console.log(`🔐 Permisos: ${this.results.permissions}`);
    console.log(`👤 Usuarios: ${this.results.users}`);
    console.log(`🎯 Ejes Estratégicos: ${this.results.strategicAxes}`);
    console.log(`📋 Objetivos: ${this.results.objectives}`);
    console.log(`📦 Productos: ${this.results.products}`);
    console.log(`✅ Actividades: ${this.results.activities}`);
    console.log(`📊 Indicadores: ${this.results.indicators}`);
    console.log(`💰 Ejecuciones Presupuestarias: ${this.results.budgetExecutions}`);
    console.log(`📈 Evaluaciones PACC: ${this.results.paccCompliance}`);
  }
}

// Ejecutar inicialización si es llamado directamente
if (require.main === module) {
  const initializer = new SystemInitializer();
  initializer.initialize()
    .then(() => {
      console.log('\n🎉 ¡Inicialización completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal durante la inicialización:', error);
      process.exit(1);
    });
}

module.exports = SystemInitializer;
