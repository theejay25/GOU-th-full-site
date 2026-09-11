import Application, { PROGRAM_LABELS } from "../models/application.model.js";
import { ApiError, ok } from "../utils/response.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import {
  sendApplicationReceivedEmail,
  sendApplicationNotificationEmail,
  sendApplicationAcceptedEmail,
  sendApplicationRejectedEmail,
} from "../utils/email.util.js";

// Shared by all three program routes — the program type comes from the
// validated :program route param (see application.routes.js), so each of
// /api/applications/internship, /residency, /caregiver hits this once.
// Helper: extract uploaded file path from multer's files object
const getFilePath = (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName].length > 0) {
    return `/uploads/${files[fieldName][0].filename}`;
  }
  return undefined;
};

export const submitApplication = asyncHandler(async (req, res) => {
  const { program } = req.params;
  const {
    fullName,
    email,
    phone,
    institution,
    message,
    lgaIdentification,
    dateOfBirth,
  } = req.body;
  const programLabel = PROGRAM_LABELS[program];

  const files = req.files;

  // Base fields shared by all programs
  const applicationData = {
    programType: program,
    fullName,
    email,
    phone,
    institution,
    message,
  };

  // Handle file uploads based on program type
  if (program === "internship") {
    applicationData.letterImage = getFilePath(files, "letterImage");
  } else if (program === "residency") {
    applicationData.lgaIdentification = lgaIdentification;
    applicationData.dateOfBirth = dateOfBirth || undefined;
    applicationData.mbbsCertificate = getFilePath(files, "mbbsCertificate");
    applicationData.nyscCertificate = getFilePath(files, "nyscCertificate");
    applicationData.medicalCouncilCertificate = getFilePath(
      files,
      "medicalCouncilCertificate",
    );
  } else if (program === "caregiver") {
    applicationData.careLetterOfIntent = getFilePath(
      files,
      "careLetterOfIntent",
    );
  }

  const application = await Application.create(applicationData);

  // Application is saved regardless of whether these emails succeed —
  // don't let a flaky SMTP connection lose someone's submission.
  try {
    await sendApplicationNotificationEmail({
      programLabel,
      fullName,
      email,
      phone,
      message,
    });
    await sendApplicationReceivedEmail(email, fullName, programLabel);
  } catch (err) {
    console.error("Application email failed to send:", err.message);
  }

  return ok(
    res,
    201,
    `Your ${programLabel} application has been received.`,
    application,
  );
});

// Admin-facing: list applications, optionally filtered by program type.
export const getApplications = asyncHandler(async (req, res) => {
  const { program, status } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (program) filter.programType = program;
  if (status) filter.status = status;

  const [applications, total] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Application.countDocuments(filter),
  ]);

  return ok(res, 200, "Applications fetched", {
    applications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");
  return ok(res, 200, "Application fetched", application);
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["reviewed", "accepted", "rejected"].includes(status)) {
    throw new ApiError(
      400,
      "Status must be 'reviewed', 'accepted', or 'rejected'",
    );
  }

  const application = await Application.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );

  if (!application) throw new ApiError(404, "Application not found");

  // Send email notification to the applicant about their status change.
  // Wrapped in try/catch so a flaky SMTP connection never blocks the update.
  try {
    const programLabel = PROGRAM_LABELS[application.programType];
    if (status === "accepted") {
      await sendApplicationAcceptedEmail(
        application.email,
        application.fullName,
        programLabel,
      );
    } else if (status === "rejected") {
      await sendApplicationRejectedEmail(
        application.email,
        application.fullName,
        programLabel,
      );
    }
  } catch (err) {
    console.error(`Application status email failed to send:`, err.message);
  }

  return ok(res, 200, `Application ${status} successfully`, application);
});

export const deleteApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await Application.findByIdAndDelete(id);

  if (!application) throw new ApiError(404, "Application not found");

  return ok(res, 200, "Application deleted successfully");
});
