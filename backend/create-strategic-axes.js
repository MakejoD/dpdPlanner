const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleStrategicAxes() {
  try {
    console.log('🎯 Creando ejes estratégicos de ejemplo...');

    // Obtener algunos departamentos para asignar
    const departments = await prisma.department.findMany({
      take: 4
    });

    if (departments.length === 0) {
      console.log('⚠️ No hay departamentos disponibles. Ejecuta create-departments.js primero.');
      return;
    }

    const currentYear = new Date().getFullYear();

    // Crear ejes estratégicos para el año actual
    const strategicAxes = [
      {
        name: 'Modernización y Digitalización del Estado',
        description: 'Transformar los procesos gubernamentales mediante la implementación de tecnologías digitales para mejorar la eficiencia y transparencia en la gestión pública.',
        code: 'EE-001',
        year: currentYear,
        departmentId: departments[0]?.id, // Tecnología
      },
      {
        name: 'Desarrollo del Talento Humano Institucional',
        description: 'Fortalecer las capacidades del personal institucional a través de programas de formación, capacitación y desarrollo profesional continuo.',
        code: 'EE-002',
        year: currentYear,
        departmentId: departments[1]?.id, // RRHH
      },
      {
        name: 'Gestión Financiera Eficiente y Transparente',
        description: 'Optimizar el uso de los recursos financieros institucionales mediante procesos de planificación, ejecución y control presupuestario efectivos.',
        code: 'EE-003',
        year: currentYear,
        departmentId: departments[2]?.id, // Finanzas
      },
      {
        name: 'Planificación Estratégica e Innovación Institucional',
        description: 'Implementar sistemas de planificación estratégica que promuevan la innovación y mejora continua en los procesos institucionales.',
        code: 'EE-004',
        year: currentYear,
        departmentId: departments[3]?.id, // Planificación
      },
      {
        name: 'Atención Ciudadana de Calidad',
        description: 'Mejorar la calidad de los servicios públicos ofrecidos a la ciudadanía mediante la implementación de estándares de excelencia en la atención.',
        code: 'EE-005',
        year: currentYear,
        departmentId: null, // Transversal - sin departamento específico
      }
    ];

    // Crear también algunos ejes para el año siguiente (planificación futura)
    const nextYearAxes = [
      {
        name: 'Sostenibilidad Ambiental e Institucional',
        description: 'Implementar prácticas sostenibles en la gestión institucional que contribuyan a la preservación del medio ambiente.',
        code: 'EE-001',
        year: currentYear + 1,
        departmentId: departments[0]?.id,
      },
      {
        name: 'Transparencia y Rendición de Cuentas',
        description: 'Fortalecer los mecanismos de transparencia y rendición de cuentas hacia la ciudadanía y organismos de control.',
        code: 'EE-002',
        year: currentYear + 1,
        departmentId: null,
      }
    ];

    const allAxes = [...strategicAxes, ...nextYearAxes];

    // Crear los ejes estratégicos
    for (const axisData of allAxes) {
      try {
        const axis = await prisma.strategicAxis.create({
          data: axisData,
          include: {
            department: {
              select: { name: true, code: true }
            }
          }
        });

        console.log(`✅ Creado: ${axis.code} - ${axis.name} (${axis.year})`);
        if (axis.department) {
          console.log(`   📁 Departamento: ${axis.department.name}`);
        }
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Ya existe: ${axisData.code} para el año ${axisData.year}`);
        } else {
          console.error(`❌ Error creando ${axisData.code}:`, error.message);
        }
      }
    }

    // Verificar la creación
    const totalAxes = await prisma.strategicAxis.count();
    console.log(`\n📊 Total de ejes estratégicos en BD: ${totalAxes}`);

    // Mostrar resumen por año
    const axesByYear = await prisma.strategicAxis.groupBy({
      by: ['year'],
      _count: { year: true },
      orderBy: { year: 'desc' }
    });

    console.log('\n📈 Resumen por año:');
    axesByYear.forEach(item => {
      console.log(`  ${item.year}: ${item._count.year} ejes estratégicos`);
    });

    // Mostrar estructura creada
    const createdAxes = await prisma.strategicAxis.findMany({
      include: {
        department: {
          select: { name: true, code: true }
        },
        _count: {
          select: { objectives: true, indicators: true }
        }
      },
      orderBy: [
        { year: 'desc' },
        { code: 'asc' }
      ]
    });

    console.log('\n🏗️ Estructura de ejes estratégicos:');
    let currentYearGroup = null;
    createdAxes.forEach(axis => {
      if (currentYearGroup !== axis.year) {
        currentYearGroup = axis.year;
        console.log(`\n📅 AÑO ${axis.year}:`);
      }
      console.log(`  🎯 ${axis.code} - ${axis.name}`);
      console.log(`     📝 ${axis.description}`);
      if (axis.department) {
        console.log(`     🏢 Departamento: ${axis.department.name}`);
      }
      console.log(`     📊 Objetivos: ${axis._count.objectives} | Indicadores: ${axis._count.indicators}`);
      console.log(`     🔒 Estado: ${axis.isActive ? 'Activo' : 'Inactivo'} ${axis.isLocked ? '(Bloqueado)' : ''}`);
    });

    console.log('\n🎉 ¡Ejes estratégicos de ejemplo creados exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Crear objetivos para estos ejes estratégicos');
    console.log('   2. Definir productos/servicios para cada objetivo');
    console.log('   3. Establecer actividades específicas');
    console.log('   4. Configurar indicadores de desempeño');

  } catch (error) {
    console.error('❌ Error creando ejes estratégicos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  createSampleStrategicAxes();
}

module.exports = { createSampleStrategicAxes };
