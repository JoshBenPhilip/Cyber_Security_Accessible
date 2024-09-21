const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { sendEmail } = require("./emailService");
const { db } = require("./firebaseConfig");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "../public")));

// Route to serve index.html for the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Route to send phishing emails
app.post("/sendPhishingEmail", async (req, res) => {
  const { email, templateId, userId } = req.body;
  const phishingLink = `http://localhost:${process.env.PORT}/landing?utm_campaign=${templateId}&user_id=${userId}`;

  try {
    await sendEmail(email, phishingLink);
    await db.collection("campaigns").add({
      email,
      templateId,
      userId,
      clicked: false,
    });
    res.status(200).send("Email sent");
  } catch (error) {
    res.status(500).send("Failed to send email");
  }
});

// Route for landing page when a user clicks phishing link
app.get("/landing", async (req, res) => {
  const { user_id, utm_campaign } = req.query;

  const campaignRef = db
    .collection("campaigns")
    .where("userId", "==", user_id)
    .where("templateId", "==", utm_campaign);
  const snapshot = await campaignRef.get();

  if (!snapshot.empty) {
    snapshot.forEach((doc) => {
      doc.ref.update({ clicked: true });
    });
  }

  res.send("<h1>Oops! You clicked a phishing link.</h1>");
});

// Start the server
app.listen(process.env.PORT || 3060, () => {
  console.log(`Server running on port ${process.env.PORT || 3060}`);
});
