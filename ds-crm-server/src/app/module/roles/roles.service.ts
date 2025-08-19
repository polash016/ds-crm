import prisma from "../../shared/prisma";
import { TPaginationOptions } from "../../interfaces/pagination";
import { roleFilterFields, roleSearchableFields } from "./roles.const";
import { paginationHelper } from "../../helpers/paginationHelper";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createRole = async (req: any) => {
  const { name, description, permissions } = req.body;

  const existingRole = await prisma.role.findFirst({
    where: {
      name,
    },
  });

  if (existingRole) {
    throw new ApiError(httpStatus.FOUND, "Duplicate name is forbidden");
  }

  return await prisma.$transaction(async (tx) => {
    const role = await tx.role.create({
      data: { name, description },
    });

    // Find permission IDs for view_profile and update_profile
    const extraPermissions = await tx.permission.findMany({
      where: {
        name: { in: ["view_profile", "edit_profile"] },
      },
      select: { id: true },
    });
    const extraPermissionIds = extraPermissions.map((p) => p.id);
    const permissionsString = permissions?.map((p: any) => p.id);

    // Combine provided permissions with extra ones
    const allPermissionIds = Array.from(
      new Set([...permissionsString, ...extraPermissionIds])
    );

    await tx.rolePermission.createMany({
      data: allPermissionIds.map((permissionId: string) => ({
        roleId: role.id,
        permissionId,
      })),
    });
    return tx.role.findUnique({
      where: { id: role.id },
      include: { permissions: { include: { permission: true } } },
    });
  });
};

const getAllRoles = async (params: any, options: TPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const andConditions: any[] = [];
  const { searchTerm } = params;

  if (searchTerm) {
    andConditions.push({
      OR: roleSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  // for (const key of roleFilterFields) {
  //   if (filterData[key]) {
  //     andConditions.push({
  //       [key]: { contains: filterData[key], mode: "insensitive" },
  //     });
  //   }
  // }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const data = await prisma.role.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { permissions: { include: { permission: true } } },
  });
  const total = await prisma.role.count({ where });
  return {
    meta: { page, limit, total },
    data,
  };
};

const getRoleById = async (id: string) => {
  return prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};

const updateRole = async (id: string, req: any) => {
  const { name, description, permissions } = req.body;
  return await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id },
      data: { name, description },
    });
    if (permissions) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.rolePermission.createMany({
        data: permissions.map((permissionId: any) => ({
          roleId: id,
          permissionId: permissionId.id,
        })),
      });
    }
    return tx.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
  });
};

const deleteRole = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { roleId: id },
  });

  if (user) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Cannot delete role assigned to a user"
    );
  }
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  return prisma.role.delete({ where: { id } });
};

export const rolesService = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
