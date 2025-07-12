const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdditionalUsers() {
  console.log('👥 Creando usuarios adicionales...\n');

  try {
    // Obtener roles
    const roles = await prisma.role.findMany();
    const adminRole = roles.find(r => r.name === 'Administrador');
    const dirPlanRole = roles.find(r => r.name === 'Director de Planificación');
    const dirAreaRole = roles.find(r => r.name === 'Director de Área');
    const tecnicoRole = roles.find(r => r.name === 'Técnico Registrador');
    const auditorRole = roles.find(r => r.name === 'Auditor');

    // Obtener departamento
    const department = await prisma.department.findFirst();

    const hashedPassword = await bcrypt.hash('123456', 10);

    // Crear Director de Planificación
    const dirPlan = await prisma.user.upsert({
      where: { email: 'planificacion@poa.gov' },
      update: {},
      create: {
        email: 'planificacion@poa.gov',
        firstName: 'María',
        lastName: 'Planificación',
        passwordHash: hashedPassword,
        roleId: dirPlanRole.id,
        departmentId: department.id
      }
    });

    // Crear Director de Área
    const dirArea = await prisma.user.upsert({
      where: { email: 'director@poa.gov' },
      update: {},
      create: {
        email: 'director@poa.gov',
        firstName: 'Carlos',
        lastName: 'Directorio',
        passwordHash: hashedPassword,
        roleId: dirAreaRole.id,
        departmentId: department.id
      }
    });

    // Crear Técnico
    const tecnico = await prisma.user.upsert({
      where: { email: 'tecnico@poa.gov' },
      update: {},
      create: {
        email: 'tecnico@poa.gov',
        firstName: 'Ana',
        lastName: 'Técnica',
        passwordHash: hashedPassword,
        roleId: tecnicoRole.id,
        departmentId: department.id
      }
    });

    console.log('✅ Usuarios creados exitosamente:');
    console.log('📧 planificacion@poa.gov - Contraseña: 123456');
    console.log('📧 director@poa.gov - Contraseña: 123456');
    console.log('📧 tecnico@poa.gov - Contraseña: 123456');
    console.log('📧 admin@poa.gov - Contraseña: admin123 (ya existía)');

  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdditionalUsers();
