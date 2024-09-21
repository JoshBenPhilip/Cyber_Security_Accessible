const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { sendEmail } = require("./emailService"); // Email service
const { db } = require("./firebaseConfig"); // Firestore configuration
const admin = require("firebase-admin"); // Required to use Firestore's FieldValue
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Send phishing emails and track data
app.post("/sendPhishingEmail", async (req, res) => {
  const { email, templateId, userId, category } = req.body; // include `category`
  const phishingLink = `http://localhost:${
    process.env.PORT || 3060
  }/landing?utm_campaign=${templateId}&user_id=${userId}`;

  try {
    // Send phishing email
    await sendEmail(email, phishingLink);

    // Get or create the user document
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // If user doesn't exist, create a new document
      await userRef.set({
        email: email,
        phishingHistory: [],
        stats: {
          basicPhishingCount: 0,
          mediumPhishingCount: 0,
          spearPhishingCount: 0,
          totalPhishingCount: 0,
        },
      });
    }

    // Update the user's phishing history
    await userRef.update({
      phishingHistory: admin.firestore.FieldValue.arrayUnion({
        templateId: templateId,
        category: category,
        clicked: false,
        clickedTimestamp: null,
      }),
    });

    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email");
  }
});

// Track phishing clicks and update stats
app.get("/landing", async (req, res) => {
  const { user_id, utm_campaign } = req.query;

  try {
    const userRef = db.collection("users").doc(user_id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).send("User not found");
      return;
    }

    const userData = userDoc.data();
    const history = userData.phishingHistory || [];
    const phishingEntry = history.find(
      (entry) => entry.templateId === utm_campaign && !entry.clicked
    );

    if (!phishingEntry) {
      res.status(400).send("Phishing record not found or already clicked");
      return;
    }

    // Mark the phishing entry as clicked
    phishingEntry.clicked = true;
    phishingEntry.clickedTimestamp = new Date();

    // Update stats based on the category
    const stats = userData.stats || {};
    switch (phishingEntry.category) {
      case "basic":
        stats.basicPhishingCount = (stats.basicPhishingCount || 0) + 1;
        break;
      case "medium":
        stats.mediumPhishingCount = (stats.mediumPhishingCount || 0) + 1;
        break;
      case "spear phishing":
        stats.spearPhishingCount = (stats.spearPhishingCount || 0) + 1;
        break;
    }
    stats.totalPhishingCount = (stats.totalPhishingCount || 0) + 1;

    // Update the Firestore document
    await userRef.update({
      phishingHistory: history,
      stats: stats,
    });

    res.send("<h1>Oops! You clicked a phishing link.</h1>");
  } catch (error) {
    console.error("Error updating phishing record:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(process.env.PORT || 3060, () => {
  console.log(`Server running on port ${process.env.PORT || 3060}`);
});
