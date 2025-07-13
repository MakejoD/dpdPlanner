const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createBasicStructure() {
  console.log('🏗️ Creando estructura básica del sistema...\n');

  try {
    // 1. Crear departamento básico
    console.log('📂 Creando departamento...');
    const department = await prisma.department.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        code: 'ADMIN',
        name: 'Departamento de Administración',
        description: 'Departamento administrativo principal'
      }
    });
    console.log(`✅ Departamento creado: ${department.name}`);

    // 2. Crear roles básicos
    console.log('\n👥 Creando roles...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrador' },
      update: {},
      create: {
        name: 'Administrador',
        description: 'Administrador del sistema'
      }
    });
    console.log(`✅ Rol creado: ${adminRole.name}`);

    const directorRole = await prisma.role.upsert({
      where: { name: 'Director' },
      update: {},
      create: {
        name: 'Director',
        description: 'Director de área'
      }
    });
    console.log(`✅ Rol creado: ${directorRole.name}`);

    const tecnicoRole = await prisma.role.upsert({
      where: { name: 'Técnico' },
      update: {},
      create: {
        name: 'Técnico',
        description: 'Técnico operativo'
      }
    });
    console.log(`✅ Rol creado: ${tecnicoRole.name}`);

    // 3. Crear permisos básicos
    console.log('\n🔑 Creando permisos...');
    const permissions = [
      { action: 'create', resource: 'progress-report' },
      { action: 'read', resource: 'progress-report' },
      { action: 'update', resource: 'progress-report' },
      { action: 'delete', resource: 'progress-report' },
      { action: 'approve', resource: 'progress-report' },
      { action: 'manage', resource: 'all' }
    ];

    for (const perm of permissions) {
      const permission = await prisma.permission.upsert({
        where: { action_resource: { action: perm.action, resource: perm.resource } },
        update: {},
        create: perm
      });
      console.log(`✅ Permiso creado: ${permission.action}:${permission.resource}`);
    }

    // 4. Asignar permisos a roles
    console.log('\n🔗 Asignando permisos a roles...');
    
    // Admin tiene todos los permisos
    const adminPermissions = await prisma.permission.findMany();
    for (const permission of adminPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: permission.id }
      });
    }
    console.log(`✅ Permisos asignados al Administrador`);

    // Director puede aprobar reportes
    const approvePermission = await prisma.permission.findFirst({
      where: { action: 'approve', resource: 'progress-report' }
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: directorRole.id, permissionId: approvePermission.id } },
      update: {},
      create: { roleId: directorRole.id, permissionId: approvePermission.id }
    });
    console.log(`✅ Permisos de aprobación asignados al Director`);

    // 5. Crear usuarios de prueba
    console.log('\n👤 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@poa.gov' },
      update: {},
      create: {
        email: 'admin@poa.gov',
        firstName: 'Admin',
        lastName: 'Sistema',
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        departmentId: department.id
      }
    });
    console.log(`✅ Usuario admin creado: ${adminUser.email}`);

    const directorUser = await prisma.user.upsert({
      where: { email: 'director@poa.gov' },
      update: {},
      create: {
        email: 'director@poa.gov',
        firstName: 'Director',
        lastName: 'General',
        passwordHash: hashedPassword,
        roleId: directorRole.id,
        departmentId: department.id
      }
    });
    console.log(`✅ Usuario director creado: ${directorUser.email}`);

    const tecnicoUser = await prisma.user.upsert({
      where: { email: 'tecnico@poa.gov' },
      update: {},
      create: {
        email: 'tecnico@poa.gov',
        firstName: 'Técnico',
        lastName: 'Operativo',
        passwordHash: hashedPassword,
        roleId: tecnicoRole.id,
        departmentId: department.id
      }
    });
    console.log(`✅ Usuario técnico creado: ${tecnicoUser.email}`);

    console.log('\n🎉 Estructura básica creada exitosamente!');
    console.log('\n📋 Usuarios creados:');
    console.log('   - admin@poa.gov (password: admin123) - Administrador');
    console.log('   - director@poa.gov (password: admin123) - Director');
    console.log('   - tecnico@poa.gov (password: admin123) - Técnico');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicStructure();
