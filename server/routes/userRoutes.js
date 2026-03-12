// ===========================================
// User Routes
// ===========================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
    createProfile,
    getMyProfile,
    getUserProfile,
    updateProfile,
    searchUsers,
    getAllUsers,
    getNotifications,
    markNotificationsRead,
    sendConnectionRequest,
    acceptConnectionRequest,
} = require('../controllers/userController');

// All routes require authentication
router.use(authMiddleware);

// Profile CRUD
router.post('/profile', createProfile);                           // Create profile after signup
router.get('/me', getMyProfile);                                   // Get my profile
router.put('/profile', upload.single('profilePicture'), updateProfile); // Update my profile

// Notifications
router.get('/notifications', getNotifications);                    // Get my notifications
router.put('/notifications/read', markNotificationsRead);          // Mark all as read

// Search & browse
router.get('/search', searchUsers);                                // Search users
router.get('/', getAllUsers);                                      // Get all users (browse)
router.get('/:id', getUserProfile);                                // Get user by ID

// Connections
router.post('/connect/:id', sendConnectionRequest);                // Send connection request
router.post('/connect/accept/:id', acceptConnectionRequest);       // Accept connection request

module.exports = router;
