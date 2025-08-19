import express from "express";
import { authController } from "./auth.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/login", authController.loginUser);

router.post("/register", authController.changePassword);

router.post("/refresh-token", authController.refreshToken);
// router.get("/success", authController.googleCallback);

// router.get(
//   '/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] }),
// )

// router.get(
//   '/google/callback',
//   passport.authenticate('google', {
//     // successRedirect: '/api/v1/auth/success',
//     failureRedirect: 'https://event-hive-client.vercel.app/login',
//   }),
//   authController.googleCallback,
// )

router.post(
  "/change-password",

  authController.changePassword
);

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);

export const authRoutes = router;
