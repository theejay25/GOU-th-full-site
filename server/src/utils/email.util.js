import crypto from "crypto";
import { transporter } from "../config/mailer.js";

// Generates a raw token to email to the user and its SHA-256 hash to store in
// the DB, so a leaked database never exposes a usable token (same pattern as
// password hashing, applied to one-time links).
export const generateToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  return { rawToken, hashedToken };
};

export const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

const baseSend = async ({ to, subject, html, replyTo }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
};

// Builds an absolute frontend URL from CLIENT_URL, tolerating a missing or
// trailing-slash value so emailed links never break or double up on slashes.
const frontendUrl = (path) => {
  const base = (process.env.CLIENT_URL || "http://localhost:5500").replace(/\/+$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
};

export const sendVerificationEmail = async (email, name, rawToken) => {
  const verifyUrl = frontendUrl(`admin/verify-email.html?token=${rawToken}`);
  await baseSend({
    to: email,
    subject: "Verify your email address",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (email, name, rawToken) => {
  const resetUrl = frontendUrl(`admin/reset-password.html?token=${rawToken}`);
  await baseSend({
    to: email,
    subject: "Reset your password",
    html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to choose a new one:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
};

export const sendWelcomeEmail = async (email, name) => {
  await baseSend({
    to: email,
    subject: "Welcome aboard!",
    html: `<p>Hi ${name},</p><p>Your email is verified and your account is now fully active. Happy blogging!</p>`,
  });
};

// Sent to the hospital's inbox whenever someone submits the "Contact us" form.
// replyTo is set to the visitor's own email so hospital staff can hit "Reply"
// in their inbox and it goes straight back to the visitor.
export const sendContactNotificationEmail = async ({
  name,
  email,
  phone,
  subject,
  message,
}) => {
  await baseSend({
    to: process.env.HOSPITAL_CONTACT_EMAIL,
    subject: `New contact form message: ${subject}`,
    replyTo: email,
    html: `
      <p>New message from the website contact form:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone || "Not provided"}</li>
        <li><strong>Subject:</strong> ${subject}</li>
      </ul>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });
};

// Sent back to the visitor confirming their message was received.
export const sendContactAutoReply = async (email, name) => {
  await baseSend({
    to: email,
    subject: "We've received your message",
    html: `<p>Hi ${name},</p><p>Thanks for reaching out. Our team will get back to you as soon as possible.</p>`,
  });
};

// Sent to an applicant confirming their program application was received.
export const sendApplicationReceivedEmail = async (
  email,
  name,
  programLabel,
) => {
  await baseSend({
    to: email,
    subject: `We've received your ${programLabel} application`,
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for applying to our ${programLabel}. We've received your application and our team will review it and get back to you soon.</p>
    `,
  });
};

// Sent to the hospital's inbox whenever a new program application comes in.
export const sendApplicationNotificationEmail = async ({
  programLabel,
  fullName,
  email,
  phone,
  message,
}) => {
  await baseSend({
    to: process.env.HOSPITAL_CONTACT_EMAIL,
    subject: `New ${programLabel} application`,
    replyTo: email,
    html: `
      <p>New application received for the <strong>${programLabel}</strong>:</p>
      <ul>
        <li><strong>Name:</strong> ${fullName}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone || "Not provided"}</li>
      </ul>
      <p><strong>Message:</strong></p>
      <p>${message || "—"}</p>
    `,
  });
};

// Sent to an applicant when their application is accepted.
export const sendApplicationAcceptedEmail = async (
  email,
  name,
  programLabel,
) => {
  await baseSend({
    to: email,
    subject: `Congratulations — Your ${programLabel} application has been accepted`,
    html: `
      <p>Hi ${name},</p>
      <p>We are pleased to inform you that your application for the <strong>${programLabel}</strong> has been <strong>accepted</strong>.</p>
      <p>Our team will reach out to you shortly with further details on the next steps, including orientation, schedule, and any documentation you may need to prepare.</p>
      <p>Welcome aboard, and we look forward to having you with us!</p>
      <p><strong>GOUNI Teaching Hospital</strong></p>
    `,
  });
};

// Sent to an applicant when their application is rejected.
export const sendApplicationRejectedEmail = async (
  email,
  name,
  programLabel,
) => {
  await baseSend({
    to: email,
    subject: `Update on your ${programLabel} application`,
    html: `
      <p>Hi ${name},</p>
      <p>Thank you for your interest in the <strong>${programLabel}</strong> at GOUNI Teaching Hospital.</p>
      <p>After careful review, we regret to inform you that we are unable to offer you a place in the program at this time.</p>
      <p>We appreciate the time and effort you put into your application and encourage you to apply again in the future.</p>
      <p>We wish you all the best in your future endeavours.</p>
      <p><strong>GOUNI Teaching Hospital</strong></p>
    `,
  });
};
