import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { ApiError, ok } from "../utils/response.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util.js";
import {
  generateToken,
  hashToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../utils/email.util.js";

const SALT_ROUNDS = 10;
const VERIFY_EXPIRES_MS =
  Number(process.env.EMAIL_VERIFICATION_EXPIRES_MS) || 24 * 60 * 60 * 1000;
const RESET_EXPIRES_MS =
  Number(process.env.PASSWORD_RESET_EXPIRES_MS) || 60 * 60 * 1000;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const { rawToken, hashedToken } = generateToken();

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    verificationToken: hashedToken,
    verificationTokenExpires: Date.now() + VERIFY_EXPIRES_MS,
  });

  await sendVerificationEmail(user.email, user.name, rawToken);

  return ok(
    res,
    201,
    "Account created. Please check your email to verify your account.",
    { id: user._id, name: user.name, email: user.email },
  );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = hashToken(token);

  // First, try to find by token alone (ignore expiry) to distinguish
  // "wrong token" from "expired token".
  const userByTokenOnly = await User.findOne({
    verificationToken: hashedToken,
  }).select("+verificationToken +verificationTokenExpires");

  if (!userByTokenOnly) {
    console.warn(
      `[verifyEmail] No user found for hashed token (length=${hashedToken.length})`,
    );
    throw new ApiError(400, "Verification link is invalid or has expired");
  }

  if (userByTokenOnly.verificationTokenExpires < Date.now()) {
    console.warn(
      `[verifyEmail] Token expired for user ${userByTokenOnly.email}`,
    );
    throw new ApiError(400, "Verification link has expired");
  }

  const user = userByTokenOnly;

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  await sendWelcomeEmail(user.email, user.name);

  return ok(res, 200, "Email verified successfully. You can now log in.");
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) throw new ApiError(404, "No account found with this email");
  if (user.isVerified)
    throw new ApiError(400, "This account is already verified");

  const { rawToken, hashedToken } = generateToken();
  user.verificationToken = hashedToken;
  user.verificationTokenExpires = Date.now() + VERIFY_EXPIRES_MS;
  await user.save();

  await sendVerificationEmail(user.email, user.name, rawToken);
  return ok(res, 200, "Verification email resent");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(401, "Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const payload = { id: user._id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  return ok(res, 200, "Logged in successfully", {
    user: { id: user._id, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, "Refresh token is required");

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findOne({ refreshToken }).select("+refreshToken");
  if (!user || String(user._id) !== decoded.id) {
    throw new ApiError(401, "Refresh token not recognized");
  }

  const payload = { id: user._id, email: user.email };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  // Rotate refresh token so a stolen old token becomes useless.
  user.refreshToken = newRefreshToken;
  await user.save();

  return ok(res, 200, "Token refreshed", {
    accessToken,
    refreshToken: newRefreshToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: undefined });
  return ok(res, 200, "Logged out successfully");
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");
  return ok(res, 200, "Profile fetched", user);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the email exists, so
  // attackers can't use this endpoint to enumerate registered emails.
  if (user) {
    const { rawToken, hashedToken } = generateToken();
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + RESET_EXPIRES_MS;
    await user.save();
    await sendPasswordResetEmail(user.email, user.name, rawToken);
  }

  return ok(
    res,
    200,
    "If an account with that email exists, a reset link has been sent",
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new ApiError(400, "Reset link is invalid or has expired");
  }

  user.password = await bcrypt.hash(password, SALT_ROUNDS);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshToken = undefined; // force re-login everywhere after a reset
  await user.save();

  return ok(res, 200, "Password reset successfully. You can now log in.");
});
