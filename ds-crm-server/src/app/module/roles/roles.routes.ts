import express from "express";
import { rolesController } from "./roles.controller";
import { rolesValidation } from "./roles.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.get("/:id", rolesController.getRoleById);

router.patch(
  "/update/:id",
  validateRequest(rolesValidation.updateRoleSchema),
  rolesController.updateRole
);

router.delete("/soft/:id", rolesController.deleteRole);
router.post(
  "/create",
  validateRequest(rolesValidation.createRoleSchema),
  rolesController.createRole
);

router.get("/", rolesController.getAllRoles);

export const rolesRoutes = router;
