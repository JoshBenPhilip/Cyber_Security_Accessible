const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter object for SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // Use SSL (for port 465)
  auth: {
    user: process.env.SMTP_USER, // Your email address
    pass: process.env.SMTP_PASS, // Your email password or app password
  },
});

// Function to send phishing email
async function sendEmail(toEmail, phishingLink) {
  const mailOptions = {
    from: process.env.SMTP_USER, // Sender address
    to: toEmail, // List of recipients
    subject: "Phishing Test", // Subject line
    html: `<p>This is a phishing test. Click the link: <a href="${phishingLink}">Verify your account</a></p>`, // HTML body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = { sendEmail };
