// ===========================================
// Post Model - MongoDB Schema
// ===========================================
const mongoose = require('mongoose');

/**
 * Post Schema defines the structure of posts in the feed.
 * Each post belongs to an author and can have likes and comments.
 */
const postSchema = new mongoose.Schema(
    {
        // Reference to the user who created this post
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Text content/caption of the post
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        // Optional image URL (stored in Cloudinary)
        image: {
            type: String,
            default: '',
        },

        // Array of user IDs who liked this post
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        // Comments on the post
        comments: [
            {
                author: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 1000,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // Skills mentioned in this post (extracted for skill matching)
        mentionedSkills: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Index for sorting by newest first
postSchema.index({ createdAt: -1 });

// Create text index for searching post content
postSchema.index({ content: 'text' });

module.exports = mongoose.model('Post', postSchema);
