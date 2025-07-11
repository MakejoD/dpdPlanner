const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // 1. Crear permisos del sistema
    console.log('📋 Creando permisos del sistema...');
    
    const permissions = [
      // Permisos de usuarios
      { action: 'create', resource: 'user' },
      { action: 'read', resource: 'user' },
      { action: 'update', resource: 'user' },
      { action: 'delete', resource: 'user' },
      
      // Permisos de roles
      { action: 'create', resource: 'role' },
      { action: 'read', resource: 'role' },
      { action: 'update', resource: 'role' },
      { action: 'delete', resource: 'role' },
      
      // Permisos de permisos
      { action: 'create', resource: 'permission' },
      { action: 'read', resource: 'permission' },
      { action: 'update', resource: 'permission' },
      { action: 'delete', resource: 'permission' },
      
      // Permisos de departamentos
      { action: 'create', resource: 'department' },
      { action: 'read', resource: 'department' },
      { action: 'update', resource: 'department' },
      { action: 'delete', resource: 'department' },
      
      // Permisos de planificación
      { action: 'create', resource: 'strategic_axis' },
      { action: 'read', resource: 'strategic_axis' },
      { action: 'update', resource: 'strategic_axis' },
      { action: 'delete', resource: 'strategic_axis' },
      { action: 'lock', resource: 'strategic_axis' },
      
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
      { action: 'create', resource: 'progress_report' },
      { action: 'read', resource: 'progress_report' },
      { action: 'update', resource: 'progress_report' },
      { action: 'delete', resource: 'progress_report' },
      { action: 'approve', resource: 'progress_report' },
      { action: 'reject', resource: 'progress_report' },
      
      // Permisos de presupuesto
      { action: 'create', resource: 'budget' },
      { action: 'read', resource: 'budget' },
      { action: 'update', resource: 'budget' },
      { action: 'delete', resource: 'budget' },
      
      // Permisos de dashboard
      { action: 'read', resource: 'dashboard' },
      { action: 'export', resource: 'report' }
    ];

    await prisma.permission.createMany({
      data: permissions,
      skipDuplicates: true
    });

    // 2. Crear roles del sistema
    console.log('👥 Creando roles del sistema...');
    
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrador' },
      update: {},
      create: {
        name: 'Administrador',
        description: 'Acceso completo al sistema. Gestiona usuarios, roles y configuración general.'
      }
    });

    const planningDirectorRole = await prisma.role.upsert({
      where: { name: 'Director de Planificación' },
      update: {},
      create: {
        name: 'Director de Planificación',
        description: 'Responsable de la formulación del POA. Acceso a planificación y seguimiento global.'
      }
    });

    const areaDirectorRole = await prisma.role.upsert({
      where: { name: 'Director de Área' },
      update: {},
      create: {
        name: 'Director de Área',
        description: 'Supervisa el cumplimiento de su área. Aprueba reportes de su equipo.'
      }
    });

    const technicalRole = await prisma.role.upsert({
      where: { name: 'Técnico Registrador' },
      update: {},
      create: {
        name: 'Técnico Registrador',
        description: 'Registra avances de actividades asignadas. Acceso limitado a sus responsabilidades.'
      }
    });

    const auditorRole = await prisma.role.upsert({
      where: { name: 'Auditor' },
      update: {},
      create: {
        name: 'Auditor',
        description: 'Acceso de solo lectura a toda la información para transparencia y fiscalización.'
      }
    });

    // 3. Asignar permisos a roles
    console.log('🔐 Asignando permisos a roles...');
    
    // Obtener todos los permisos
    const allPermissions = await prisma.permission.findMany();
    
    // Administrador: todos los permisos
    await prisma.rolePermission.createMany({
      data: allPermissions.map(permission => ({
        roleId: adminRole.id,
        permissionId: permission.id
      })),
      skipDuplicates: true
    });

    // Director de Planificación: permisos de planificación y lectura global
    const planningPermissions = allPermissions.filter(p => 
      ['strategic_axis', 'objective', 'product', 'activity', 'indicator'].includes(p.resource) ||
      (p.action === 'read' && ['progress_report', 'dashboard', 'department'].includes(p.resource))
    );
    
    await prisma.rolePermission.createMany({
      data: planningPermissions.map(permission => ({
        roleId: planningDirectorRole.id,
        permissionId: permission.id
      })),
      skipDuplicates: true
    });

    // Director de Área: lectura y aprobación de reportes
    const areaDirectorPermissions = allPermissions.filter(p => 
      (p.action === 'read' && ['strategic_axis', 'objective', 'product', 'activity', 'indicator', 'progress_report', 'dashboard'].includes(p.resource)) ||
      (['approve', 'reject'].includes(p.action) && p.resource === 'progress_report')
    );
    
    await prisma.rolePermission.createMany({
      data: areaDirectorPermissions.map(permission => ({
        roleId: areaDirectorRole.id,
        permissionId: permission.id
      })),
      skipDuplicates: true
    });

    // Técnico Registrador: crear y actualizar reportes propios
    const technicianPermissions = allPermissions.filter(p => 
      (p.action === 'read' && ['activity', 'indicator'].includes(p.resource)) ||
      (['create', 'update'].includes(p.action) && p.resource === 'progress_report')
    );
    
    await prisma.rolePermission.createMany({
      data: technicianPermissions.map(permission => ({
        roleId: technicalRole.id,
        permissionId: permission.id
      })),
      skipDuplicates: true
    });

    // Auditor: solo lectura de todo
    const auditorPermissions = allPermissions.filter(p => p.action === 'read');
    
    await prisma.rolePermission.createMany({
      data: auditorPermissions.map(permission => ({
        roleId: auditorRole.id,
        permissionId: permission.id
      })),
      skipDuplicates: true
    });

    // 4. Crear departamentos ejemplo
    console.log('🏢 Creando estructura de departamentos...');
    
    const rootDepartment = await prisma.department.upsert({
      where: { name: 'Dirección General' },
      update: {},
      create: {
        name: 'Dirección General',
        description: 'Dirección General de la Institución',
        code: 'DG'
      }
    });

    const planningDept = await prisma.department.upsert({
      where: { name: 'Dirección de Planificación y Desarrollo' },
      update: {},
      create: {
        name: 'Dirección de Planificación y Desarrollo',
        description: 'Responsable de la planificación estratégica y operativa',
        code: 'DPD',
        parentId: rootDepartment.id
      }
    });

    const financeDept = await prisma.department.upsert({
      where: { name: 'Dirección Financiera' },
      update: {},
      create: {
        name: 'Dirección Financiera',
        description: 'Gestión financiera y presupuestaria',
        code: 'DF',
        parentId: rootDepartment.id
      }
    });

    const hrDept = await prisma.department.upsert({
      where: { name: 'Dirección de Recursos Humanos' },
      update: {},
      create: {
        name: 'Dirección de Recursos Humanos',
        description: 'Gestión del talento humano',
        code: 'DRH',
        parentId: rootDepartment.id
      }
    });

    // 5. Crear usuario administrador por defecto
    console.log('👤 Creando usuario administrador...');
    
    const adminPassword = await bcrypt.hash('admin123456', 12);
    
    await prisma.user.upsert({
      where: { email: 'admin@poa.gov' },
      update: {},
      create: {
        email: 'admin@poa.gov',
        firstName: 'Administrador',
        lastName: 'del Sistema',
        passwordHash: adminPassword,
        roleId: adminRole.id,
        departmentId: rootDepartment.id
      }
    });

    // 6. Crear algunos usuarios de ejemplo
    console.log('👥 Creando usuarios de ejemplo...');
    
    const planningPassword = await bcrypt.hash('planning123', 12);
    await prisma.user.upsert({
      where: { email: 'planificacion@poa.gov' },
      update: {},
      create: {
        email: 'planificacion@poa.gov',
        firstName: 'Director',
        lastName: 'de Planificación',
        passwordHash: planningPassword,
        roleId: planningDirectorRole.id,
        departmentId: planningDept.id
      }
    });

    const financePassword = await bcrypt.hash('finance123', 12);
    await prisma.user.upsert({
      where: { email: 'finanzas@poa.gov' },
      update: {},
      create: {
        email: 'finanzas@poa.gov',
        firstName: 'Director',
        lastName: 'Financiero',
        passwordHash: financePassword,
        roleId: areaDirectorRole.id,
        departmentId: financeDept.id
      }
    });

    const techPassword = await bcrypt.hash('tecnico123', 12);
    await prisma.user.upsert({
      where: { email: 'tecnico@poa.gov' },
      update: {},
      create: {
        email: 'tecnico@poa.gov',
        firstName: 'Técnico',
        lastName: 'Registrador',
        passwordHash: techPassword,
        roleId: technicalRole.id,
        departmentId: planningDept.id
      }
    });

    // 7. Crear partidas presupuestarias ejemplo
    console.log('💰 Creando partidas presupuestarias...');
    
    const budgetItems = [
      { code: '100', name: 'Servicios Personales', category: 'Gastos Corrientes' },
      { code: '200', name: 'Servicios No Personales', category: 'Gastos Corrientes' },
      { code: '300', name: 'Materiales y Suministros', category: 'Gastos Corrientes' },
      { code: '400', name: 'Bienes de Uso', category: 'Gastos de Capital' },
      { code: '500', name: 'Transferencias', category: 'Transferencias' },
      { code: '600', name: 'Activos Financieros', category: 'Gastos de Capital' }
    ];

    for (const item of budgetItems) {
      await prisma.budgetItem.upsert({
        where: { code: item.code },
        update: {},
        create: item
      });
    }

    console.log('✅ Seed completado exitosamente!');
    console.log('');
    console.log('🔑 Credenciales de acceso:');
    console.log('  👤 Administrador: admin@poa.gov / admin123456');
    console.log('  📋 Director Planificación: planificacion@poa.gov / planning123');
    console.log('  💼 Director Financiero: finanzas@poa.gov / finance123');
    console.log('  🔧 Técnico: tecnico@poa.gov / tecnico123');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
