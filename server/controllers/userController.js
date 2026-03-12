// ===========================================
// User Controller - Handles all user-related logic
// ===========================================
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Create a new user profile after Firebase signup.
 * POST /api/users/profile
 */
const createProfile = async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const firebaseUID = req.firebaseUser.uid;

        // Check if user already exists
        const existingUser = await User.findOne({ firebaseUID });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Profile already exists.',
            });
        }

        // Create new user profile
        const user = new User({
            firebaseUID,
            email: email || req.firebaseUser.email,
            fullName,
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Profile created successfully!',
            data: user,
        });
    } catch (error) {
        console.error('Create profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating profile.',
            error: error.message,
        });
    }
};

/**
 * Get the currently logged-in user's profile.
 * GET /api/users/me
 */
const getMyProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found. Please create one.',
            });
        }

        res.json({
            success: true,
            data: req.user,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile.',
        });
    }
};

/**
 * Get a specific user's public profile by their MongoDB ID.
 * GET /api/users/:id
 */
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        const userObj = user.toObject();
        delete userObj.notifications; // hide notifications

        // determine connection status
        let connectionStatus = 'none';
        if (req.user) {
            if (user.connections.includes(req.user._id)) {
                connectionStatus = 'connected';
            } else if (user.connectionRequests.some(r => r.from.toString() === req.user._id.toString())) {
                connectionStatus = 'pending';
            } else if (req.user.connectionRequests && req.user.connectionRequests.some(r => r.from.toString() === user._id.toString())) {
                connectionStatus = 'received';
            }
        }
        userObj.connectionStatus = connectionStatus;
        delete userObj.connectionRequests;

        res.json({
            success: true,
            data: userObj,
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile.',
        });
    }
};

/**
 * Update the currently logged-in user's profile.
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found.',
            });
        }

        const allowedUpdates = [
            'fullName',
            'headline',
            'bio',
            'skills',
            'education',
            'experience',
            'location',
        ];

        // Only update allowed fields
        const updates = {};
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                let value = req.body[key];

                // Parse JSON strings (from FormData submissions)
                if (typeof value === 'string' && ['skills', 'education', 'experience'].includes(key)) {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // If parsing fails, keep original value
                    }
                }

                updates[key] = value;
            }
        }

        // Handle profile picture upload
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'mini-linkedin/profiles');
            updates.profilePicture = result.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully!',
            data: updatedUser,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile.',
            error: error.message,
        });
    }
};

/**
 * Search users by name, headline, or skills.
 * GET /api/users/search?q=keyword
 */
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required.',
            });
        }

        const users = await User.find({
            $or: [
                { fullName: { $regex: q, $options: 'i' } },
                { headline: { $regex: q, $options: 'i' } },
                { skills: { $regex: q, $options: 'i' } },
            ],
        })
            .select('fullName headline profilePicture skills location')
            .limit(20);

        res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching users.',
        });
    }
};

/**
 * Get all users (for browsing / people you may know).
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('fullName headline profilePicture skills location')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users.',
        });
    }
};

/**
 * Get notifications for the current user.
 * GET /api/users/notifications
 */
const getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found.',
            });
        }

        const user = await User.findById(req.user._id)
            .populate('notifications.relatedUser', 'fullName profilePicture headline')
            .select('notifications');

        // Sort notifications by date (newest first)
        const notifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt);

        res.json({
            success: true,
            data: notifications,
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications.',
        });
    }
};

/**
 * Mark all notifications as read.
 * PUT /api/users/notifications/read
 */
const markNotificationsRead = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({ success: false, message: 'Profile not found.' });
        }

        await User.updateOne(
            { _id: req.user._id },
            { $set: { 'notifications.$[].read': true } }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read.',
        });
    } catch (error) {
        console.error('Mark notifications read error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notifications as read.',
        });
    }
};

/**
 * Send a connection request to another user.
 * POST /api/users/connect/:id
 */
const sendConnectionRequest = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user._id;

        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({ success: false, message: "You cannot connect with yourself." });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Check if already connected
        if (targetUser.connections.includes(currentUserId)) {
            return res.status(400).json({ success: false, message: "Already connected." });
        }

        // Check if request already sent
        const alreadyRequested = targetUser.connectionRequests.some(req => req.from.toString() === currentUserId.toString());
        if (alreadyRequested) {
            return res.status(400).json({ success: false, message: "Request already sent." });
        }

        // Add to connection requests
        targetUser.connectionRequests.push({ from: currentUserId });

        // Add notification
        targetUser.notifications.push({
            type: 'connection_request',
            message: `${req.user.fullName} sent you a connection request.`,
            relatedUser: currentUserId
        });

        await targetUser.save();

        res.json({ success: true, message: "Connection request sent." });
    } catch (error) {
        console.error("Send connection request error:", error);
        res.status(500).json({ success: false, message: "Failed to send request." });
    }
};

/**
 * Accept a connection request.
 * POST /api/users/connect/accept/:id
 */
const acceptConnectionRequest = async (req, res) => {
    try {
        const fromUserId = req.params.id;
        const currentUser = await User.findById(req.user._id);

        // Check if request exists
        const requestIndex = currentUser.connectionRequests.findIndex(req => req.from.toString() === fromUserId);
        if (requestIndex === -1) {
            return res.status(400).json({ success: false, message: "Connection request not found." });
        }

        // Remove request
        currentUser.connectionRequests.splice(requestIndex, 1);

        // Add to connections
        if (!currentUser.connections.includes(fromUserId)) {
            currentUser.connections.push(fromUserId);
        }
        await currentUser.save();

        // Add to the other user's connections
        const fromUser = await User.findById(fromUserId);
        if (fromUser && !fromUser.connections.includes(currentUser._id)) {
            fromUser.connections.push(currentUser._id);

            // Add notification to the user who sent the request
            fromUser.notifications.push({
                type: 'general',
                message: `${currentUser.fullName} accepted your connection request.`,
                relatedUser: currentUser._id
            });
            await fromUser.save();
        }

        res.json({ success: true, message: "Connection request accepted." });
    } catch (error) {
        console.error("Accept connection request error:", error);
        res.status(500).json({ success: false, message: "Failed to accept request." });
    }
};

module.exports = {
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
};
