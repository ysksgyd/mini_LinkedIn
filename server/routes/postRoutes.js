// ===========================================
// Post Routes
// ===========================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
    createPost,
    getFeedPosts,
    getUserPosts,
    toggleLike,
    addComment,
    deletePost,
} = require('../controllers/postController');

// All routes require authentication
router.use(authMiddleware);

// Post CRUD
router.post('/', upload.single('image'), createPost);   // Create a new post
router.get('/', getFeedPosts);                           // Get feed posts
router.get('/user/:userId', getUserPosts);               // Get posts by a specific user
router.delete('/:id', deletePost);                       // Delete a post

// Post interactions
router.put('/:id/like', toggleLike);                     // Like/unlike a post
router.post('/:id/comment', addComment);                 // Add a comment

module.exports = router;
