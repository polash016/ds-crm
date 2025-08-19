import { Request, Response } from "express";
import { userService } from "./user.service";
import httpStatus from "http-status";
import { userFilterField, userSearchableField } from "./user.const";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import { IReqUser } from "../../interfaces/common";
import sendResponse from "../../shared/sendRespinse";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUser(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Created successfully!",
    data: result,
  });
});


const getAllUsers = catchAsync(async (req, res) => {
  const filters = pick(req.query, userFilterField);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await userService.getAllUsers(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User data fetched!",
    data: result.data,
    meta: result.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  console.log("id", req.params.id);
  const result = await userService.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully!",
    data: result,
  });
});

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

const getMyProfile = catchAsync(async (req, res) => {
  const result = await userService.getProfile(req.user as IReqUser);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const result = await userService.updateMyProfile(req?.user as IReqUser, req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const result = await userService.updateProfile(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await userService.deleteUser(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const userController = {
  createUser,
  getAllUsers,
  getUserById,
  // changeProfileStatus,
  getMyProfile,
  updateMyProfile,
  updateProfile,
  deleteUser,
};
