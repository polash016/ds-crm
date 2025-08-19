/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { Prisma, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { JwtPayload } from "jsonwebtoken";
import { userFilterField, userSearchableField } from "./permission.const";
import prisma from "../../shared/prisma";
import { fileUploader } from "../../helpers/fileUploader";
import config from "../../config";
import { TPaginationOptions } from "../../interfaces/pagination";
import { Prisma, UserStatus } from "@prisma/client";
import { paginationHelper } from "../../helpers/paginationHelper";

const getAllPermission = async (options: TPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const result = await prisma.permission.findMany({
    // skip,
    // take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            id: "desc",
          },
  });

  const total = await prisma.permission.count({});

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const createUserPermission = async (req: any) => {
  const data = req.body;

  const permissionData = {
    name: data.permission.name,
  };
  const result = await prisma.permission.create({
    data: permissionData,
  });
  return result;
};

// const getAllPermissions = async (params: any, options: TPaginationOptions) => {
//   const { limit, page, skip } = paginationHelper.calculatePagination(options);
//   const andConditions: Prisma.UserWhereInput[] = [];

//   const { searchTerm, ...filterData } = params;

//   if (params.searchTerm) {
//     andConditions.push({
//       OR: userFilterField.map((field) => ({
//         [field]: {
//           contains: params.searchTerm,
//           mode: "insensitive",
//         },
//       })),
//     });
//   }

//   if (Object.keys(filterData).length > 0) {
//     andConditions.push({
//       AND: Object.keys(filterData).map((key) => ({
//         [key]: {
//           equals: (filterData as any)[key],
//         },
//       })),
//     });
//   }

//   andConditions.push({
//     status: "ACTIVE",
//   });

//   const whereConditions: Prisma.UserWhereInput =
//     andConditions.length > 0 ? { AND: andConditions } : {};
//   const result = await prisma.user.findMany({
//     where: whereConditions,
//     skip,
//     take: limit,
//     orderBy:
//       options.sortBy && options.sortOrder
//         ? {
//             [options.sortBy]: options.sortOrder,
//           }
//         : {
//             createdAt: "desc",
//           },
//     select: {
//       id: true,
//       email: true,
//       status: true,
//       createdAt: true,
//       updatedAt: true,
//     },

//     // {
//     //   admin: true,
//     //   patient: true,
//     //   doctor: true
//     // }
//   });

//   const total = await prisma.user.count({ where: whereConditions });

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//     },
//     data: result,
//   };
// };

export const permissionService = {
  getAllPermission,
  createUserPermission,
  // getAllPermissions,
};
