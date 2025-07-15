const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingPermissions() {
  try {
    console.log('🔍 Adding missing permissions...');
    
    // Required permissions that might be missing
    const requiredPermissions = [
      { action: 'read', resource: 'department' },
      { action: 'read', resource: 'budget-execution' },
      { action: 'read', resource: 'strategic-axis' },
      { action: 'read', resource: 'objective' },
      { action: 'read', resource: 'product' },
      { action: 'read', resource: 'activity' },
      { action: 'read', resource: 'indicator' },
      { action: 'read', resource: 'progress-report' },
      { action: 'read', resource: 'user' },
      { action: 'read', resource: 'role' },
      { action: 'read', resource: 'permission' }
    ];
    
    // Get admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrador del Sistema' }
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
    
    console.log(`\n✅ Process completed. Added ${addedCount} new permissions.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingPermissions();
