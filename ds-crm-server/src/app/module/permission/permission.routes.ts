import express from "express";
import { permissionController } from "./permission.controller";
import validateRequest from "../../middlewares/validateRequest";
import { permissionValidation } from "./permission.validation";

const router = express.Router();

router.get(
  "/",
  // auth(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  permissionController.getAllPermissions
);

router.post(
  "/create-permission",
  // auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(permissionValidation.createPermission),
  permissionController.createUserPermission
);

export const permissionRoutes = router;
