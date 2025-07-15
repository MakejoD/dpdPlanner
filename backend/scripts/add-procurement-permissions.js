const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addProcurementPermissions() {
  try {
    console.log('🔍 Adding procurement permissions...');
    
    // Required procurement permissions
    const requiredPermissions = [
      { action: 'read', resource: 'procurement_process' },
      { action: 'create', resource: 'procurement_process' },
      { action: 'update', resource: 'procurement_process' },
      { action: 'delete', resource: 'procurement_process' }
    ];
    
    // Get admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrador' }
    });
    
    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }
    
    let addedCount = 0;
    
    for (const permissionData of requiredPermissions) {
      // Check if permission exists
      let permission = await prisma.permission.findUnique({
        where: {
          action_resource: {
            action: permissionData.action,
            resource: permissionData.resource
          }
        }
      });
      
      // Create permission if it doesn't exist
      if (!permission) {
        permission = await prisma.permission.create({
          data: permissionData
        });
        console.log(`✅ Created permission: ${permissionData.action}:${permissionData.resource}`);
        addedCount++;
      }
      
      // Check if admin role has this permission
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
      
      // Assign permission to admin role if not already assigned
      if (!rolePermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });
        console.log(`✅ Assigned ${permissionData.action}:${permissionData.resource} to admin role`);
      }
    }
    
    console.log(`\n✅ Process completed. Added ${addedCount} new procurement permissions.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addProcurementPermissions();
