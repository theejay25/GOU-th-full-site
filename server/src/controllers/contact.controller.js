import ContactMessage from "../models/contactMessage.model.js";
import { ok } from "../utils/response.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import {
  sendContactNotificationEmail,
  sendContactAutoReply,
} from "../utils/email.util.js";

export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const contactMessage = await ContactMessage.create({
    name,
    email,
    phone,
    subject,
    message,
  });

  // Message is saved regardless of whether these emails succeed — don't
  // lose someone's inquiry just because SMTP hiccups.
  try {
    await sendContactNotificationEmail({ name, email, phone, subject, message });
    await sendContactAutoReply(email, name);
  } catch (err) {
    console.error("Contact form email failed to send:", err.message);
  }

  return ok(
    res,
    201,
    "Your message has been sent. We'll be in touch soon.",
    contactMessage
  );
});
