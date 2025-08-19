
import bcrypt from "bcrypt";
import config from "../config";
import logger from "./logger";
import { AuthAction, PrismaClient, UserType } from "@prisma/client";

/**
 * Prisma client with automatic permission and role synchronization
 * 
 * This file automatically runs when the server starts to ensure:
 * 1. All permissions exist in the database
 * 2. Admin role has all manage_ permissions
 * 3. Admin user has the Admin role
 * 4. Other roles are updated with appropriate permissions
 * 
 * To manually trigger synchronization, you can call:
 * import prisma, { syncPermissionsAndRoles } from './shared/prisma';
 * await syncPermissionsAndRoles();
 */

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

// Prisma query logging - only in debug mode and only to file logs
if (config.env !== "production" && process.env.LOG_LEVEL === "debug") {
  prisma.$on("query", (e: any) => {
    logger.debug(
      { query: e.query, params: e.params, durationMs: e.duration },
      "Prisma query"
    );
  });
}

// prisma.$on('warn', (e) => {
//     console.log(e)
// })

// prisma.$on('info', (e) => {
//     console.log(e)
// })

// prisma.$on('error', (e) => {
//     console.log(e)
// })

async function main() {
  // Define all permissions that should exist in the system
  const permissions = [
    { name: "view_user", action: AuthAction.VIEW },
    { name: "edit_user", action: AuthAction.EDIT },
    { name: "delete_user", action: AuthAction.DELETE },
    { name: "create_user", action: AuthAction.CREATE },
    { name: "manage_users", action: AuthAction.ALL },


    { name: "view_role", action: AuthAction.VIEW },
    { name: "edit_role", action: AuthAction.EDIT },
    { name: "delete_role", action: AuthAction.DELETE },
    { name: "create_role", action: AuthAction.CREATE },
    { name: "manage_roles", action: AuthAction.ALL },

    
   

    { name: "view_history", action: AuthAction.VIEW },
    { name: "manage_histories", action: AuthAction.ALL },

    { name: "view_profile", action: AuthAction.VIEW },
    { name: "edit_profile", action: AuthAction.EDIT },
    { name: "delete_profile", action: AuthAction.DELETE },


        // Inventory
    // { name: "view_inventory", action: AuthAction.VIEW },
    // { name: "edit_inventory", action: AuthAction.EDIT },
    // { name: "delete_inventory", action: AuthAction.DELETE },
    // { name: "create_inventory", action: AuthAction.CREATE },
    // { name: "manage_inventories", action: AuthAction.ALL },

    { name: "view_customer", action: AuthAction.VIEW },
    { name: "edit_customer", action: AuthAction.EDIT },
    { name: "delete_customer", action: AuthAction.DELETE },
    { name: "create_customer", action: AuthAction.CREATE },
    { name: "manage_customers", action: AuthAction.ALL },

    { name: "view_lead", action: AuthAction.VIEW },
    { name: "edit_lead", action: AuthAction.EDIT },
    { name: "delete_lead", action: AuthAction.DELETE },
    { name: "create_lead", action: AuthAction.CREATE },
    { name: "manage_leads", action: AuthAction.ALL },


   
  ];

 

  // Step 1: Sync permissions - add new ones if they don't exist
  logger.info("Syncing permissions...");
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  logger.info("Permissions synchronized successfully");

  // Step 2: Get all manage permissions for role assignment
  const allManagePermissions = permissions.filter((perm) =>
    perm.name.startsWith("manage_")
  );

  const additionalPermissions = [
    { name: "view_profile",action: AuthAction.VIEW },
    { name: "edit_profile",action: AuthAction.EDIT },
  ];

  // Step 3: Create or update Admin role with all manage permissions
  logger.info("Syncing Admin role...");
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin", 
      description: "Administrator role with all manage permissions",
      permissions: {
        create: [
          ...allManagePermissions.map((perm) => ({
            permission: { connect: { name: perm.name } },
          })),
          ...additionalPermissions.map((perm) => ({
            permission: { connect: { name: perm.name } },
          })),
        ],
      },
    },
  });

  // Step 4: Update existing Admin role if it already exists to include new permissions
  if (adminRole) {
    logger.info("Updating Admin role with new permissions...");
    
    // Get current permissions of Admin role
    const currentRolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: adminRole.id },
      include: { permission: true }
    });

    const currentPermissionNames = currentRolePermissions.map((rp: any) => rp.permission.name);
    
    // Find missing manage permissions
    const missingManagePermissions = allManagePermissions.filter(
      perm => !currentPermissionNames.includes(perm.name)
    );

    // Find missing additional permissions
    const missingAdditionalPermissions = additionalPermissions.filter(
      perm => !currentPermissionNames.includes(perm.name)
    );

    // Add missing permissions to the role
    if (missingManagePermissions.length > 0 || missingAdditionalPermissions.length > 0) {
      logger.info(`Adding ${missingManagePermissions.length + missingAdditionalPermissions.length} missing permissions to Admin role`);
      
      // Add missing permissions to the role
      for (const perm of [...missingManagePermissions, ...missingAdditionalPermissions]) {
        const permission = await prisma.permission.findUnique({ where: { name: perm.name } });
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permission.id
              }
            },
            update: {},
            create: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          });
        }
      }
      
      logger.info("Admin role updated with new permissions");
    } else {
      logger.info("Admin role already has all required permissions");
    }
  }

  // Step 5: Create or update admin user
  logger.info("Syncing admin user...");
  const hashedPassword: string = await bcrypt.hash(
    "securePassword@123",
    Number(config.salt_rounds)
  );

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: "DS-User-001",
      email: "admin@example.com",
      password: hashedPassword,
      roleId: adminRole.id,
      userType: UserType.ADMIN,
    },
  });

  // Step 6: Update existing admin user's role if needed
  if (adminUser.roleId !== adminRole.id) {
    logger.info("Updating admin user's role...");
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { roleId: adminRole.id }
    });
    logger.info("Admin user role updated");
  }

  // Step 7: Check and update other roles that should have manage permissions
  logger.info("Checking other roles for permission updates...");
  const allRoles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  for (const role of allRoles) {
    if (role.name === "Admin") continue; 
    // Check if this role should have any manage permissions
    const roleManagePermissions = allManagePermissions.filter(perm => {
     
      const roleNameLower = role.name.toLowerCase();
      const permNameLower = perm.name.toLowerCase();
      
      return roleNameLower.includes(permNameLower.replace('manage_', '').replace('s', '')) ||
             roleNameLower.includes('manager') ||
             roleNameLower.includes('admin');
    });

    if (roleManagePermissions.length > 0) {
      const currentRolePermissionNames = role.permissions.map((rp: any) => rp.permission.name);
      const missingPermissions = roleManagePermissions.filter(
        perm => !currentRolePermissionNames.includes(perm.name)
      );

      if (missingPermissions.length > 0) {
        logger.info(`Adding ${missingPermissions.length} missing permissions to role: ${role.name}`);
        
        for (const perm of missingPermissions) {
          const permission = await prisma.permission.findUnique({ where: { name: perm.name } });
          if (permission) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id
                }
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id
              }
            });
          }
        }
      }
    }
  }

  
  const finalAdminRole = await prisma.role.findUnique({
    where: { name: "Admin" },
    include: { permissions: { include: { permission: true } } }
  });

  if (finalAdminRole) {
    const adminPermissionNames = finalAdminRole.permissions.map((rp: any) => rp.permission.name);
    logger.info(`Admin role now has ${adminPermissionNames.length} permissions: ${adminPermissionNames.join(', ')}`);
  }

  logger.info("Permission and role synchronization completed successfully");
}

export { main as syncPermissionsAndRoles };

// Auto-run the synchronization when this module is imported
// This ensures permissions are always up-to-date when the server starts
main()
  .catch((e) => {
    logger.error({ err: e }, "Prisma seed failure");
    // Don't exit process in production, just log the error
    if (config.env === "production") {
      logger.error("Continuing server startup despite permission sync failure");
    } else {
      logger.error("Permission sync failed in development mode");
    }
  })
  .finally(async () => {
    // Don't disconnect in production as this is the main prisma instance
    if (config.env !== "production") {
      await prisma.$disconnect();
    }
  });

export default prisma;
