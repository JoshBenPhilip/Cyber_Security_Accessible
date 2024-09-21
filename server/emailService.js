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

// Function to send emails to multiple recipients
async function sendEmails(emailList, phishingLink, subject, emailTemplate) {
  const promises = emailList.map(async (toEmail) => {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: toEmail,
      subject: subject,
      html: emailTemplate.replace(
        "{link}",
        `<a href="${phishingLink}">Click here</a>`
      ),
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${toEmail}`);
    } catch (error) {
      console.error(`Error sending email to ${toEmail}:`, error);
    }
  });

  // Wait for all emails to be sent before returning
  return Promise.all(promises);
}

module.exports = { sendEmails };
