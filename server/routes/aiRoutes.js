// ===========================================
// AI Routes
// ===========================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { enhanceBio, enhanceCaption } = require('../controllers/aiController');

// All routes require authentication
router.use(authMiddleware);

router.post('/enhance-bio', enhanceBio);         // Enhance user bio
router.post('/enhance-caption', enhanceCaption); // Enhance post caption

module.exports = router;
