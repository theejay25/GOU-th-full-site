import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import validate from "../middleware/validate.middleware.js";
import { submitContactMessage } from "../controllers/contact.controller.js";

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent, please try again later",
  },
});

const contactValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required"),
  body("phone").optional().trim(),
  body("subject").trim().notEmpty().withMessage("Subject is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];

router.post("/", contactLimiter, contactValidators, validate, submitContactMessage);

export default router;
