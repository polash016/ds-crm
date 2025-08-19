import { z } from "zod";

const createLeadSchema = z.object({
  body: z.object({
    firstName: z
      .string({
        error: "First name is required",
      })
      .min(1, "First name cannot be empty"),

    lastName: z.string().optional(),

    email: z.string().email("Invalid email format").optional(),

    phone: z.string().optional(),

    company: z.string().optional(),

    position: z.string().optional(),

    source: z.string().optional(),

    status: z
      .enum([
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "PROPOSAL",
        "NEGOTIATION",
        "CLOSED_WON",
        "CLOSED_LOST",
      ])
      .optional(),

    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),

    description: z.string().optional(),

    notes: z.string().optional(),

    assignedToId: z.string().optional(),
  }),
});

const updateLeadSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name cannot be empty").optional(),
    lastName: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    position: z.string().optional(),
    source: z.string().optional(),
    status: z
      .enum([
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "PROPOSAL",
        "NEGOTIATION",
        "CLOSED_WON",
        "CLOSED_LOST",
      ])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
    assignedToId: z.string().optional(),
  }),
});

const csvUploadSchema = z.object({
  body: z.object({
    assignedToId: z.string().optional(),
    source: z.string().optional(),
  }),
});

const bulkAssignSchema = z.object({
  body: z.object({
    leadIds: z.array(z.string()).min(1, "At least one lead ID is required"),
    assignedToId: z
      .string({
        error: "User ID to assign leads to is required",
      })
      .min(1, "User ID cannot be empty"),
  }),
});

const assignLeadSchema = z.object({
  body: z.object({
    assignedToId: z
      .string({
        error: "User ID to assign lead to is required",
      })
      .min(1, "User ID cannot be empty"),
  }),
});

export const leadValidation = {
  createLeadSchema,
  updateLeadSchema,
  csvUploadSchema,
  bulkAssignSchema,
  assignLeadSchema,
};
