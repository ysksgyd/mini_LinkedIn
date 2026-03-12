// ===========================================
// Firebase Admin Configuration
// ===========================================
const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK for server-side token verification.
 * The service account credentials come from environment variables.
 */
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
});

module.exports = admin;
