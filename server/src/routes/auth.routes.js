import express from "express";
import { body, param } from "express-validator";
import rateLimit from "express-rate-limit";
import validate from "../middleware/validate.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Slows down brute-force attempts against these sensitive routes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
});

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("A valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.get(
  "/verify-email/:token",
  [param("token").notEmpty()],
  validate,
  verifyEmail
);

router.post(
  "/resend-verification",
  authLimiter,
  [body("email").trim().isEmail().withMessage("A valid email is required")],
  validate,
  resendVerification
);

router.post(
  "/login",
  authLimiter,
  [
    body("email").trim().isEmail().withMessage("A valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.post(
  "/refresh",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validate,
  refresh
);

router.post("/logout", protect, logout);
router.get("/profile", protect, getProfile);

router.post(
  "/forgot-password",
  authLimiter,
  [body("email").trim().isEmail().withMessage("A valid email is required")],
  validate,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  authLimiter,
  [
    param("token").notEmpty(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  resetPassword
);

export default router;
