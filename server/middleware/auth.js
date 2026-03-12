// ===========================================
// Authentication Middleware
// ===========================================
const admin = require('../config/firebase');
const User = require('../models/User');

/**
 * Middleware to verify Firebase ID tokens.
 * Extracts the token from the Authorization header,
 * verifies it with Firebase Admin SDK, and attaches
 * the user document to the request object.
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        // Extract the token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];

        // Verify the token with Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Find the user in our MongoDB database using their Firebase UID
        const user = await User.findOne({ firebaseUID: decodedToken.uid });

        if (!user) {
            // User exists in Firebase but not in our database
            // This happens during first-time setup - attach just the Firebase info
            req.firebaseUser = decodedToken;
            req.user = null;
        } else {
            // Attach both Firebase and MongoDB user info to the request
            req.firebaseUser = decodedToken;
            req.user = user;
        }

        next(); // Continue to the next middleware or route handler
    } catch (error) {
        console.error('Auth middleware error:', error.message);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.',
        });
    }
};

module.exports = authMiddleware;
