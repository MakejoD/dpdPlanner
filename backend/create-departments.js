const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleDepartments() {
  try {
    console.log('🏢 Creando departamentos de ejemplo...');

    // Crear departamentos padre
    const deptPlanificacion = await prisma.department.create({
      data: {
        name: 'Dirección de Planificación y Desarrollo',
        description: 'Departamento encargado de la planificación estratégica institucional',
        code: 'DPD',
        isActive: true
      }
    });

    const deptRRHH = await prisma.department.create({
      data: {
        name: 'Dirección de Recursos Humanos',
        description: 'Departamento de gestión del talento humano',
        code: 'RRHH',
        isActive: true
      }
    });

    const deptFinanzas = await prisma.department.create({
      data: {
        name: 'Dirección Financiera',
        description: 'Departamento de administración financiera y presupuestaria',
        code: 'FIN',
        isActive: true
      }
    });

    const deptTecnologia = await prisma.department.create({
      data: {
        name: 'Dirección de Tecnología',
        description: 'Departamento de sistemas y tecnologías de información',
        code: 'TIC',
        isActive: true
      }
    });

    console.log('✅ Departamentos padre creados');

    // Crear subdepartamentos de Planificación
    await prisma.department.create({
      data: {
        name: 'Unidad de Planificación Estratégica',
        description: 'Unidad especializada en planificación de largo plazo',
        code: 'UPE',
        parentId: deptPlanificacion.id,
        isActive: true
      }
    });

    await prisma.department.create({
      data: {
        name: 'Unidad de Seguimiento y Evaluación',
        description: 'Unidad de monitoreo y evaluación de proyectos',
        code: 'USE',
        parentId: deptPlanificacion.id,
        isActive: true
      }
    });

    // Crear subdepartamentos de RRHH
    await prisma.department.create({
      data: {
        name: 'Unidad de Selección y Reclutamiento',
        description: 'Unidad de captación de talento',
        code: 'USR',
        parentId: deptRRHH.id,
        isActive: true
      }
    });

    await prisma.department.create({
      data: {
        name: 'Unidad de Capacitación y Desarrollo',
        description: 'Unidad de formación y desarrollo profesional',
        code: 'UCD',
        parentId: deptRRHH.id,
        isActive: true
      }
    });

    // Crear subdepartamentos de Finanzas
    await prisma.department.create({
      data: {
        name: 'Unidad de Presupuesto',
        description: 'Unidad de gestión presupuestaria',
        code: 'UP',
        parentId: deptFinanzas.id,
        isActive: true
      }
    });

    await prisma.department.create({
      data: {
        name: 'Unidad de Contabilidad',
        description: 'Unidad de registro contable y financiero',
        code: 'UC',
        parentId: deptFinanzas.id,
        isActive: true
      }
    });

    // Crear subdepartamentos de Tecnología
    await prisma.department.create({
      data: {
        name: 'Unidad de Desarrollo de Software',
        description: 'Unidad de desarrollo de aplicaciones',
        code: 'UDS',
        parentId: deptTecnologia.id,
        isActive: true
      }
    });

    await prisma.department.create({
      data: {
        name: 'Unidad de Infraestructura TIC',
        description: 'Unidad de soporte técnico e infraestructura',
        code: 'UIT',
        parentId: deptTecnologia.id,
        isActive: true
      }
    });

    console.log('✅ Subdepartamentos creados');

    // Verificar la creación
    const totalDepartments = await prisma.department.count();
    console.log(`📊 Total de departamentos creados: ${totalDepartments}`);

    // Mostrar estructura jerárquica
    const departments = await prisma.department.findMany({
      include: {
        parent: {
          select: { name: true }
        },
        children: {
          select: { name: true, code: true }
        }
      },
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log('\n🏗️ Estructura organizacional:');
    departments.forEach(dept => {
      if (!dept.parent) {
        console.log(`📁 ${dept.name} (${dept.code})`);
        dept.children.forEach(child => {
          console.log(`  └── ${child.name} (${child.code})`);
        });
      }
    });

    console.log('\n🎉 ¡Departamentos de ejemplo creados exitosamente!');
  } catch (error) {
    console.error('❌ Error creando departamentos:', error);
    if (error.code === 'P2002') {
      console.log('ℹ️ Algunos departamentos ya existen, continuando...');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  createSampleDepartments();
}

module.exports = { createSampleDepartments };
