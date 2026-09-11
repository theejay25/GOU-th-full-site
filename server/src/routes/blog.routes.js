import express from "express";
import { body, param } from "express-validator";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getMyBlogs,
  togglePin,
} from "../controllers/blog.controller.js";

const router = express.Router();

const blogValidators = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("content").trim().notEmpty().withMessage("Content is required"),
];

const idValidator = [param("id").isMongoId().withMessage("Invalid blog id")];

// Public
router.get("/", getBlogs);
router.get("/:id", idValidator, validate, getBlogById);

// Protected
router.get("/user/mine", protect, getMyBlogs);

router.post(
  "/",
  protect,
  upload.single("image"),
  blogValidators,
  validate,
  createBlog,
);

router.put(
  "/:id",
  protect,
  upload.single("image"),
  idValidator,
  blogValidators,
  validate,
  updateBlog,
);

router.patch("/:id/pin", protect, idValidator, validate, togglePin);

router.delete("/:id", protect, idValidator, validate, deleteBlog);

export default router;
