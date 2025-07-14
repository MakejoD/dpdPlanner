// Script para configurar el módulo PAC completo
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupPACModule() {
  console.log('🚀 Configurando módulo PAC completo...');

  try {
    // 1. Crear permisos PAC si no existen
    console.log('📝 Configurando permisos PAC...');
    
    const pacPermissions = [
      { name: 'create_procurement_process', description: 'Crear procesos de compra' },
      { name: 'read_procurement_process', description: 'Leer procesos de compra' },
      { name: 'update_procurement_process', description: 'Actualizar procesos de compra' },
      { name: 'delete_procurement_process', description: 'Eliminar procesos de compra' },
      { name: 'approve_procurement_process', description: 'Aprobar procesos de compra' },
      { name: 'export_procurement_process', description: 'Exportar datos de procesos de compra' },
      
      { name: 'create_activity_procurement_link', description: 'Crear vínculos POA-PAC' },
      { name: 'read_activity_procurement_link', description: 'Leer vínculos POA-PAC' },
      { name: 'update_activity_procurement_link', description: 'Actualizar vínculos POA-PAC' },
      { name: 'delete_activity_procurement_link', description: 'Eliminar vínculos POA-PAC' },
      
      { name: 'manage_pac_budget', description: 'Gestionar presupuesto PAC' },
      { name: 'view_pac_reports', description: 'Ver reportes PAC' },
      { name: 'manage_pac_compliance', description: 'Gestionar cumplimiento normativo PAC' },
      { name: 'audit_pac_processes', description: 'Auditar procesos PAC' }
    ];

    for (const permission of pacPermissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
    }

    // 2. Crear roles PAC si no existen
    console.log('👥 Configurando roles PAC...');
    
    const pacRoles = [
      {
        name: 'Director de Compras y Contrataciones',
        description: 'Director responsable de la gestión completa del PAC',
        permissions: [
          'create_procurement_process', 'read_procurement_process', 'update_procurement_process', 'delete_procurement_process',
          'approve_procurement_process', 'export_procurement_process',
          'create_activity_procurement_link', 'read_activity_procurement_link', 'update_activity_procurement_link', 'delete_activity_procurement_link',
          'manage_pac_budget', 'view_pac_reports', 'manage_pac_compliance', 'audit_pac_processes'
        ]
      },
      {
        name: 'Analista de Compras',
        description: 'Analista encargado de gestionar procesos de compra específicos',
        permissions: [
          'create_procurement_process', 'read_procurement_process', 'update_procurement_process',
          'create_activity_procurement_link', 'read_activity_procurement_link', 'update_activity_procurement_link',
          'view_pac_reports'
        ]
      },
      {
        name: 'Coordinador PAC',
        description: 'Coordinador de la implementación del Plan Anual de Compras',
        permissions: [
          'read_procurement_process', 'update_procurement_process',
          'read_activity_procurement_link', 'update_activity_procurement_link',
          'view_pac_reports', 'manage_pac_compliance'
        ]
      }
    ];

    for (const roleData of pacRoles) {
      // Crear o actualizar rol
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: { description: roleData.description },
        create: {
          name: roleData.name,
          description: roleData.description
        }
      });

      // Asignar permisos al rol
      for (const permissionName of roleData.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }

    // 3. Verificar usuario admin y asignar permisos PAC
    console.log('🔐 Configurando permisos de administrador...');
    
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@dpdplanner.gov.do' }
    });

    if (adminUser) {
      const directorRole = await prisma.role.findUnique({
        where: { name: 'Director de Compras y Contrataciones' }
      });

      if (directorRole) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: adminUser.id,
              roleId: directorRole.id
            }
          },
          update: {},
          create: {
            userId: adminUser.id,
            roleId: directorRole.id
          }
        });
        console.log('✅ Usuario admin configurado con rol Director de Compras y Contrataciones');
      }
    }

    // 4. Crear datos de ejemplo de procesos de compra
    console.log('📊 Creando datos de ejemplo...');
    
    const currentYear = new Date().getFullYear();
    const departments = await prisma.department.findMany();
    
    if (departments.length > 0) {
      const sampleProcesses = [
        {
          cuciCode: 'CUCI-2024-001',
          description: 'Adquisición de equipos de computación para modernización tecnológica',
          procurementMethod: 'LICITACION_PUBLICA',
          fundingSource: 'PRESUPUESTO_NACIONAL',
          totalCost: 2500000.00,
          plannedStartDate: new Date(`${currentYear}-03-01`),
          plannedEndDate: new Date(`${currentYear}-06-30`),
          status: 'PLANIFICADO',
          fiscalYear: currentYear,
          departmentId: departments[0].id,
          createdById: adminUser?.id
        },
        {
          cuciCode: 'CUCI-2024-002',
          description: 'Servicios de consultoría para implementación de sistema de gestión documental',
          procurementMethod: 'COMPARACION_PRECIOS',
          fundingSource: 'RECURSOS_PROPIOS',
          totalCost: 800000.00,
          plannedStartDate: new Date(`${currentYear}-04-15`),
          plannedEndDate: new Date(`${currentYear}-08-15`),
          status: 'EN_PROCESO',
          fiscalYear: currentYear,
          departmentId: departments[Math.min(1, departments.length - 1)].id,
          createdById: adminUser?.id
        },
        {
          cuciCode: 'CUCI-2024-003',
          description: 'Suministro de materiales de oficina y papelería institucional',
          procurementMethod: 'COMPRA_MENOR',
          fundingSource: 'PRESUPUESTO_NACIONAL',
          totalCost: 150000.00,
          plannedStartDate: new Date(`${currentYear}-02-01`),
          plannedEndDate: new Date(`${currentYear}-12-31`),
          status: 'ADJUDICADO',
          fiscalYear: currentYear,
          departmentId: departments[Math.min(2, departments.length - 1)].id,
          createdById: adminUser?.id
        }
      ];

      for (const processData of sampleProcesses) {
        await prisma.procurementProcess.upsert({
          where: { cuciCode: processData.cuciCode },
          update: {},
          create: processData
        });
      }
    }

    // 5. Verificar estructura de la base de datos
    console.log('🔍 Verificando estructura de la base de datos...');
    
    const procurementCount = await prisma.procurementProcess.count();
    const linkCount = await prisma.activityProcurementLink.count();
    const pacRoleCount = await prisma.role.count({
      where: {
        name: {
          in: ['Director de Compras y Contrataciones', 'Analista de Compras', 'Coordinador PAC']
        }
      }
    });
    
    console.log('\n📈 Resumen de la configuración:');
    console.log(`   • Procesos de compra: ${procurementCount}`);
    console.log(`   • Vínculos POA-PAC: ${linkCount}`);
    console.log(`   • Roles PAC: ${pacRoleCount}`);
    console.log(`   • Permisos PAC: ${pacPermissions.length}`);

    console.log('\n✅ Módulo PAC configurado exitosamente!');
    console.log('\n🎯 Funcionalidades disponibles:');
    console.log('   • Gestión completa de procesos de compra');
    console.log('   • Vinculación bidireccional POA-PAC');
    console.log('   • Control presupuestario integrado');
    console.log('   • Roles y permisos especializados');
    console.log('   • Reportes y análisis avanzados');
    console.log('   • Cumplimiento normativo DGCP');

  } catch (error) {
    console.error('❌ Error configurando módulo PAC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar configuración
if (require.main === module) {
  setupPACModule()
    .then(() => {
      console.log('\n🚀 Configuración completada. El módulo PAC está listo para usar.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la configuración:', error);
      process.exit(1);
    });
}

module.exports = { setupPACModule };
