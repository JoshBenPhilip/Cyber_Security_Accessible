const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const { sendEmails } = require("./emailService"); // Updated email service
const { db } = require("./firebaseConfig"); // Firestore configuration
const { FieldValue } = require("firebase-admin/firestore"); // Required to use Firestore's FieldValue
const cors = require("cors");

require("dotenv").config();

app.use(bodyParser.json());
app.use(cors());

// Send phishing emails to multiple addresses
app.post("/sendPhishingEmails", async (req, res) => {
  const { emails, templateId, subject, emailTemplate } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res
      .status(400)
      .send("Email list is required and should not be empty.");
  }

  try {
    // Create a promise array to track all emails being sent
    const sendEmailPromises = emails.map(async (email, index) => {
      const userId = `user_${index}`; // Generate a userId (in real use, you'd probably have this)

      const phishingLink = `https://app-gp6swyu7ma-uc.a.run.app/landing?utm_campaign=${templateId}&user_id=${userId}`;

      // Send phishing email
      await sendEmails([email], phishingLink, subject, emailTemplate);

      // Get or create the user document in Firestore
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
        phishingHistory: FieldValue.arrayUnion({
          templateId: templateId,
          category: "phishing", // This can be dynamically set
          clicked: false,
          clickedTimestamp: null,
        }),
      });
    });

    // Wait for all emails to be sent
    await Promise.all(sendEmailPromises);

    // Return success after all emails are sent
    res.status(200).send("All phishing emails sent successfully.");
  } catch (error) {
    console.error("Error sending phishing emails:", error);
    res.status(500).send("Failed to send phishing emails.");
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
    stats.totalPhishingCount = (stats.totalPhishingCount || 0) + 1;

    // Update the Firestore document
    await userRef.update({
      phishingHistory: history,
      stats: stats,
    });

    res.send("<h1>Oops! You clicked a phishing link.</h1>");
  } catch (error) {
    console.log("Error updating phishing record:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
// app.listen(process.env.PORT || 3060, () => {
//   console.log(`Server running on port ${process.env.PORT || 3060}`);
// });

exports.app = functions.https.onRequest(app);
