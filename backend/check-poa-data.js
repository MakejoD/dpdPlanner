const { PrismaClient } = require('@prisma/client');

async function checkPOAData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando datos del POA...\n');
    
    // Verificar datos existentes
    const strategicAxes = await prisma.strategicAxis.findMany({
      include: {
        department: true,
        objectives: {
          include: {
            products: {
              include: {
                activities: {
                  include: {
                    indicators: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    const totals = {
      axes: strategicAxes.length,
      objectives: strategicAxes.reduce((sum, axis) => sum + axis.objectives.length, 0),
      products: strategicAxes.reduce((sum, axis) => 
        sum + axis.objectives.reduce((objSum, obj) => objSum + obj.products.length, 0), 0),
      activities: strategicAxes.reduce((sum, axis) => 
        sum + axis.objectives.reduce((objSum, obj) => 
          objSum + obj.products.reduce((prodSum, prod) => prodSum + prod.activities.length, 0), 0), 0),
      indicators: strategicAxes.reduce((sum, axis) => 
        sum + axis.objectives.reduce((objSum, obj) => 
          objSum + obj.products.reduce((prodSum, prod) => 
            prodSum + prod.activities.reduce((actSum, act) => actSum + act.indicators.length, 0), 0), 0), 0)
    };
    
    console.log('📊 DATOS POA ACTUALES:');
    console.log('├── Ejes Estratégicos:', totals.axes);
    console.log('├── Objetivos:', totals.objectives);
    console.log('├── Productos:', totals.products);
    console.log('├── Actividades:', totals.activities);
    console.log('└── Indicadores:', totals.indicators);
    console.log('');
    
    if (strategicAxes.length > 0) {
      console.log('📋 ESTRUCTURA DETALLADA:');
      strategicAxes.forEach((axis, index) => {
        console.log(`${index + 1}. ${axis.name} (${axis.code})`);
        console.log(`   Departamento: ${axis.department?.name || 'Sin asignar'}`);
        console.log(`   Objetivos: ${axis.objectives.length}`);
        console.log(`   Estado: ${axis.isActive ? 'Activo' : 'Inactivo'}`);
        console.log('');
      });
      
      console.log('✅ DATOS ENCONTRADOS - La página POA debería mostrar información');
    } else {
      console.log('❌ NO HAY DATOS - Creando datos de ejemplo...');
      await createSampleData(prisma);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar datos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSampleData(prisma) {
  try {
    console.log('🔧 Creando datos de ejemplo del POA...');
    
    // Crear departamentos si no existen
    const departments = await prisma.department.findMany();
    if (departments.length === 0) {
      await prisma.department.createMany({
        data: [
          { name: 'Dirección de Planificación', code: 'PLAN', isActive: true },
          { name: 'Dirección Administrativa', code: 'ADMIN', isActive: true },
          { name: 'Dirección Financiera', code: 'FIN', isActive: true },
          { name: 'Dirección Técnica', code: 'TEC', isActive: true },
          { name: 'Dirección de Compras', code: 'COMP', isActive: true }
        ]
      });
    }
    
    const planDept = await prisma.department.findFirst({ where: { code: 'PLAN' } });
    const adminDept = await prisma.department.findFirst({ where: { code: 'ADMIN' } });
    const finDept = await prisma.department.findFirst({ where: { code: 'FIN' } });
    
    // Crear ejes estratégicos
    const axisData = [
      {
        name: 'Modernización Institucional',
        description: 'Fortalecer la capacidad institucional mediante la modernización de procesos',
        code: 'EJE-001-2025',
        year: 2025,
        departmentId: planDept?.id,
        isActive: true
      },
      {
        name: 'Desarrollo del Talento Humano',
        description: 'Mejorar las competencias del personal institucional',
        code: 'EJE-002-2025',
        year: 2025,
        departmentId: adminDept?.id,
        isActive: true
      },
      {
        name: 'Gestión Financiera Eficiente',
        description: 'Optimizar el uso de los recursos financieros institucionales',
        code: 'EJE-003-2025',
        year: 2025,
        departmentId: finDept?.id,
        isActive: true
      }
    ];
    
    for (const axisInfo of axisData) {
      const axis = await prisma.strategicAxis.create({
        data: axisInfo
      });
      
      // Crear objetivos para cada eje
      for (let i = 1; i <= 2; i++) {
        const objective = await prisma.objective.create({
          data: {
            name: `Objetivo ${i} del ${axis.name}`,
            description: `Descripción del objetivo ${i} para ${axis.name}`,
            code: `${axis.code}-OBJ-${i.toString().padStart(2, '0')}`,
            strategicAxisId: axis.id,
            isActive: true
          }
        });
        
        // Crear productos para cada objetivo
        for (let j = 1; j <= 2; j++) {
          const product = await prisma.product.create({
            data: {
              name: `Producto ${j} del Objetivo ${i}`,
              description: `Descripción del producto ${j}`,
              code: `${objective.code}-PROD-${j.toString().padStart(2, '0')}`,
              objectiveId: objective.id,
              isActive: true
            }
          });
          
          // Crear actividades para cada producto
          for (let k = 1; k <= 2; k++) {
            const activity = await prisma.activity.create({
              data: {
                name: `Actividad ${k} del Producto ${j}`,
                description: `Descripción de la actividad ${k}`,
                code: `${product.code}-ACT-${k.toString().padStart(2, '0')}`,
                productId: product.id,
                responsibleUserId: null,
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
                budget: 50000.00,
                status: 'PENDING',
                isActive: true
              }
            });
            
            // Crear indicador para cada actividad
            await prisma.indicator.create({
              data: {
                name: `Indicador de ${activity.name}`,
                description: 'Indicador de seguimiento',
                code: `${activity.code}-IND-01`,
                activityId: activity.id,
                type: 'EFFICIENCY',
                unit: 'Porcentaje',
                baseline: 0,
                targetQ1: 25,
                targetQ2: 50,
                targetQ3: 75,
                targetQ4: 100,
                isActive: true
              }
            });
          }
        }
      }
    }
    
    console.log('✅ Datos de ejemplo creados exitosamente');
    console.log('🔄 Re-verificando datos...\n');
    
    // Re-verificar
    await checkPOAData();
    
  } catch (error) {
    console.error('❌ Error creando datos de ejemplo:', error.message);
  }
}

checkPOAData();
