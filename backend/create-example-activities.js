const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createExampleActivities() {
  try {
    console.log('🎯 Creando actividades de ejemplo...');

    // Obtener productos existentes
    const products = await prisma.product.findMany({
      include: {
        objective: {
          include: {
            strategicAxis: true
          }
        }
      }
    });

    if (products.length === 0) {
      console.log('❌ No hay productos disponibles');
      return;
    }

    // Crear actividades de ejemplo para diferentes productos
    const exampleActivities = [
      // Portal único de trámites ciudadanos
      {
        name: 'Análisis de Requerimientos del Portal',
        description: 'Realizar análisis detallado de los requerimientos funcionales y no funcionales para el portal único de trámites ciudadanos',
        code: 'ACT-PORTAL-001',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        productCode: 'PROD-001-01-01'
      },
      {
        name: 'Diseño de Arquitectura del Sistema',
        description: 'Diseñar la arquitectura técnica del portal, incluyendo base de datos, APIs y componentes de seguridad',
        code: 'ACT-PORTAL-002',
        startDate: new Date('2024-02-16'),
        endDate: new Date('2024-03-30'),
        productCode: 'PROD-001-01-01'
      },
      {
        name: 'Desarrollo del Frontend del Portal',
        description: 'Implementar la interfaz de usuario del portal con tecnologías web modernas y diseño responsive',
        code: 'ACT-PORTAL-003',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        productCode: 'PROD-001-01-01'
      },
      {
        name: 'Desarrollo de APIs del Backend',
        description: 'Crear las APIs REST para la gestión de trámites, usuarios y notificaciones del portal',
        code: 'ACT-PORTAL-004',
        startDate: new Date('2024-04-15'),
        endDate: new Date('2024-07-15'),
        productCode: 'PROD-001-01-01'
      },
      {
        name: 'Integración con Sistemas Existentes',
        description: 'Integrar el portal con sistemas legacy y bases de datos institucionales existentes',
        code: 'ACT-PORTAL-005',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-08-30'),
        productCode: 'PROD-001-01-01'
      },
      {
        name: 'Pruebas de Seguridad y Penetración',
        description: 'Realizar auditorías de seguridad y pruebas de penetración para garantizar la protección de datos',
        code: 'ACT-PORTAL-006',
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-09-15'),
        productCode: 'PROD-001-01-01'
      },
      
      // Sistema de gestión documental electrónica
      {
        name: 'Análisis de Procesos Documentales',
        description: 'Mapear y analizar los procesos documentales actuales para identificar oportunidades de digitalización',
        code: 'ACT-DOC-001',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-03-01'),
        productCode: 'PROD-001-02-01'
      },
      {
        name: 'Selección de Plataforma ECM',
        description: 'Evaluar y seleccionar la plataforma de gestión de contenido empresarial más adecuada',
        code: 'ACT-DOC-002',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-30'),
        productCode: 'PROD-001-02-01'
      },
      {
        name: 'Configuración del Sistema ECM',
        description: 'Configurar la plataforma ECM según los requerimientos institucionales específicos',
        code: 'ACT-DOC-003',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-05-30'),
        productCode: 'PROD-001-02-01'
      },
      {
        name: 'Migración de Documentos Existentes',
        description: 'Digitalizar y migrar documentos físicos existentes al nuevo sistema de gestión documental',
        code: 'ACT-DOC-004',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        productCode: 'PROD-001-02-01'
      },

      // Plataforma de aprendizaje virtual (LMS)
      {
        name: 'Definición de Contenidos Educativos',
        description: 'Definir el currículo y contenidos educativos para la capacitación en competencias digitales',
        code: 'ACT-LMS-001',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-15'),
        productCode: 'PROD-002-01-01'
      },
      {
        name: 'Configuración de la Plataforma LMS',
        description: 'Instalar y configurar la plataforma de aprendizaje virtual con las funcionalidades requeridas',
        code: 'ACT-LMS-002',
        startDate: new Date('2024-02-16'),
        endDate: new Date('2024-04-15'),
        productCode: 'PROD-002-01-01'
      },
      {
        name: 'Creación de Contenido Multimedia',
        description: 'Desarrollar videos, presentaciones y material interactivo para los cursos virtuales',
        code: 'ACT-LMS-003',
        startDate: new Date('2024-04-16'),
        endDate: new Date('2024-07-31'),
        productCode: 'PROD-002-01-01'
      },
      {
        name: 'Piloto de Capacitación Virtual',
        description: 'Ejecutar programa piloto de capacitación con un grupo reducido de funcionarios',
        code: 'ACT-LMS-004',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-09-30'),
        productCode: 'PROD-002-01-01'
      },

      // Sistema de planificación presupuestaria
      {
        name: 'Análisis de Procesos Presupuestarios',
        description: 'Analizar los procesos actuales de planificación y ejecución presupuestaria',
        code: 'ACT-PRESUP-001',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-04-15'),
        productCode: 'PROD-003-01-01'
      },
      {
        name: 'Desarrollo del Módulo de Planificación',
        description: 'Desarrollar el módulo de planificación presupuestaria con workflows automatizados',
        code: 'ACT-PRESUP-002',
        startDate: new Date('2024-04-16'),
        endDate: new Date('2024-07-31'),
        productCode: 'PROD-003-01-01'
      },
      {
        name: 'Integración con Sistema Contable',
        description: 'Integrar el sistema de planificación con el sistema contable institucional',
        code: 'ACT-PRESUP-003',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-09-30'),
        productCode: 'PROD-003-01-01'
      },

      // Sistema POA digital integrado
      {
        name: 'Análisis de Metodología POA Actual',
        description: 'Analizar la metodología actual de planificación operativa anual para su digitalización',
        code: 'ACT-POA-001',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-29'),
        productCode: 'PROD-004-01-01'
      },
      {
        name: 'Diseño del Sistema POA Digital',
        description: 'Diseñar la arquitectura y funcionalidades del sistema POA digital integrado',
        code: 'ACT-POA-002',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-04-30'),
        productCode: 'PROD-004-01-01'
      },
      {
        name: 'Desarrollo del Módulo de Planificación',
        description: 'Desarrollar el módulo de planificación con objetivos, productos y actividades',
        code: 'ACT-POA-003',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-07-31'),
        productCode: 'PROD-004-01-01'
      },
      {
        name: 'Desarrollo del Módulo de Seguimiento',
        description: 'Desarrollar el módulo de seguimiento y evaluación del POA con indicadores automatizados',
        code: 'ACT-POA-004',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-10-31'),
        productCode: 'PROD-004-01-01'
      }
    ];

    let createdCount = 0;

    for (const activityData of exampleActivities) {
      // Buscar el producto por código
      const product = products.find(p => p.code === activityData.productCode);
      
      if (!product) {
        console.log(`⚠️  Producto no encontrado: ${activityData.productCode}`);
        continue;
      }

      // Verificar si la actividad ya existe
      const existingActivity = await prisma.activity.findFirst({
        where: { code: activityData.code }
      });

      if (existingActivity) {
        console.log(`⚠️  Actividad ya existe: ${activityData.code}`);
        continue;
      }

      // Crear la actividad
      const activity = await prisma.activity.create({
        data: {
          name: activityData.name,
          description: activityData.description,
          code: activityData.code,
          startDate: activityData.startDate,
          endDate: activityData.endDate,
          productId: product.id,
          order: createdCount + 1
        }
      });

      console.log(`✅ Actividad creada: ${activity.name} (${activity.code})`);
      createdCount++;
    }

    console.log(`\n🎉 ¡Actividades de ejemplo creadas exitosamente!`);
    console.log(`📊 Total creadas: ${createdCount} actividades`);
    console.log(`📦 Distribuidas en ${new Set(exampleActivities.map(a => a.productCode)).size} productos diferentes`);
    
  } catch (error) {
    console.error('❌ Error creando actividades de ejemplo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createExampleActivities();
