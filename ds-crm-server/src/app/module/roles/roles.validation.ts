import { z } from "zod";

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Role name is required" }),
    description: z.string().optional(),
    permissions: z
      .array(
        z.object({
          id: z.string({ required_error: "Permission ID is required" }),
          name: z.string({ required_error: "Permission name is required" }),
        })
      )
      .min(1, "At least one permission is required"),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    permissions: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const rolesValidation = {
  createRoleSchema,
  updateRoleSchema,
};
