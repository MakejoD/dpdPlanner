const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupQuickLoginUsers() {
  try {
    console.log('🔧 Configurando usuarios para login rápido...\n');

    // 1. Asegurar que admin tenga la contraseña correcta
    const adminHash = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
      where: { email: 'admin@poa.gov' },
      data: { passwordHash: adminHash }
    });
    console.log('✅ Admin actualizado: admin@poa.gov / admin123');

    // 2. Actualizar Juan Pérez con contraseña específica
    const juanHash = await bcrypt.hash('123456', 10);
    await prisma.user.update({
      where: { email: 'juan.perez@poa.gov' },
      data: { passwordHash: juanHash }
    });
    console.log('✅ Juan actualizado: juan.perez@poa.gov / 123456');

    // 3. Buscar o crear un Director de Planificación
    let director = await prisma.user.findFirst({
      where: {
        role: {
          name: 'Director de Planificación'
        }
      },
      include: { role: true, department: true }
    });

    if (!director) {
      // Buscar el rol de Director de Planificación
      let directorRole = await prisma.role.findFirst({
        where: { name: 'Director de Planificación' }
      });

      if (!directorRole) {
        // Crear el rol si no existe
        directorRole = await prisma.role.create({
          data: {
            name: 'Director de Planificación',
            description: 'Director encargado de la planificación estratégica'
          }
        });
        console.log('✅ Rol "Director de Planificación" creado');
      }

      // Buscar departamento de planificación o usar el existente
      let planningDept = await prisma.department.findFirst({
        where: { name: { contains: 'Planificación' } }
      });

      if (!planningDept) {
        planningDept = await prisma.department.findFirst(); // Usar el primer departamento disponible
      }

      // Crear el director
      const directorHash = await bcrypt.hash('planificacion123', 10);
      director = await prisma.user.create({
        data: {
          firstName: 'Carlos',
          lastName: 'Ramírez Vega',
          email: 'planificacion@poa.gov',
          passwordHash: directorHash,
          roleId: directorRole.id,
          departmentId: planningDept.id
        },
        include: { role: true, department: true }
      });
      console.log('✅ Director creado: planificacion@poa.gov / planificacion123');
    } else {
      // Actualizar contraseña del director existente
      const directorHash = await bcrypt.hash('planificacion123', 10);
      await prisma.user.update({
        where: { id: director.id },
        data: { passwordHash: directorHash }
      });
      console.log('✅ Director actualizado: ' + director.email + ' / planificacion123');
    }

    console.log('\n🎯 CREDENCIALES PARA LOGIN RÁPIDO:');
    console.log('1. Administrador: admin@poa.gov / admin123');
    console.log('2. Director de Planificación: planificacion@poa.gov / planificacion123');
    console.log('3. Técnico: juan.perez@poa.gov / 123456');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupQuickLoginUsers();
