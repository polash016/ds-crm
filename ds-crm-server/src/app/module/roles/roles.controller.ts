import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendRespinse";
import { rolesService } from "./roles.service";
import { roleFilterFields, roleSearchableFields } from "./roles.const";
import pick from "../../shared/pick";

const createRole = catchAsync(async (req: Request, res: Response) => {
  const result = await rolesService.createRole(req);
  console.log("came here");
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role created successfully!",
    data: result,
  });
});

const getAllRoles = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, roleFilterFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await rolesService.getAllRoles(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Roles fetched successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getRoleById = catchAsync(async (req: Request, res: Response) => {
  const result = await rolesService.getRoleById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role fetched successfully!",
    data: result,
  });
});

const updateRole = catchAsync(async (req: Request, res: Response) => {
  const result = await rolesService.updateRole(req.params.id, req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role updated successfully!",
    data: result,
  });
});

const deleteRole = catchAsync(async (req: Request, res: Response) => {
  const result = await rolesService.deleteRole(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Role deleted successfully!",
    data: result,
  });
});

export const rolesController = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
