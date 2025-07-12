const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleActivities = [
  // Actividades para el Producto PRD-001-01-01 (Política de Desarrollo Empresarial)
  {
    name: "Diagnóstico de ecosistema empresarial",
    description: "Realizar análisis integral del ecosistema empresarial actual para identificar fortalezas, debilidades y oportunidades de mejora",
    code: "ACT-001-01-01",
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-02-28'),
    order: 1,
    isActive: true
  },
  {
    name: "Diseño de propuesta de política",
    description: "Desarrollar propuesta técnica de política de desarrollo empresarial basada en diagnóstico previo",
    code: "ACT-001-01-02",
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-04-15'),
    order: 2,
    isActive: true
  },
  {
    name: "Socialización con stakeholders",
    description: "Presentar y validar propuesta de política con sector empresarial y actores relevantes",
    code: "ACT-001-01-03",
    startDate: new Date('2024-04-16'),
    endDate: new Date('2024-05-30'),
    order: 3,
    isActive: true
  },
  {
    name: "Aprobación y oficialización",
    description: "Tramitar aprobación oficial de la política y preparar documentos de implementación",
    code: "ACT-001-01-04",
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-30'),
    order: 4,
    isActive: true
  },

  // Actividades para el Producto PRD-001-01-02 (Sistema de Indicadores)
  {
    name: "Definición de marco conceptual",
    description: "Establecer marco teórico y metodológico para sistema de indicadores de desarrollo empresarial",
    code: "ACT-001-02-01",
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-02-15'),
    order: 1,
    isActive: true
  },
  {
    name: "Identificación de variables clave",
    description: "Determinar variables e indicadores prioritarios para seguimiento del desarrollo empresarial",
    code: "ACT-001-02-02",
    startDate: new Date('2024-02-16'),
    endDate: new Date('2024-03-31'),
    order: 2,
    isActive: true
  },
  {
    name: "Desarrollo de plataforma tecnológica",
    description: "Implementar sistema informático para captura, procesamiento y visualización de indicadores",
    code: "ACT-001-02-03",
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-30'),
    order: 3,
    isActive: true
  },

  // Actividades para el Servicio SRV-001-02-01 (Asesoría Técnica)
  {
    name: "Desarrollo de metodologías de asesoría",
    description: "Crear protocolos y metodologías estandarizadas para prestación de asesoría técnica empresarial",
    code: "ACT-001-03-01",
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-03-15'),
    order: 1,
    isActive: true
  },
  {
    name: "Capacitación de equipo técnico",
    description: "Formar al equipo de asesores en las nuevas metodologías y herramientas de diagnóstico",
    code: "ACT-001-03-02",
    startDate: new Date('2024-03-16'),
    endDate: new Date('2024-04-30'),
    order: 2,
    isActive: true
  },
  {
    name: "Implementación piloto",
    description: "Ejecutar programa piloto de asesoría con grupo selecto de empresas para validar metodologías",
    code: "ACT-001-03-03",
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-08-31'),
    order: 3,
    isActive: true
  },

  // Actividades para el Producto PRD-002-01-01 (Estrategia de Innovación)
  {
    name: "Mapeo de capacidades de innovación",
    description: "Inventariar y evaluar capacidades actuales de innovación en el sector público y privado",
    code: "ACT-002-01-01",
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-03-31'),
    order: 1,
    isActive: true
  },
  {
    name: "Benchmarking internacional",
    description: "Analizar mejores prácticas internacionales en políticas de innovación y transferencia tecnológica",
    code: "ACT-002-01-02",
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-04-30'),
    order: 2,
    isActive: true
  },
  {
    name: "Formulación de estrategia",
    description: "Desarrollar estrategia integral de innovación con líneas estratégicas y programas específicos",
    code: "ACT-002-01-03",
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-07-31'),
    order: 3,
    isActive: true
  },

  // Actividades para el Servicio SRV-002-01-01 (Consultoría en Innovación)
  {
    name: "Diseño de portafolio de servicios",
    description: "Estructurar oferta de servicios de consultoría en innovación para diferentes tipos de organizaciones",
    code: "ACT-002-02-01",
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-04-15'),
    order: 1,
    isActive: true
  },
  {
    name: "Establecimiento de alianzas estratégicas",
    description: "Generar convenios con universidades y centros de investigación para fortalecer capacidades",
    code: "ACT-002-02-02",
    startDate: new Date('2024-04-16'),
    endDate: new Date('2024-06-30'),
    order: 2,
    isActive: true
  },

  // Actividades para el Producto PRD-003-01-01 (Plan de Modernización)
  {
    name: "Auditoría de procesos actuales",
    description: "Realizar diagnóstico exhaustivo de procesos administrativos y tecnológicos existentes",
    code: "ACT-003-01-01",
    startDate: new Date('2024-01-08'),
    endDate: new Date('2024-02-29'),
    order: 1,
    isActive: true
  },
  {
    name: "Rediseño de procesos críticos",
    description: "Optimizar procesos identificados como críticos aplicando metodologías de mejora continua",
    code: "ACT-003-01-02",
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-05-31'),
    order: 2,
    isActive: true
  },
  {
    name: "Implementación de tecnologías",
    description: "Desplegar soluciones tecnológicas para automatización y digitalización de procesos",
    code: "ACT-003-01-03",
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-09-30'),
    order: 3,
    isActive: true
  },

  // Actividades para el Servicio SRV-003-01-01 (Asistencia Técnica Digital)
  {
    name: "Desarrollo de plataforma de servicios",
    description: "Crear plataforma digital para prestación de servicios de asistencia técnica en línea",
    code: "ACT-003-02-01",
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-05-31'),
    order: 1,
    isActive: true
  },
  {
    name: "Capacitación en herramientas digitales",
    description: "Formar al personal en uso de nuevas herramientas digitales y plataformas tecnológicas",
    code: "ACT-003-02-02",
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-30'),
    order: 2,
    isActive: true
  },

  // Actividades para el Producto PRD-004-01-01 (Protocolo de Seguridad)
  {
    name: "Evaluación de riesgos de seguridad",
    description: "Identificar y analizar riesgos de seguridad física y digital en las instalaciones y sistemas",
    code: "ACT-004-01-01",
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-03-15'),
    order: 1,
    isActive: true
  },
  {
    name: "Diseño de protocolos de seguridad",
    description: "Desarrollar protocolos y procedimientos para gestión integral de seguridad institucional",
    code: "ACT-004-01-02",
    startDate: new Date('2024-03-16'),
    endDate: new Date('2024-05-31'),
    order: 2,
    isActive: true
  },
  {
    name: "Implementación de sistemas de seguridad",
    description: "Instalar y configurar sistemas tecnológicos y procedimientos de seguridad establecidos",
    code: "ACT-004-01-03",
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    order: 3,
    isActive: true
  },

  // Actividades para el Servicio SRV-004-01-01 (Monitoreo de Seguridad)
  {
    name: "Establecimiento de centro de monitoreo",
    description: "Configurar centro de operaciones para monitoreo continuo de sistemas de seguridad",
    code: "ACT-004-02-01",
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-30'),
    order: 1,
    isActive: true
  },
  {
    name: "Entrenamiento de personal de seguridad",
    description: "Capacitar al equipo de seguridad en nuevos protocolos y uso de tecnologías de monitoreo",
    code: "ACT-004-02-02",
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-07-31'),
    order: 2,
    isActive: true
  },

  // Actividades para el Producto PRD-005-01-01 (Manual de Gestión Ambiental)
  {
    name: "Diagnóstico ambiental institucional",
    description: "Evaluar impacto ambiental actual de las operaciones y identificar áreas de mejora",
    code: "ACT-005-01-01",
    startDate: new Date('2024-01-22'),
    endDate: new Date('2024-03-31'),
    order: 1,
    isActive: true
  },
  {
    name: "Elaboración de manual técnico",
    description: "Desarrollar manual detallado con procedimientos y buenas prácticas de gestión ambiental",
    code: "ACT-005-01-02",
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-06-30'),
    order: 2,
    isActive: true
  },
  {
    name: "Validación y aprobación",
    description: "Revisar, validar y obtener aprobación oficial del manual de gestión ambiental",
    code: "ACT-005-01-03",
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-08-31'),
    order: 3,
    isActive: true
  },

  // Actividades para el Servicio SRV-005-01-01 (Consultoría Ambiental)
  {
    name: "Desarrollo de metodologías de consultoría",
    description: "Crear herramientas y metodologías para prestación de servicios de consultoría ambiental",
    code: "ACT-005-02-01",
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-05-31'),
    order: 1,
    isActive: true
  },
  {
    name: "Certificación de consultores",
    description: "Capacitar y certificar al equipo técnico en metodologías de consultoría ambiental",
    code: "ACT-005-02-02",
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-07-31'),
    order: 2,
    isActive: true
  }
];

