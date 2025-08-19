import express, { NextFunction, Request, Response } from "express";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { userValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
import { fileUploader } from "../../helpers/fileUploader";

const router = express.Router();

//TODO: TESTING

//auth("view_user", "manage_users"),
router.get("/", userController.getAllUsers);
router.get("/my", auth("view_profile"), userController.getMyProfile);
router.get(
  "/:id",
  // auth("view_user", "manage_users"),
  userController.getUserById
);

router.patch(
  "/edit-employee/:id",
  auth("manage_users", "edit_user"),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    return userController.updateProfile(req, res, next);
  }
);

router.delete(
  "/delete-employee/:id",
  auth("manage_users", "delete_user"),
  userController.deleteUser
);

router.post(
  "/create-user",
  // auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createUser.parse(JSON.parse(req.body.data));
    return userController.createUser(req, res, next);
  }
);

router.post(
  "/create-employee",
  // auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createEmployee.parse(JSON.parse(req.body.data));
    return userController.createEmployee(req, res, next);
  }
);

// router.post(
//   "/create-organizer",
//   auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   fileUploader.upload.single("file"),
//   (req: Request, res: Response, next: NextFunction) => {
//     req.body = userValidation.createOrganizer.parse(JSON.parse(req.body.data));
//     return userController.createOrganizer(req, res, next);
//   }
// );

// router.post(
//   "/create-attendee",
//   // auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
//   fileUploader.upload.single("file"),
//   (req: Request, res: Response, next: NextFunction) => {
//     req.body = userValidation.createAttendee.parse(JSON.parse(req.body.data));
//     return userController.createAttendee(req, res, next);
//   }
// );

router.patch(
  "/my-profile",
  auth("view_profile", "edit_profile"),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    console.log("req.body", req.body);
    req.body = JSON.parse(req.body.data);
    console.log("req.body", req.body);
    return userController.updateMyProfile(req, res, next);
  }
);

export const userRoutes = router;
