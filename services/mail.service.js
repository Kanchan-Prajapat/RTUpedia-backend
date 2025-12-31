import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* =========================
   MAIL TO ADMIN
========================= */
export const mailAdmin = async ({ name, email, message, rating }) => {
  console.log("📧 Sending admin mail...");

  await transporter.sendMail({
    from: `"RTUpedia Reviews" <${process.env.MAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: "📝 New Review Submitted",
    html: `
      <h3>New Review Submitted</h3>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Rating:</b> ${"★".repeat(rating)}</p>
      <p><b>Message:</b><br/>${message}</p>
    `,
  });
};


/* =========================
   MAIL TO USER (CONFIRMATION)
========================= */
export const mailUserConfirmation = async ({ name, email }) => {
  console.log("📧 Sending user confirmation mail...");

  await transporter.sendMail({
    from: `"RTUpedia Team" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "✅ Review Received – RTUpedia",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for sharing your experience with RTUpedia.</p>
      <p>Your review has been received and is pending approval.</p>
      <br/>
      <p>— Team RTUpedia</p>
    `,
  });
};
