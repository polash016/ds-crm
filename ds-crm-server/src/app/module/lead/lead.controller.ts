import { Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../shared/catchAsync";
import { leadService } from "./lead.service";
import pick from "../../shared/pick";
import { leadFilterField } from "./lead.const";
import sendResponse from "../../shared/sendRespinse";

// Create a new lead
const createLead = catchAsync(async (req: Request, res: Response) => {
  console.log("req.body", req);
  const result = await leadService.createLead(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Lead created successfully",
    data: result,
  });
});

// Get all leads with pagination and filtering
const getAllLeads = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, leadFilterField);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await leadService.getAllLeads(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leads retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Get lead by ID
const getLeadById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new Error("Lead ID is required");
  }
  const result = await leadService.getLeadById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead retrieved successfully",
    data: result,
  });
});

// Update lead
const updateLead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new Error("Lead ID is required");
  }
  const result = await leadService.updateLead(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead updated successfully",
    data: result,
  });
});

// Delete lead
const deleteLead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new Error("Lead ID is required");
  }
  await leadService.deleteLead(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead deleted successfully",
    data: null,
  });
});

// Upload CSV file
const uploadCSV = catchAsync(async (req: Request, res: Response) => {
  const result = await leadService.uploadCSV(req);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "CSV file processed successfully",
    data: (result as any).data,
  });
});

// Bulk assign leads
const bulkAssignLeads = catchAsync(async (req: Request, res: Response) => {
  const { leadIds, assignedToId } = req.body;
  console.log("leadIds", { leadIds, assignedToId });
  const result = await leadService.bulkAssignLeads(leadIds, assignedToId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${leadIds.length} leads assigned successfully`,
    data: result,
  });
});

// Assign a single lead
const assignLead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new Error("Lead ID is required");
  }
  const { assignedToId } = req.body;
  const result = await leadService.assignLead(id, assignedToId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lead assigned successfully",
    data: result,
  });
});

export const leadController = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  uploadCSV,
  bulkAssignLeads,
  assignLead,
};
