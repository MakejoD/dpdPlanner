const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const productsData = [
  // Productos para Eje Estratégico 1: Modernización y Digitalización del Estado
  {
    objectiveCode: 'OBJ-001-01', // Implementar plataforma digital integrada
    products: [
      {
        code: 'PROD-001-01-01',
        name: 'Portal único de trámites ciudadanos',
        description: 'Plataforma web unificada donde los ciudadanos pueden realizar todos sus trámites en línea de forma integrada.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-001-01-01',
        name: 'Servicio de autenticación digital ciudadana',
        description: 'Sistema de identificación digital único para acceso a todos los servicios gubernamentales.',
        type: 'SERVICE'
      },
      {
        code: 'PROD-001-01-02',
        name: 'Aplicación móvil gubernamental',
        description: 'App móvil para acceso desde dispositivos móviles a los servicios más demandados por los ciudadanos.',
        type: 'PRODUCT'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-001-02', // Digitalizar el 90% de los procesos administrativos
    products: [
      {
        code: 'PROD-001-02-01',
        name: 'Sistema de gestión documental electrónica',
        description: 'Plataforma para digitalización, almacenamiento y gestión de documentos administrativos.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-001-02-01',
        name: 'Servicio de firma electrónica institucional',
        description: 'Infraestructura de firma digital para validación de documentos oficiales.',
        type: 'SERVICE'
      },
      {
        code: 'PROD-001-02-02',
        name: 'Workflow automatizado de procesos',
        description: 'Sistema para automatización de flujos de trabajo y aprobaciones internas.',
        type: 'PRODUCT'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-001-03', // Establecer sistema de interoperabilidad
    products: [
      {
        code: 'PROD-001-03-01',
        name: 'Bus de servicios empresariales (ESB)',
        description: 'Infraestructura de integración para comunicación entre sistemas institucionales.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-001-03-01',
        name: 'APIs de intercambio de datos',
        description: 'Interfaces de programación para intercambio seguro de información entre entidades.',
        type: 'SERVICE'
      }
    ]
  },

  // Productos para Eje Estratégico 2: Desarrollo del Talento Humano
  {
    objectiveCode: 'OBJ-002-01', // Capacitar al 100% del personal
    products: [
      {
        code: 'PROD-002-01-01',
        name: 'Plataforma de aprendizaje virtual (LMS)',
        description: 'Sistema de gestión de aprendizaje para capacitación en línea del personal.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-002-01-01',
        name: 'Programa de certificación digital',
        description: 'Servicio de evaluación y certificación de competencias digitales del personal.',
        type: 'SERVICE'
      },
      {
        code: 'PROD-002-01-02',
        name: 'Contenidos educativos digitales',
        description: 'Biblioteca digital con cursos, tutoriales y material de capacitación tecnológica.',
        type: 'PRODUCT'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-002-02', // Desarrollar programa de liderazgo
    products: [
      {
        code: 'SERV-002-02-01',
        name: 'Programa de mentoría ejecutiva',
        description: 'Servicio de acompañamiento personalizado para desarrollo de líderes institucionales.',
        type: 'SERVICE'
      },
      {
        code: 'PROD-002-02-01',
        name: 'Toolkit de liderazgo digital',
        description: 'Conjunto de herramientas y recursos para el desarrollo de habilidades de liderazgo.',
        type: 'PRODUCT'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-002-03', // Implementar sistema de gestión del conocimiento
    products: [
      {
        code: 'PROD-002-03-01',
        name: 'Base de conocimientos institucional',
        description: 'Repositorio central de conocimientos, procedimientos y mejores prácticas.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-002-03-01',
        name: 'Red de comunidades de práctica',
        description: 'Plataforma para intercambio de conocimientos entre equipos de trabajo.',
        type: 'SERVICE'
      }
    ]
  },

  // Productos para Eje Estratégico 3: Gestión Financiera Eficiente
  {
    objectiveCode: 'OBJ-003-01', // Alcanzar 95% de ejecución presupuestaria
    products: [
      {
        code: 'PROD-003-01-01',
        name: 'Sistema de planificación presupuestaria',
        description: 'Herramienta digital para elaboración y seguimiento detallado del presupuesto institucional.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-003-01-01',
        name: 'Servicio de análisis financiero predictivo',
        description: 'Análisis de tendencias y proyecciones para optimización del gasto público.',
        type: 'SERVICE'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-003-02', // Implementar sistema de monitoreo financiero
    products: [
      {
        code: 'PROD-003-02-01',
        name: 'Dashboard financiero en tiempo real',
        description: 'Panel de control con indicadores financieros y presupuestarios actualizados.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-003-02-01',
        name: 'Alertas automáticas de gestión fiscal',
        description: 'Sistema de notificaciones sobre desviaciones presupuestarias y oportunidades.',
        type: 'SERVICE'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-003-03', // Reducir en 50% los tiempos de adquisiciones
    products: [
      {
        code: 'PROD-003-03-01',
        name: 'Plataforma de compras electrónicas',
        description: 'Sistema digital para gestión completa del ciclo de adquisiciones públicas.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-003-03-01',
        name: 'Servicio de evaluación automatizada de proveedores',
        description: 'Sistema de calificación y selección automatizada de proveedores.',
        type: 'SERVICE'
      }
    ]
  },

  // Productos para Eje Estratégico 4: Planificación Estratégica e Innovación
  {
    objectiveCode: 'OBJ-004-01', // Fortalecer sistema de planificación estratégica
    products: [
      {
        code: 'PROD-004-01-01',
        name: 'Sistema POA digital integrado',
        description: 'Plataforma completa para planificación, seguimiento y evaluación del Plan Operativo Anual.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-004-01-01',
        name: 'Servicio de consultoría en planificación',
        description: 'Acompañamiento especializado para optimización de procesos de planificación.',
        type: 'SERVICE'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-004-02', // Implementar laboratorio de innovación
    products: [
      {
        code: 'PROD-004-02-01',
        name: 'Espacio físico de innovación (Lab)',
        description: 'Laboratorio equipado con tecnología para prototipado y experimentación.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-004-02-01',
        name: 'Programa de innovación abierta',
        description: 'Servicio de gestión de ideas y proyectos innovadores con participación ciudadana.',
        type: 'SERVICE'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-004-03', // Establecer alianzas estratégicas
    products: [
      {
        code: 'SERV-004-03-01',
        name: 'Red de alianzas público-privadas',
        description: 'Plataforma de gestión de convenios y alianzas con sector privado y academia.',
        type: 'SERVICE'
      },
      {
        code: 'PROD-004-03-01',
        name: 'Portal de colaboración interinstitucional',
        description: 'Espacio digital para coordinación de proyectos con socios estratégicos.',
        type: 'PRODUCT'
      }
    ]
  },

  // Productos para Eje Estratégico 5: Atención Ciudadana de Calidad
  {
    objectiveCode: 'OBJ-005-01', // Alcanzar 90% de satisfacción ciudadana
    products: [
      {
        code: 'SERV-005-01-01',
        name: 'Centro de atención multicanal',
        description: 'Servicio integrado de atención presencial, telefónica, chat y redes sociales.',
        type: 'SERVICE'
      },
      {
        code: 'PROD-005-01-01',
        name: 'Sistema de gestión de citas ciudadanas',
        description: 'Plataforma para agendamiento y gestión de citas para atención presencial.',
        type: 'PRODUCT'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-005-02', // Reducir tiempos de respuesta en 60%
    products: [
      {
        code: 'PROD-005-02-01',
        name: 'Sistema de tickets y seguimiento',
        description: 'Herramienta para gestión y seguimiento de solicitudes ciudadanas.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-005-02-01',
        name: 'Chatbot de atención automatizada',
        description: 'Asistente virtual para resolución automática de consultas frecuentes.',
        type: 'SERVICE'
      }
    ]
  },
  {
    objectiveCode: 'OBJ-005-03', // Implementar sistema de quejas y sugerencias
    products: [
      {
        code: 'PROD-005-03-01',
        name: 'Plataforma de retroalimentación ciudadana',
        description: 'Sistema web y móvil para recepción y gestión de quejas, sugerencias y felicitaciones.',
        type: 'PRODUCT'
      },
      {
        code: 'SERV-005-03-01',
        name: 'Servicio de seguimiento de casos',
        description: 'Proceso de seguimiento personalizado para resolución de quejas ciudadanas.',
        type: 'SERVICE'
      }
    ]
  }
];

async function createProducts() {
  console.log('🎁 Iniciando creación de productos y servicios...');

  try {
    // Obtener todos los objetivos con sus códigos
    const objectives = await prisma.objective.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        strategicAxis: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });

    const objectiveMap = {};
    objectives.forEach(obj => {
      objectiveMap[obj.code] = obj;
    });

    let totalCreated = 0;

    for (const objectiveGroup of productsData) {
      const objective = objectiveMap[objectiveGroup.objectiveCode];
      
      if (!objective) {
        console.log(`⚠️  Objetivo ${objectiveGroup.objectiveCode} no encontrado, saltando...`);
        continue;
      }

      console.log(`\n📊 Creando productos para objetivo: ${objective.code} - ${objective.name}`);

      for (const [index, productData] of objectiveGroup.products.entries()) {
        try {
          const product = await prisma.product.create({
            data: {
              name: productData.name,
              description: productData.description,
              code: productData.code,
              type: productData.type,
              objectiveId: objective.id,
              order: index
            }
          });

          console.log(`   ✅ ${productData.type}: ${product.code} - ${product.name}`);
          totalCreated++;
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`   ⚠️  ${productData.code} ya existe, saltando...`);
          } else {
            console.error(`   ❌ Error creando ${productData.code}:`, error.message);
          }
        }
      }
    }

    console.log(`\n🎉 ¡Proceso completado! Se crearon ${totalCreated} productos/servicios`);
    console.log('\n📊 Resumen por tipo:');
    
    const summary = await prisma.product.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    });

    summary.forEach(item => {
      console.log(`   ${item.type}: ${item._count.type} elementos`);
    });

    console.log('\n📈 Distribución por objetivo:');
    const distributionByObjective = await prisma.product.groupBy({
      by: ['objectiveId'],
      _count: {
        objectiveId: true
      }
    });

    for (const dist of distributionByObjective) {
      const objective = await prisma.objective.findUnique({
        where: { id: dist.objectiveId },
        select: { code: true, name: true }
      });
      console.log(`   ${objective.code}: ${dist._count.objectiveId} productos/servicios`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createProducts();
}

module.exports = createProducts;
