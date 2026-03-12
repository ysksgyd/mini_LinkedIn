// ===========================================
// Post Controller - Handles all post-related logic
// ===========================================
const Post = require('../models/Post');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');

// Common skills list for keyword detection in posts
const COMMON_SKILLS = [
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'nodejs',
    'express', 'mongodb', 'sql', 'mysql', 'postgresql', 'html', 'css', 'typescript',
    'php', 'ruby', 'swift', 'kotlin', 'flutter', 'dart', 'go', 'rust', 'c++', 'c#',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'devops', 'ci/cd', 'git',
    'machine learning', 'deep learning', 'ai', 'artificial intelligence',
    'data science', 'data analysis', 'blockchain', 'web3', 'solidity',
    'figma', 'photoshop', 'ui/ux', 'design', 'product management',
    'agile', 'scrum', 'project management', 'marketing', 'seo',
    'next.js', 'nextjs', 'tailwind', 'bootstrap', 'sass', 'graphql',
    'redis', 'firebase', 'supabase', 'prisma', 'django', 'flask',
    'spring', 'laravel', '.net', 'unity', 'unreal engine',
    'linux', 'networking', 'cybersecurity', 'cloud computing',
    'tensorflow', 'pytorch', 'opencv', 'nlp', 'computer vision',
];

/**
 * Detect skills mentioned in post content.
 * @param {string} content - The post text content
 * @returns {string[]} - Array of detected skill keywords
 */
const detectSkills = (content) => {
    const lowerContent = content.toLowerCase();
    return COMMON_SKILLS.filter((skill) => lowerContent.includes(skill));
};

/**
 * Create a new post.
 * POST /api/posts
 */
const createPost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Please create a profile first.',
            });
        }

        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Post content is required.',
            });
        }

        let imageUrl = '';

        // Handle image upload if provided
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'mini-linkedin/posts');
            imageUrl = result.secure_url;
        }

        // Detect skills mentioned in the post
        const mentionedSkills = detectSkills(content);

        // Create the post
        const post = new Post({
            author: req.user._id,
            content: content.trim(),
            image: imageUrl,
            mentionedSkills,
        });

        await post.save();

        // Populate author info before sending response
        await post.populate('author', 'fullName profilePicture headline');

        // === SKILL MATCH NOTIFICATION SYSTEM ===
        // If the post mentions any skills, find other users with matching skills
        if (mentionedSkills.length > 0) {
            try {
                // Find users who have any of the mentioned skills in their profile
                const matchingUsers = await User.find({
                    _id: { $ne: req.user._id }, // Exclude the post author
                    $or: [
                        { skills: { $in: mentionedSkills.map((s) => new RegExp(s, 'i')) } },
                    ],
                }).limit(10);

                // Create notifications for matching users
                for (const matchUser of matchingUsers) {
                    // Find the matching skill
                    const matchedSkill = mentionedSkills.find((skill) =>
                        matchUser.skills.some((s) => s.toLowerCase().includes(skill))
                    );

                    if (matchedSkill) {
                        // Add notification to the matching user
                        matchUser.notifications.push({
                            type: 'skill_match',
                            message: `You and ${req.user.fullName} both mentioned "${matchedSkill}". Consider connecting since you share similar skills.`,
                            relatedUser: req.user._id,
                            relatedPost: post._id,
                        });
                        await matchUser.save();

                        // Also notify the post author about the match
                        req.user.notifications.push({
                            type: 'skill_match',
                            message: `You and ${matchUser.fullName} both know "${matchedSkill}". Consider connecting since you share similar skills.`,
                            relatedUser: matchUser._id,
                            relatedPost: post._id,
                        });
                    }
                }

                // Save author's notifications
                if (mentionedSkills.length > 0) {
                    await req.user.save();
                }
            } catch (notifError) {
                // Don't fail the post creation if notification fails
                console.error('Skill match notification error:', notifError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Post created successfully!',
            data: post,
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating post.',
            error: error.message,
        });
    }
};

/**
 * Get all posts for the feed (newest first).
 * GET /api/posts
 */
const getFeedPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate('author', 'fullName profilePicture headline')
            .populate('comments.author', 'fullName profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments();

        res.json({
            success: true,
            data: posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching feed.',
        });
    }
};

/**
 * Get posts by a specific user.
 * GET /api/posts/user/:userId
 */
const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId })
            .populate('author', 'fullName profilePicture headline')
            .populate('comments.author', 'fullName profilePicture')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: posts,
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user posts.',
        });
    }
};

/**
 * Like or unlike a post (toggle).
 * PUT /api/posts/:id/like
 */
const toggleLike = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Please create a profile first.',
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.',
            });
        }

        const userId = req.user._id;
        const likeIndex = post.likes.indexOf(userId);

        if (likeIndex === -1) {
            // User hasn't liked the post - add like
            post.likes.push(userId);

            // Notify the post author (if not liking own post)
            if (post.author.toString() !== userId.toString()) {
                const postAuthor = await User.findById(post.author);
                if (postAuthor) {
                    postAuthor.notifications.push({
                        type: 'post_like',
                        message: `${req.user.fullName} liked your post.`,
                        relatedUser: userId,
                        relatedPost: post._id,
                    });
                    await postAuthor.save();
                }
            }
        } else {
            // User already liked the post - remove like
            post.likes.splice(likeIndex, 1);
        }

        await post.save();

        res.json({
            success: true,
            data: {
                likes: post.likes,
                likesCount: post.likes.length,
                isLiked: likeIndex === -1, // true if just liked, false if just unliked
            },
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling like.',
        });
    }
};

/**
 * Add a comment to a post.
 * POST /api/posts/:id/comment
 */
const addComment = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Please create a profile first.',
            });
        }

        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required.',
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.',
            });
        }

        // Add the comment
        post.comments.push({
            author: req.user._id,
            content: content.trim(),
        });

        await post.save();

        // Notify the post author (if not commenting on own post)
        if (post.author.toString() !== req.user._id.toString()) {
            const postAuthor = await User.findById(post.author);
            if (postAuthor) {
                postAuthor.notifications.push({
                    type: 'post_comment',
                    message: `${req.user.fullName} commented on your post.`,
                    relatedUser: req.user._id,
                    relatedPost: post._id,
                });
                await postAuthor.save();
            }
        }

        // Populate the comment author info
        await post.populate('comments.author', 'fullName profilePicture');

        const newComment = post.comments[post.comments.length - 1];

        res.status(201).json({
            success: true,
            message: 'Comment added successfully!',
            data: newComment,
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding comment.',
        });
    }
};

/**
 * Delete a post (only by the author).
 * DELETE /api/posts/:id
 */
const deletePost = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Please create a profile first.',
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.',
            });
        }

        // Check if the user is the author
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own posts.',
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Post deleted successfully!',
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting post.',
        });
    }
};

module.exports = {
    createPost,
    getFeedPosts,
    getUserPosts,
    toggleLike,
    addComment,
    deletePost,
};
