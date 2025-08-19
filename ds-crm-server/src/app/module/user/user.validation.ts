// import { Gender, UserStatus } from "@prisma/client";
import { z } from "zod";






const createUser = z.object({
  password: z.string({ error: "Password is required" }).min(6),
  user: z.object({
    firstName: z.string({ error: "First Name is required" }),
    lastName: z.string().optional(),
    email: z.string({ error: "Email is required" }).email(),
    profileImg: z.string().url().optional(),
    employeeId: z.string().optional(),
    designation: z.string({ error: "Designation is required" }),
    contactNumber: z.string({ error: "Contact Number is required" }),
    address: z.string().optional(),
    roleId: z.string({ error: "Role id sis required" }),
  }),
});

const assignPermission = z.object({
  body: z.object({
    userId: z.string({ error: "User Id is required" }),
    permissions: z.array(
      z.string({ error: "Minimum one permission is required" })
    ),
  }),
});



const updateEmployee = z.object({
  employee: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    profileImg: z.string().url().optional(),
    nationalId: z.string().optional(),
    employeeId: z.string().optional(),
    designation: z.string().optional(),
    contactNumber: z.string().optional(),
    address: z.string().optional(),
    roleId: z.string().optional(),
  }),
});

export const userValidation = {

  createUser,
  assignPermission,
};
