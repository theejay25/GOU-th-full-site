import nodemailer from "nodemailer";

if (!process.env.SMTP_HOST) {
  console.warn(
    "SMTP_HOST is not set — check that .env exists in the project root and is loaded before this file runs."
  );
}

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587/25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Only disable certificate validation if explicitly opted into via .env —
  // never hardcode this off, since it removes protection against MITM attacks.
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
  },
});

// Verified once at boot so a bad SMTP config is caught early, not on first email send.
export const verifyMailer = async () => {
  try {
    await transporter.verify();
    console.log("Nodemailer transporter ready.");
  } catch (err) {
    console.error("Nodemailer configuration issue:", err.message);
  }
};
