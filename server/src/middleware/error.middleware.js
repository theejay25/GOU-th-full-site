import multer from "multer";
import { ApiError } from "../utils/response.util.js";

// Catches unmatched routes.
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

// Single place that turns any thrown error into a consistent JSON shape.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors || [];

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? `Image too large. Max size is ${process.env.MAX_UPLOAD_MB || 5}MB`
        : err.message;
  } else if (err.message && err.message.includes("Only image files")) {
    statusCode = 400;
    message = err.message;
  } else if (err.name === "CastError") {
    // Usually an invalid MongoDB ObjectId in a route param.
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === "ValidationError") {
    // Mongoose schema validation failure.
    statusCode = 422;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.code === 11000) {
    // Mongo duplicate key error (e.g. unique email).
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `That ${field} is already in use`;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
