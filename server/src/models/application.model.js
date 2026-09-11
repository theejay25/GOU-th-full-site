import mongoose from "mongoose";

export const PROGRAM_TYPES = ["internship", "residency", "caregiver"];

export const PROGRAM_LABELS = {
  internship: "Internship Training Program",
  residency: "Residency Program",
  caregiver: "Caregiver Program",
};

const applicationSchema = new mongoose.Schema(
  {
    programType: {
      type: String,
      enum: PROGRAM_TYPES,
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    institution: {
      type: String,
      trim: true,
    },
    letterImage: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    // Residency-specific fields
    lgaIdentification: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    mbbsCertificate: {
      type: String,
      trim: true,
    },
    nyscCertificate: {
      type: String,
      trim: true,
    },
    medicalCouncilCertificate: {
      type: String,
      trim: true,
    },
    // Caregiver-specific fields
    careLetterOfIntent: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

applicationSchema.index({ programType: 1, createdAt: -1 });

export default mongoose.model("Application", applicationSchema);
