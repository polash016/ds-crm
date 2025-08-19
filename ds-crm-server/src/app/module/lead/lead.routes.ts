import express, { NextFunction, Request, Response } from "express";
import { leadController } from "./lead.controller";
import validateRequest from "../../middlewares/validateRequest";
import { leadValidation } from "./lead.validation";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../helpers/fileUploader";

const router = express.Router();

// CSV Upload route (with file upload)
router.post(
  "/upload-csv",
  fileUploader.uploadCSV.single("csvFile"),

  (req: Request, res: Response, next: NextFunction) => {
    console.log("req.body", req.file);
    // req.body = leadValidation.csvUploadSchema.parse(JSON.parse(req.body.data));
    req.body = JSON.parse(req.body.data);
    return leadController.uploadCSV(req, res, next);
  }
  //   validateRequest(leadValidation.csvUploadSchema),
  //   leadController.uploadCSV
);

// Bulk assignment route - MUST come before /:id/assign
router.patch(
  "/bulk-assign",
  // auth(),
  // validateRequest(leadValidation.bulkAssignSchema),
  leadController.bulkAssignLeads
);

// CRUD routes
router.post(
  "/",
  // auth(),
  validateRequest(leadValidation.createLeadSchema),
  leadController.createLead
);

router.get(
  "/",
  // auth(),
  leadController.getAllLeads
);

router.get("/:id", auth(), leadController.getLeadById);

router.patch(
  "/:id",
  // auth(),
  validateRequest(leadValidation.updateLeadSchema),
  leadController.updateLead
);

router.delete("/:id", auth(), leadController.deleteLead);

// Single lead assignment route - MUST come after /bulk-assign
router.patch(
  "/:id/assign",
  // auth(),
  validateRequest(leadValidation.assignLeadSchema),
  leadController.assignLead
);

export const leadRoutes = router;
