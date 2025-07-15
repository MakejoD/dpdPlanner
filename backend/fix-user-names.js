const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserNames() {
  try {
    console.log('=== CORRIGIENDO NOMBRES DE USUARIOS ===\n');
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany();
    
    const userUpdates = [
      { email: 'admin@poa.gov', firstName: 'Juan', lastName: 'Administrador' },
      { email: 'director@poa.gov', firstName: 'María', lastName: 'Directora' },
      { email: 'planificacion@poa.gov', firstName: 'Carlos', lastName: 'Planificador' },
      { email: 'compras@poa.gov', firstName: 'Ana', lastName: 'Compradora' },
      { email: 'presupuesto@poa.gov', firstName: 'Luis', lastName: 'Presupuestario' },
      { email: 'seguimiento@poa.gov', firstName: 'Patricia', lastName: 'Seguimiento' }
    ];
    
    for (const update of userUpdates) {
      const user = users.find(u => u.email === update.email);
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: update.firstName,
            lastName: update.lastName
          }
        });
        console.log(`✅ Usuario actualizado: ${update.firstName} ${update.lastName} (${update.email})`);
      } else {
        console.log(`❌ Usuario no encontrado: ${update.email}`);
      }
    }
    
    console.log('\n🔍 Verificando usuarios actualizados...');
    
    const updatedUsers = await prisma.user.findMany({
      include: {
        role: true,
        department: true
      }
    });
    
    updatedUsers.forEach(user => {
      console.log(`👤 ${user.firstName} ${user.lastName} (${user.email}) - ${user.role.name}`);
    });
    
    console.log('\n✅ Nombres de usuarios corregidos!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserNames();
