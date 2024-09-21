// Import Firebase directly from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDL664cicZpoQc19S61ydTFhv00bzQjWX0",
  authDomain: "email-webapp-9ef7c.firebaseapp.com",
  projectId: "email-webapp-9ef7c",
  storageBucket: "email-webapp-9ef7c.appspot.com",
  messagingSenderId: "1014518282117",
  appId: "1:1014518282117:web:d9f8f34a609f48bf73b6ec",
  measurementId: "G-CDTC42WCRE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Handle form submission
document
  .getElementById("phishing-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const templateId = document.getElementById("templateId").value;
    const userId = document.getElementById("userId").value;

    try {
      // Send phishing email via backend API
      const response = await fetch("/sendPhishingEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, templateId, userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to send phishing email");
      }

      const result = await response.text();
      alert(result);

      // Optionally log this data to Firestore
      await setDoc(doc(db, "phishing_submissions", userId + "_" + templateId), {
        email,
        templateId,
        userId,
        submissionTime: new Date().toISOString(),
      });
      console.log("Form submission logged in Firestore!");
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    }
  });
