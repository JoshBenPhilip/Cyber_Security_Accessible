const admin = require("firebase-admin");
const serviceAccount = require("./serviceKey.json"); // Path to your Firebase service account

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { db };
