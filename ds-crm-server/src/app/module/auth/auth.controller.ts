/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { authServices } from "./auth.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendRespinse";



const createUser = catchAsync(async (req, res) => {
  const result = await authServices.createUser(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Created successfully!",
    data: result,
  });
});

const loginUser = catchAsync(async (req, res) => {
  const result = await authServices.loginUser(req.body);

  const { refreshToken, ...other } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
    // sameSite: "none",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully!",
    data: other,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  const result = await authServices.refreshToken(refreshToken);

  const { accessToken } = result;

  // res.cookie('refreshToken', accessToken, {
  //   secure: false, // true only in production
  //   httpOnly: true,
  // })

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generated successfully!",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  if (req.user) {
    await authServices.changePassword((req.user as any).email, req.body);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully!",
    data: null,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  await authServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your mail!",
    data: null,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization || "";

  await authServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully!",
    data: null,
  });
});

export const authController = {
  loginUser,
  // googleCallback,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  createUser,
};
