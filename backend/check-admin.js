const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Verificando usuario administrador...');
    
    // Buscar usuario admin existente
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@poa.gov' },
      include: { role: true, department: true }
    });

    if (admin) {
      console.log('✅ Usuario admin encontrado:', {
        id: admin.id,
        email: admin.email,
        nombre: admin.firstName + ' ' + admin.lastName,
        rol: admin.role?.name,
        departamento: admin.department?.name
      });
      
      // Verificar la contraseña actual
      const testPassword = 'admin123456';
      const isValidPassword = await bcrypt.compare(testPassword, admin.password);
      console.log('🔐 Contraseña actual válida:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('🔄 Actualizando contraseña...');
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        await prisma.user.update({
          where: { id: admin.id },
          data: { password: hashedPassword }
        });
        console.log('✅ Contraseña actualizada correctamente');
      }
    } else {
      console.log('❌ Usuario admin no encontrado. Creando...');
      
      // Buscar rol de administrador
      const adminRole = await prisma.role.findFirst({
        where: { name: 'Administrador' }
      });
      
      // Buscar departamento
      const adminDept = await prisma.department.findFirst({
        where: { name: 'Dirección General' }
      });
      
      if (!adminRole) {
        console.log('❌ Rol Administrador no encontrado');
        return;
      }
      
      // Crear usuario admin
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      admin = await prisma.user.create({
        data: {
          email: 'admin@poa.gov',
          password: hashedPassword,
          firstName: 'Administrador',
          lastName: 'del Sistema',
          isActive: true,
          roleId: adminRole.id,
          departmentId: adminDept?.id || null
        },
        include: { role: true, department: true }
      });
      
      console.log('✅ Usuario admin creado:', {
        id: admin.id,
        email: admin.email,
        nombre: admin.firstName + ' ' + admin.lastName,
        rol: admin.role?.name
      });
    }
    
    console.log('\n🎯 Credenciales de acceso:');
    console.log('   Email: admin@poa.gov');
    console.log('   Password: admin123456');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdmin();
