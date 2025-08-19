import { Request, Response } from "express";
import httpStatus from "http-status";
import { userSearchableField } from "./permission.const";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import { IReqUser } from "../../interfaces/common";
import { permissionService } from "./permission.service";
import sendResponse from "../../shared/sendRespinse";

const getAllPermissions = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await permissionService.getAllPermission(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Permission fetched successfully!",
    data: result?.data,
    meta: result?.meta,
  });
});

const createUserPermission = catchAsync(async (req: Request, res: Response) => {
  const result = await permissionService.createUserPermission(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Permission Created successfully!",
    data: result,
  });
});

// const getAllPermissions = catchAsync(async (req, res) => {
//   const filters = pick(req.query, userSearchableField);
//   const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

//   const result = await permissionService.getAllPermissions(filters, options);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "User permissions fetched!",
//     data: result.data,
//     meta: result.meta,
//   });
// });

// const changeProfileStatus = catchAsync(async (req, res) => {
//   const { id } = req.params;

//   const result = await userService.changeStatus(id, req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "User Status Changed",
//     data: result.data,
//   });
// });

// const getMyProfile = catchAsync(async (req, res) => {
//   const result = await userService.getProfile(req.user as IReqUser);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Profile retrieved successfully",
//     data: result,
//   });
// });

// const updateMyProfile = catchAsync(async (req, res) => {
//   const result = await userService.updateProfile(req?.user as IReqUser, req);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Profile updated successfully",
//     data: result,
//   });
// });

export const permissionController = {
  getAllPermissions,
  createUserPermission,
  // getAllPermissions,
  // changeProfileStatus,
  // getMyProfile,
  // updateMyProfile,
};
