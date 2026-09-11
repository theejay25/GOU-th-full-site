import express from "express";
import { body, param, query } from "express-validator";
import rateLimit from "express-rate-limit";
import validate from "../middleware/validate.middleware.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { PROGRAM_TYPES } from "../models/application.model.js";
import {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/application.controller.js";

const router = express.Router();

// Prevents the application form from being used to spam emails/DB writes.
const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many applications submitted, please try again later",
  },
});

const applicationValidators = [
  param("program")
    .isIn(PROGRAM_TYPES)
    .withMessage(`Program must be one of: ${PROGRAM_TYPES.join(", ")}`),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required"),
  body("phone").optional({ values: "falsy" }).trim(),
  body("institution").optional({ values: "falsy" }).trim(),
  body("message").optional({ values: "falsy" }).trim(),
  body("lgaIdentification").optional({ values: "falsy" }).trim(),
  body("dateOfBirth")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Invalid date format"),
];

// File upload field definitions per program type.
const uploadFields = [
  { name: "letterImage", maxCount: 1 },
  { name: "mbbsCertificate", maxCount: 1 },
  { name: "nyscCertificate", maxCount: 1 },
  { name: "medicalCouncilCertificate", maxCount: 1 },
  { name: "careLetterOfIntent", maxCount: 1 },
];

// This one route pattern serves all three required endpoints:
//   POST /api/applications/internship
//   POST /api/applications/residency
//   POST /api/applications/caregiver
// Multer handles multiple file fields — only relevant fields per program type
// will actually contain files; the rest remain undefined.
router.post(
  "/:program",
  applyLimiter,
  upload.fields(uploadFields),
  applicationValidators,
  validate,
  submitApplication,
);

// Admin-facing: view submitted applications (protected — any logged-in user
// for now; add a role/permission check here if you introduce admin accounts).
router.get(
  "/",
  protect,
  [query("program").optional().isIn(PROGRAM_TYPES)],
  validate,
  getApplications,
);

router.get(
  "/:id",
  protect,
  [param("id").isMongoId().withMessage("Invalid application id")],
  validate,
  getApplicationById,
);

router.patch(
  "/:id/status",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid application id"),
    body("status")
      .isIn(["reviewed", "accepted", "rejected"])
      .withMessage("Status must be 'reviewed', 'accepted', or 'rejected'"),
  ],
  validate,
  updateApplicationStatus,
);

router.delete(
  "/:id",
  protect,
  [param("id").isMongoId().withMessage("Invalid application id")],
  validate,
  deleteApplication,
);

export default router;
