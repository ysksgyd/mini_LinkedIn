// ===========================================
// User Model - MongoDB Schema
// ===========================================
const mongoose = require('mongoose');

/**
 * User Schema defines the structure of user profiles.
 * Each user is linked to a Firebase UID for authentication.
 */
const userSchema = new mongoose.Schema(
    {
        // Firebase UID - links this profile to Firebase Authentication
        firebaseUID: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // User's email address
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        // Full name of the user
        fullName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        // Professional headline (e.g., "Full Stack Developer at Google")
        headline: {
            type: String,
            trim: true,
            maxlength: 200,
            default: '',
        },

        // Bio/About section
        bio: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: '',
        },

        // Profile picture URL (stored in Cloudinary)
        profilePicture: {
            type: String,
            default: '',
        },

        // Skills as an array of strings (tags)
        skills: {
            type: [String],
            default: [],
        },

        // Education history
        education: [
            {
                school: { type: String, trim: true },
                degree: { type: String, trim: true },
                field: { type: String, trim: true },
                startYear: { type: Number },
                endYear: { type: Number },
            },
        ],

        // Work experience
        experience: [
            {
                title: { type: String, trim: true },
                company: { type: String, trim: true },
                location: { type: String, trim: true },
                startDate: { type: String },
                endDate: { type: String },
                description: { type: String, trim: true },
                current: { type: Boolean, default: false },
            },
        ],

        // Location (city, country)
        location: {
            type: String,
            trim: true,
            default: '',
        },

        // Connection system (user IDs)
        connections: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        // Pending connection requests received
        connectionRequests: [
            {
                from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                createdAt: { type: Date, default: Date.now },
            },
        ],

        // Notifications for the user
        notifications: [
            {
                type: {
                    type: String,
                    enum: ['skill_match', 'connection_request', 'post_like', 'post_comment', 'general'],
                },
                message: String,
                relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
                read: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Create a text index for searching users by name, headline, or skills
userSchema.index({ fullName: 'text', headline: 'text', skills: 'text' });

module.exports = mongoose.model('User', userSchema);
