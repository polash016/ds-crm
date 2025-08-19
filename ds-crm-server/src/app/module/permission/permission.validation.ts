import { z } from "zod";

const createTenant = z.object({
  tenant: z.object({
    name: z.string({ required_error: "Name is required" }),
  }),
});

const createPermission = z.object({
  body: z.object({
    permission: z.object({
      name: z.string({ required_error: "Permission Name is required" }),
    }),
  }),
});

export const permissionValidation = {
  createTenant,
  createPermission,
};
