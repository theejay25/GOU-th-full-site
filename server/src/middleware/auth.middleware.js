import { verifyAccessToken } from "../utils/jwt.util.js";
import { ApiError } from "../utils/response.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";

// Verifies the Bearer access token and attaches { id, email } to req.user
export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, "Not authorized, invalid token");
  }
});
