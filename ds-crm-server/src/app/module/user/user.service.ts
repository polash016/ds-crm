/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { Prisma, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
// import config from "../../config";
// import prisma from "../../../shared/prisma";
// import { fileUploader } from "../../../helpers/fileUploader";
// import { TPaginationOptions } from "../../interfaces/pagination";
// import calculatePagination from "../../../helpers/paginationHelper";
import { JwtPayload } from "jsonwebtoken";
import { userFilterField, userSearchableField } from "./user.const";
import prisma from "../../shared/prisma";
import { fileUploader } from "../../helpers/fileUploader";
import config from "../../config";
import { TPaginationOptions } from "../../interfaces/pagination";
import { Prisma, UserType } from "@prisma/client";
import { paginationHelper } from "../../helpers/paginationHelper";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createUser = async (req: any) => {
  const file = req.file;
  const data = req.body;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);

    data.user.profileImg = uploadToCloudinary?.secure_url;
  }

  const hashedPassword: string = await bcrypt.hash(
    data.password,
    Number(config.salt_rounds)
  );

 

  let userId = "DS-User-002";

  const lastUser= await prisma.user.findFirst({
    orderBy:{
      createdAt: "desc"
    },
    select: {
      id: true,
    },
  });

  if(lastUser){
    const idParts = lastUser.id.split("-");
    if (idParts.length === 3 && idParts[0] === "DS" && idParts[1] === "User") {
      const currentNumber = parseInt(idParts[2] as string, 10);
      if (!isNaN(currentNumber)) {
        const nextNumber = currentNumber + 1;
        userId = `DS-User-${nextNumber.toString().padStart(3, "0")}`;
      }
    }
  }

  console.log("userId", userId);

  const userData = {
    id: userId,
    email: data.user.email,
    password: hashedPassword,
    roleId: data.user.roleId,
  };

  const profileData = {
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    employeeId: data.user.employeeId,
    profileImg: data.user.profileImg,
    designation: data.user.designation,
    address: data.user.address,
    contactNumber: data.user.contactNumber,
  };

  const result = await prisma.$transaction(async (transClient:any) => {
    const user = await transClient.user.create({
      data: userData,
    });

    const createProfileData = await transClient.profile.create({
      data: { ...profileData, userId: user.id },
    });

    return createProfileData;
  });
  return result;
};


const getAllUsers = async (params: any, options: TPaginationOptions) => {
  const { limit, page, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.UserWhereInput[] = [];

  console.log("params", params);

  const { searchTerm, ...filterData } = params;

  if (params.searchTerm) {
    andConditions.push({
      OR: userSearchableField.map((field) => {
        if (field === "email" || field === "id") {
          return {
            [field]: {
              contains: params.searchTerm,
              mode: "insensitive",
            },
          };
        } else {
          return {
            profile: {
              [field]: {
                contains: params.searchTerm,
                mode: "insensitive",
              },
            },
          };
        }
      }),
    });
  }

  // if (Object.keys(filterData).length > 0) {
  //   andConditions.push({
  //     AND: Object.keys(filterData).map((key) => ({
  //       [key]: {
  //         equals: (filterData as any)[key],
  //       },
  //     })),
  //   });
  // }

  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    include: {
      profile: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const total = await prisma.user.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: {
      profile: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const simplifiedPermissions = user?.role?.permissions.map((p) => ({
    id: p.permission.id,
    name: p.permission.name,
  }));

  // Assigning simplified permissions to a new property
  return {
    ...user,
    permissions: simplifiedPermissions,
  };
};

// const changeStatus = async (id: string, data: { status: UserStatus }) => {
//   await prisma.user.findUniqueOrThrow({
//     where: {
//       id,
//     },
//   });

//   const result = await prisma.user.update({
//     where: {
//       id,
//     },
//     data: data,
//   });

//   return {
//     data: result,
//   };
// };

const getProfile = async (user: JwtPayload) => {
  console.log("user", user);
  const userInfo = await prisma.user.findUnique({
    where: {
      id: user?.id,
    },
    include: {
      profile: true,
    },
  });

  if (!userInfo) {
    throw new ApiError(httpStatus.NOT_FOUND, "Profile Not Found");
  }

  

  return userInfo;
};

const updateMyProfile = async (user: JwtPayload, req: any) => {
  const data = req.body;
  const file = req.file;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    data.employee.profileImg = uploadToCloudinary?.secure_url;
  }

  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      id: user?.id,
      isDeleted: false,
    },
  });

  let profileInfo;

  console.log("data", data);

  if (userInfo.userType === UserType.EMPLOYEE) {
    profileInfo = await prisma.profile.update({
      where: {
        userId: userInfo.id,
      },
      data: data.profile,
    });
  } else {
    // Use upsert to handle both create and update cases for employee
    profileInfo = await prisma.profile.upsert({
      where: {
        userId: userInfo.id,
      },
      update: data.employee,
      create: {
        ...data.employee,
        userId: userInfo.id,
      },
    });
  }

  return { ...userInfo, ...profileInfo };
};

const updateProfile = async (req: any) => {
  const { employee } = req.body;
  const file = req.file;
  const { id } = req.params;
  const { email, roleId, ...employeeData } = employee;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    employeeData.profileImg = uploadToCloudinary?.secure_url;
  }

  const userInfo = await prisma.user.findUnique({
    where: {
      id: id,
      isDeleted: false,
    },
  });

  if (!userInfo) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const userData: any = {};
  if (email) userData.email = email;
  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (role) {
      userData.roleId = roleId;
    }
  }

  const result = await prisma.$transaction(async (transClient) => {
    // Update user data if provided
    if (Object.keys(userData).length > 0) {
      await transClient.user.update({
        where: { id: id },
        data: userData,
      });
    }

    // Use upsert to handle both create and update cases for employee
    const updateProfileData = await transClient.profile.upsert({
      where: {
        userId: id,
      },
      update: employeeData,
      create: {
        ...employeeData,
        userId: id,
      },
    });

    return updateProfileData;
  });

  return result;
};

// const deleteUser = async (id: string) => {
//   const user = await prisma.user.findUniqueOrThrow({
//     where: { id, isDeleted: false },
//   });

//   // if (!user) {
//   //   throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   // }

//   const order = await prisma.order.findFirst({
//     where: { userId: id },
//   });

//   if (order) {
//     throw new ApiError(
//       httpStatus.FORBIDDEN,
//       "Cannot delete user with existing orders"
//     );
//   }

//   const result = await prisma.$transaction(async (transClient) => {
//     const profile = await transClient.profile.delete({
//       where: {
//         userId: id,
//       },
//     });

//     const result = await prisma.user.delete({
//       where: { id },
//     });

//     return result;
//   });

//   return result;
// };

export const userService = {
  createUser,
  getAllUsers,
  // changeStatus,
  getUserById,
  getProfile,
  updateMyProfile,
  // deleteUser,
  updateProfile,
};
