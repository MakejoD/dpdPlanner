const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createObjectives() {
  try {
    console.log('🎯 Creando objetivos de ejemplo...');

    // Obtener los ejes estratégicos existentes
    const strategicAxes = await prisma.strategicAxis.findMany({
      where: { year: 2025 },
      orderBy: { code: 'asc' }
    });

    if (strategicAxes.length === 0) {
      console.log('❌ No se encontraron ejes estratégicos para 2025');
      return;
    }

    // Obtener algunos departamentos
    const departments = await prisma.department.findMany({
      take: 5
    });

    const objectivesData = [
      // Objetivos para EE-001: Modernización y Digitalización del Estado
      {
        strategicAxisCode: 'EE-001',
        objectives: [
          {
            name: 'Implementar plataforma digital integrada de servicios ciudadanos',
            description: 'Desarrollar y poner en funcionamiento una plataforma única que integre todos los servicios digitales ofrecidos a los ciudadanos',
            code: 'OBJ-001-01'
          },
          {
            name: 'Digitalizar el 90% de los procesos administrativos internos',
            description: 'Transformar los procesos manuales en procesos digitales para mejorar la eficiencia operativa',
            code: 'OBJ-001-02'
          },
          {
            name: 'Establecer sistema de interoperabilidad entre instituciones',
            description: 'Crear mecanismos técnicos para el intercambio seguro de información entre diferentes entidades públicas',
            code: 'OBJ-001-03'
          }
        ]
      },
      // Objetivos para EE-002: Desarrollo del Talento Humano Institucional
      {
        strategicAxisCode: 'EE-002',
        objectives: [
          {
            name: 'Capacitar al 100% del personal en competencias digitales',
            description: 'Implementar programa integral de capacitación en herramientas digitales y tecnológicas para todo el personal',
            code: 'OBJ-002-01'
          },
          {
            name: 'Desarrollar programa de liderazgo para mandos medios',
            description: 'Fortalecer las capacidades de liderazgo y gestión de los supervisores y coordinadores',
            code: 'OBJ-002-02'
          },
          {
            name: 'Implementar sistema de gestión del conocimiento institucional',
            description: 'Crear mecanismos para capturar, almacenar y compartir el conocimiento organizacional',
            code: 'OBJ-002-03'
          }
        ]
      },
      // Objetivos para EE-003: Gestión Financiera Eficiente y Transparente
      {
        strategicAxisCode: 'EE-003',
        objectives: [
          {
            name: 'Alcanzar 95% de ejecución presupuestaria eficiente',
            description: 'Optimizar la planificación y ejecución del presupuesto institucional para maximizar el impacto de los recursos',
            code: 'OBJ-003-01'
          },
          {
            name: 'Implementar sistema de monitoreo financiero en tiempo real',
            description: 'Establecer herramientas de seguimiento continuo del estado financiero y presupuestario',
            code: 'OBJ-003-02'
          },
          {
            name: 'Reducir en 50% los tiempos de procesos de adquisiciones',
            description: 'Agilizar y optimizar los procedimientos de compras y contrataciones públicas',
            code: 'OBJ-003-03'
          }
        ]
      },
      // Objetivos para EE-004: Planificación Estratégica e Innovación Institucional
      {
        strategicAxisCode: 'EE-004',
        objectives: [
          {
            name: 'Fortalecer sistema de planificación estratégica institucional',
            description: 'Mejorar los procesos de planificación, seguimiento y evaluación estratégica de la institución',
            code: 'OBJ-004-01'
          },
          {
            name: 'Implementar laboratorio de innovación pública',
            description: 'Crear espacio dedicado a la experimentación y desarrollo de soluciones innovadoras',
            code: 'OBJ-004-02'
          },
          {
            name: 'Establecer alianzas estratégicas con sector privado y academia',
            description: 'Desarrollar partnerships para impulsar la innovación y mejora de servicios públicos',
            code: 'OBJ-004-03'
          }
        ]
      },
      // Objetivos para EE-005: Atención Ciudadana de Calidad
      {
        strategicAxisCode: 'EE-005',
        objectives: [
          {
            name: 'Alcanzar 90% de satisfacción ciudadana en servicios',
            description: 'Mejorar la calidad y experiencia de los servicios brindados a los ciudadanos',
            code: 'OBJ-005-01'
          },
          {
            name: 'Reducir tiempos de respuesta en un 60%',
            description: 'Optimizar los procesos de atención para brindar respuestas más rápidas y eficientes',
            code: 'OBJ-005-02'
          },
          {
            name: 'Implementar sistema de gestión de quejas y sugerencias',
            description: 'Establecer mecanismos efectivos para recibir, procesar y responder a la retroalimentación ciudadana',
            code: 'OBJ-005-03'
          }
        ]
      }
    ];

    let totalCreated = 0;

    for (const axisData of objectivesData) {
      // Encontrar el eje estratégico correspondiente
      const strategicAxis = strategicAxes.find(axis => axis.code === axisData.strategicAxisCode);
      
      if (!strategicAxis) {
        console.log(`⚠️ No se encontró el eje estratégico ${axisData.strategicAxisCode}`);
        continue;
      }

      console.log(`\n📋 Creando objetivos para ${strategicAxis.name} (${strategicAxis.code}):`);

      for (const objData of axisData.objectives) {
        try {
          // Verificar si ya existe
          const existing = await prisma.objective.findFirst({
            where: {
              code: objData.code,
              strategicAxisId: strategicAxis.id
            }
          });

          if (existing) {
            console.log(`   ⚠️ Ya existe: ${objData.code}`);
            continue;
          }

          // No necesitamos asignar departamento ya que se hereda del eje estratégico

          const objective = await prisma.objective.create({
            data: {
              name: objData.name,
              description: objData.description,
              code: objData.code,
              strategicAxisId: strategicAxis.id,
              isActive: true
            }
          });

          console.log(`   ✅ Creado: ${objective.code} - ${objective.name}`);
          totalCreated++;

        } catch (error) {
          console.log(`   ❌ Error creando ${objData.code}: ${error.message}`);
        }
      }
    }

    console.log(`\n🎉 ¡Proceso completado! Se crearon ${totalCreated} objetivos.`);

    // Mostrar resumen
    const summary = await prisma.objective.groupBy({
      by: ['strategicAxisId'],
      _count: {
        id: true
      }
    });

    console.log('\n📊 Resumen por eje estratégico:');
    for (const item of summary) {
      const axis = strategicAxes.find(a => a.id === item.strategicAxisId);
      if (axis) {
        console.log(`   ${axis.code}: ${item._count.id} objetivos`);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createObjectives();
