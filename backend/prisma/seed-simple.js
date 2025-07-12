const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  try {
    // 1. Crear permisos básicos
    console.log('📋 Creando permisos básicos...');
    
    const basicPermissions = [
      { action: 'create', resource: 'user' },
      { action: 'read', resource: 'user' },
      { action: 'update', resource: 'user' },
      { action: 'delete', resource: 'user' },
      { action: 'read', resource: 'dashboard' }
    ];

    for (const permission of basicPermissions) {
      await prisma.permission.upsert({
        where: {
          action_resource: {
            action: permission.action,
            resource: permission.resource
          }
        },
        update: {},
        create: permission
      });
    }

    // 2. Crear rol administrador
    console.log('👥 Creando rol administrador...');
    
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrador' },
      update: {},
      create: {
        name: 'Administrador',
        description: 'Acceso completo al sistema'
      }
    });

    // 3. Asignar permisos al administrador
    console.log('🔐 Asignando permisos al administrador...');
    
    const allPermissions = await prisma.permission.findMany();
    
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }

    // 4. Crear departamento principal
    console.log('🏢 Creando departamento principal...');
    
    const mainDepartment = await prisma.department.upsert({
      where: { name: 'Administración Central' },
      update: {},
      create: {
        name: 'Administración Central',
        description: 'Departamento principal de administración',
        code: 'ADM-CENTRAL'
      }
    });

    // 5. Crear usuario administrador por defecto
    console.log('👤 Creando usuario administrador...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@poa.gov' },
      update: {},
      create: {
        email: 'admin@poa.gov',
        firstName: 'Administrador',
        lastName: 'Sistema',
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        departmentId: mainDepartment.id
      }
    });

    console.log('✅ Seed completado exitosamente!');
    console.log('📧 Usuario: admin@poa.gov');
    console.log('🔑 Contraseña: admin123');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
