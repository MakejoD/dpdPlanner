const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createExampleUsers() {
  console.log('👥 Creando usuarios de ejemplo...');

  try {
    // Obtener roles y departamentos existentes
    const roles = await prisma.role.findMany();
    const departments = await prisma.department.findMany();

    if (roles.length === 0) {
      console.log('❌ No se encontraron roles. Ejecuta primero create-users.js');
      return;
    }

    if (departments.length === 0) {
      console.log('❌ No se encontraron departamentos. Ejecuta primero create-departments.js');
      return;
    }

    // Buscar roles específicos
    const adminRole = roles.find(r => r.name === 'Administrador');
    const directorRole = roles.find(r => r.name === 'Director de Planificación');
    const directorAreaRole = roles.find(r => r.name === 'Director de Área');
    const tecnicoRole = roles.find(r => r.name === 'Técnico Registrador');
    const auditorRole = roles.find(r => r.name === 'Auditor');

    // Buscar departamentos específicos
    const dpdDept = departments.find(d => d.code === 'DPD');
    const finDept = departments.find(d => d.code === 'FIN');
    const ticDept = departments.find(d => d.code === 'TIC');
    const upeDept = departments.find(d => d.code === 'UPE');
    const useDept = departments.find(d => d.code === 'USE');
    const udsDept = departments.find(d => d.code === 'UDS');

    const usersToCreate = [
      // Directores
      {
        firstName: 'María',
        lastName: 'González López',
        email: 'maria.gonzalez@poa.gov',
        password: 'password123',
        roleId: directorRole?.id,
        departmentId: dpdDept?.id,
        isActive: true
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez Silva',
        email: 'carlos.rodriguez@poa.gov',
        password: 'password123',
        roleId: directorAreaRole?.id,
        departmentId: finDept?.id,
        isActive: true
      },
      {
        firstName: 'Ana',
        lastName: 'Martínez Pérez',
        email: 'ana.martinez@poa.gov',
        password: 'password123',
        roleId: directorAreaRole?.id,
        departmentId: ticDept?.id,
        isActive: true
      },

      // Técnicos de Planificación
      {
        firstName: 'Luis',
        lastName: 'Fernández Castro',
        email: 'luis.fernandez@poa.gov',
        password: 'password123',
        roleId: tecnicoRole?.id,
        departmentId: upeDept?.id,
        isActive: true
      },
      {
        firstName: 'Carmen',
        lastName: 'Jiménez Ruiz',
        email: 'carmen.jimenez@poa.gov',
        password: 'password123',
        roleId: tecnicoRole?.id,
        departmentId: useDept?.id,
        isActive: true
      },
      {
        firstName: 'Roberto',
        lastName: 'Morales Vega',
        email: 'roberto.morales@poa.gov',
        password: 'password123',
        roleId: tecnicoRole?.id,
        departmentId: upeDept?.id,
        isActive: true
      },

      // Técnicos especializados
      {
        firstName: 'Diana',
        lastName: 'López Herrera',
        email: 'diana.lopez@poa.gov',
        password: 'password123',
        roleId: tecnicoRole?.id,
        departmentId: udsDept?.id,
        isActive: true
      },
      {
        firstName: 'Miguel',
        lastName: 'Torres Vargas',
        email: 'miguel.torres@poa.gov',
        password: 'password123',
        roleId: tecnicoRole?.id,
        departmentId: ticDept?.id,
        isActive: true
      },
      {
        firstName: 'Patricia',
        lastName: 'Ramírez Soto',
        email: 'patricia.ramirez@poa.gov',
        password: 'password123',
        roleId: tecnicoRole?.id,
        departmentId: finDept?.id,
        isActive: true
      },
      {
        firstName: 'Andrés',
        lastName: 'Gutiérrez Mora',
        email: 'andres.gutierrez@poa.gov',
        password: 'password123',
        roleId: tecnicoRole?.id,
        departmentId: useDept?.id,
        isActive: true
      },

      // Auditor
      {
        firstName: 'Elena',
        lastName: 'Vásquez Cruz',
        email: 'elena.vasquez@poa.gov',
        password: 'password123',
        roleId: auditorRole?.id,
        departmentId: dpdDept?.id,
        isActive: true
      }
    ];

    let created = 0;
    let skipped = 0;

    for (const userData of usersToCreate) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          console.log(`⚠️ Usuario ya existe: ${userData.email}`);
          skipped++;
          continue;
        }

        // Verificar que el rol y departamento existen
        if (!userData.roleId) {
          console.log(`❌ Rol no encontrado para ${userData.email}`);
          continue;
        }

        if (!userData.departmentId) {
          console.log(`❌ Departamento no encontrado para ${userData.email}`);
          continue;
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Crear el usuario
        const user = await prisma.user.create({
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            passwordHash: hashedPassword,
            roleId: userData.roleId,
            departmentId: userData.departmentId,
            isActive: userData.isActive
          },
          include: {
            role: true,
            department: true
          }
        });

        console.log(`✅ Usuario creado: ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   📋 Rol: ${user.role.name}`);
        console.log(`   🏢 Departamento: ${user.department.name}`);
        created++;

      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
      }
    }

    // Resumen
    console.log('\n📊 Resumen de creación de usuarios:');
    console.log(`   ✅ Creados: ${created}`);
    console.log(`   ⚠️ Omitidos: ${skipped}`);
    console.log(`   📝 Total procesados: ${usersToCreate.length}`);

    // Verificar total de usuarios en la base de datos
    const totalUsers = await prisma.user.count();
    console.log(`\n👥 Total de usuarios en la base de datos: ${totalUsers}`);

    // Mostrar usuarios por rol
    const usersByRole = await prisma.user.groupBy({
      by: ['roleId'],
      _count: { id: true }
    });

    console.log('\n📈 Usuarios por rol:');
    for (const group of usersByRole) {
      const role = await prisma.role.findUnique({ where: { id: group.roleId } });
      console.log(`   ${role.name}: ${group._count.id} usuarios`);
    }

    console.log('\n🎉 ¡Usuarios de ejemplo creados exitosamente!');
    console.log('📋 Próximos pasos:');
    console.log('   1. Probar el login con cualquiera de estos usuarios');
    console.log('   2. Asignar usuarios a actividades en el módulo de planificación');
    console.log('   3. Probar la gestión de progreso y seguimiento');

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createExampleUsers();