async function createActivities() {
  try {
    console.log('🚀 Iniciando creación de actividades...');

    // Primero obtenemos todos los productos para mapear los códigos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        code: true
      }
    });

    console.log(`📦 Encontrados ${products.length} productos`);

    // Crear un mapa de código de producto a ID
    const productMap = {};
    products.forEach(product => {
      productMap[product.code] = product.id;
    });

    let createdCount = 0;
    let errorCount = 0;

    for (const activityData of sampleActivities) {
      try {
        // Determinar el productId basado en el código de la actividad
        // El código de actividad tiene formato ACT-XXX-XX-XX
        // El código de producto tiene formato PRD-XXX-XX-XX o SRV-XXX-XX-XX
        const activityParts = activityData.code.split('-');
        const axisCode = activityParts[1];
        const objectiveCode = activityParts[2];
        const productOrder = activityParts[3];

        // Buscar productos que coincidan con el patrón
        let productCode = null;
        for (const [code, id] of Object.entries(productMap)) {
          const parts = code.split('-');
          if (parts[1] === axisCode && parts[2] === objectiveCode) {
            // Si encontramos un producto con el mismo eje y objetivo, lo usamos
            productCode = code;
            break;
          }
        }

        if (!productCode) {
          console.log(`⚠️  No se encontró producto para actividad ${activityData.code}`);
          errorCount++;
          continue;
        }

        const productId = productMap[productCode];

        // Verificar si la actividad ya existe
        const existingActivity = await prisma.activity.findFirst({
          where: {
            productId,
            code: activityData.code
          }
        });

        if (existingActivity) {
          console.log(`⏭️  Actividad ${activityData.code} ya existe`);
          continue;
        }

        const activity = await prisma.activity.create({
          data: {
            ...activityData,
            productId
          }
        });

        console.log(`✅ Actividad creada: ${activity.code} - ${activity.name}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creando actividad ${activityData.code}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Resumen de creación de actividades:`);
    console.log(`   ✅ Creadas: ${createdCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total procesadas: ${sampleActivities.length}`);

    // Obtener estadísticas finales
    const totalActivities = await prisma.activity.count();
    const activitiesByProduct = await prisma.activity.groupBy({
      by: ['productId'],
      _count: {
        id: true
      }
    });

    console.log(`\n📈 Total de actividades en la base de datos: ${totalActivities}`);
    console.log(`📊 Actividades por producto: ${activitiesByProduct.length} productos con actividades`);

  } catch (error) {
    console.error('❌ Error general en creación de actividades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createActivities();
}

module.exports = { createActivities, sampleActivities };
