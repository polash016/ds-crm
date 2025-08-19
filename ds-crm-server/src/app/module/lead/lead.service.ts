import { Prisma, Leads } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import prisma from "../../shared/prisma";
import { TPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../helpers/paginationHelper";
import { leadFilterField, leadSearchableField } from "./lead.const";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import Papa from "papaparse";
import crypto from "crypto";

// Create a single lead
const createLead = async (data: any) => {
  // const result = await prisma.lead.create({
  //   data,
  // });
  return null;
};

// Get all leads with pagination, filtering, and search
const getAllLeads = async (params: any, options: TPaginationOptions) => {
  const { limit, page, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const andConditions: Prisma.LeadsWhereInput[] = [];

  const { searchTerm, assignmentFilter, statusFilter, ...filterData } = params;

  console.log("params", params);

  // Search functionality
  if (params.searchTerm) {
    andConditions.push({
      OR: leadSearchableField.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Assignment filter - handle assigned vs unassigned leads
  if (assignmentFilter && assignmentFilter !== "all") {
    if (assignmentFilter === "assigned") {
      // Show leads that have an assignedToId
      andConditions.push({
        assignedToId: {
          not: null,
        },
      });
    } else if (assignmentFilter === "unassigned") {
      // Show leads that don't have an assignedToId
      andConditions.push({
        assignedToId: null,
      });
    }
  }

  // Status filter - handle lead status filtering
  if (statusFilter && statusFilter !== "all") {
    if (statusFilter === "new") {
      // Show leads with status "new" or leads created recently (within last 7 days)
      andConditions.push({
        OR: [
          {
            createdAt: {
              gte: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        ],
      });
    } else if (statusFilter === "contacted") {
      andConditions.push({
        status: "contacted",
      });
    } else if (statusFilter === "unqualified") {
      andConditions.push({
        status: "unqualified",
      });
    } else if (statusFilter === "converted") {
      andConditions.push({
        status: "converted",
      });
    } else if (statusFilter === "lost") {
      andConditions.push({
        status: "lost",
      });
    }
  }

  // Filter by specific fields (existing logic)
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        if (leadFilterField.includes(key)) {
          return {
            [key]: {
              equals: (filterData as any)[key],
            },
          };
        }
        return {};
      }),
    });
  }

  const whereConditions: Prisma.LeadsWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  console.log(
    "Final where conditions:",
    JSON.stringify(whereConditions, null, 2)
  );

  const result = await prisma.leads.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    // Include related data for better frontend display
    include: {
      // Include the assignedTo user relationship with profile data
      user: {
        select: {
          id: true,
          email: true,
          userType: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.leads.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Get lead by ID
const getLeadById = async (id: string) => {
  const lead = await prisma.leads.findUnique({
    where: { id },
  });

  if (!lead) {
    throw new ApiError(httpStatus.NOT_FOUND, "Lead not found");
  }

  return lead;
};

// Update lead
const updateLead = async (id: string, data: Partial<Leads>) => {
  const existingLead = await prisma.leads.findUnique({
    where: { id },
  });

  if (!existingLead) {
    throw new ApiError(httpStatus.NOT_FOUND, "Lead not found");
  }

  const result = await prisma.leads.update({
    where: { id },
    data,
  });

  return result;
};

// Delete lead
const deleteLead = async (id: string) => {
  const existingLead = await prisma.leads.findUnique({
    where: { id },
  });

  if (!existingLead) {
    throw new ApiError(httpStatus.NOT_FOUND, "Lead not found");
  }

  const result = await prisma.leads.delete({
    where: { id },
  });

  return result;
};

// Bulk assign leads to a user
const bulkAssignLeads = async (leadIds: string[], assignedToId: string) => {
  console.log("leadIds", leadIds);
  console.log("assignedToId", assignedToId);
  // Verify that the user exists
  const user = await prisma.user.findUnique({
    where: { id: assignedToId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Verify that all leads exist
  const existingLeads = await prisma.leads.findMany({
    where: { id: { in: leadIds } },
  });

  if (existingLeads.length !== leadIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Some leads not found");
  }

  // Update all leads with the new assignment
  const result = await prisma.leads.updateMany({
    where: { id: { in: leadIds } },
    data: { assignedToId },
  });

  // Return the updated leads
  const updatedLeads = await prisma.leads.findMany({
    where: { id: { in: leadIds } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          userType: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    assignedCount: result.count,
    leads: updatedLeads,
  };
};

// Assign a single lead to a user
const assignLead = async (leadId: string, assignedToId: string) => {
  // Verify that the user exists
  const user = await prisma.user.findUnique({
    where: { id: assignedToId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Verify that the lead exists
  const existingLead = await prisma.leads.findUnique({
    where: { id: leadId },
  });

  if (!existingLead) {
    throw new ApiError(httpStatus.NOT_FOUND, "Lead not found");
  }

  // Update the lead with the new assignment
  const result = await prisma.leads.update({
    where: { id: leadId },
    data: { assignedToId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          userType: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return result;
};

// CSV Upload functionality
const uploadCSV = async (req: any) => {
  const file = req.file;
  console.log("file", file);
  const { assignedToId, source } = req.body;

  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No CSV file uploaded");
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file.buffer.toString("utf8"), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
      complete: async (results) => {
        try {
          console.log("- Total rows found:", results.data.length);
          console.log("- Headers detected:", results.meta.fields);

          if (results.errors.length > 0) {
            console.log("⚠️ Parsing errors:", results.errors);
          }

          const validLeads: any[] = [];
          const invalidRows: any[] = [];
          const phoneMap = new Map<string, any>();

          // Process each row
          results.data.forEach((row: any, index: number) => {
            console.log(`\n🔍 Processing row ${index + 1}:`, row);

            // Normalize phone field (handle case where it might be 'Phone' in header)
            if (row.phone) {
              row.phone = row.phone.toString().trim();
            } else if (row.Phone) {
              row.phone = row.Phone.toString().trim();
            }

            // Skip if no phone number (invalid row)
            if (!row.phone || row.phone === "") {
              invalidRows.push({
                row: index + 1,
                reason: "Missing phone number",
                data: row,
              });
              return;
            }

            // Trim all string fields
            Object.keys(row).forEach((key) => {
              if (typeof row[key] === "string") {
                row[key] = row[key].trim();
              }
            });

            // Convert price to number if present
            if (row.price) {
              row.price = Number(row.price) || 0;
            } else {
              row.price = 0;
            }

            // Check if we have a record of this phone number
            if (phoneMap.has(row.phone)) {
              // Existing lead - merge items and price
              const existingLead = phoneMap.get(row.phone);

              // Merge items
              if (row.items && row.items !== "") {
                if (!Array.isArray(existingLead.items)) {
                  // Convert to array if it's not already
                  existingLead.items = existingLead.items
                    ? [existingLead.items]
                    : [];
                }
                existingLead.items.push(row.items);
              }

              // Sum prices
              existingLead.price += row.price;

              return;
            }

            // For new phone numbers, add to the map and validLeads
            const leadData = {
              name: row.name || null,
              phone: row.phone,
              address: row.address || null,
              items: row.items ? [row.items] : [], // Initialize as array
              source: source || row.source || "CSV Import",
              price: row.price || 0,
              batchName: file?.originalname,
              status: row?.status,
              assignedToId: assignedToId || null,
            };

            // Add to phone map for tracking duplicates
            phoneMap.set(row.phone, leadData);
            validLeads.push(leadData);
          });

          if (invalidRows.length > 0) {
            invalidRows.forEach((invalid) => {
              console.log(`  Row ${invalid.row}: ${invalid.reason}`);
            });
          }

          // Bulk insert valid leads
          let createdLeads: any = [];
          if (validLeads.length > 0) {
            console.log("\n💾 Inserting leads into database...");
            const result = await prisma.leads.createMany({
              data: validLeads,
            });
            createdLeads = result;
          }

          createdLeads = await prisma.leads.findMany({
            where: { batchName: file?.originalname },
          });

          resolve({ data: createdLeads });
        } catch (error) {
          console.error("\n💥 Error during CSV processing:", error);
          reject(
            new ApiError(
              httpStatus.INTERNAL_SERVER_ERROR,
              "Error processing CSV file"
            )
          );
        }
      },
      error: (error) => {
        console.error("\n💥 CSV parsing error:", error);
        reject(new ApiError(httpStatus.BAD_REQUEST, "Invalid CSV file format"));
      },
    });
  });
};

export const leadService = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  bulkAssignLeads,
  assignLead,
  uploadCSV,
};
