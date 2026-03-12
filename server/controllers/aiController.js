// ===========================================
// AI Controller - Groq API Integration
// ===========================================
const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Enhance a user's bio using AI.
 * POST /api/ai/enhance-bio
 *
 * Takes a rough bio and returns a polished, professional version.
 */
const enhanceBio = async (req, res) => {
    try {
        const { bio } = req.body;

        if (!bio || bio.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bio text is required.',
            });
        }

        // Call Groq API with a specialized prompt
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a professional LinkedIn bio writer. Your job is to take a user's rough bio 
                    and rewrite it to sound professional, impressive, and engaging. Keep it concise (2-3 sentences max). 
                    Don't add information that wasn't implied. Maintain the person's voice but make it polished. 
                    Only return the enhanced bio text, nothing else. No quotes around it.`,
                },
                {
                    role: 'user',
                    content: `Please enhance this LinkedIn bio: "${bio}"`,
                },
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 300,
        });

        const enhancedBio = chatCompletion.choices[0]?.message?.content?.trim();

        res.json({
            success: true,
            data: {
                original: bio,
                enhanced: enhancedBio,
            },
        });
    } catch (error) {
        console.error('Enhance bio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error enhancing bio. Please try again.',
            error: error.message,
        });
    }
};

/**
 * Enhance a post caption using AI.
 * POST /api/ai/enhance-caption
 *
 * Takes a rough caption and returns a polished, professional version.
 */
const enhanceCaption = async (req, res) => {
    try {
        const { caption } = req.body;

        if (!caption || caption.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Caption text is required.',
            });
        }

        // Call Groq API with a specialized prompt
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a LinkedIn content expert. Your job is to take a user's rough post caption 
                    and rewrite it to be professional, engaging, and well-structured. 
                    Keep the same meaning but improve grammar, clarity, and impact.
                    Add relevant hashtags at the end (2-3 max).
                    Keep it concise and natural-sounding.
                    Only return the enhanced caption text, nothing else. No quotes around it.`,
                },
                {
                    role: 'user',
                    content: `Please enhance this LinkedIn post caption: "${caption}"`,
                },
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 500,
        });

        const enhancedCaption = chatCompletion.choices[0]?.message?.content?.trim();

        res.json({
            success: true,
            data: {
                original: caption,
                enhanced: enhancedCaption,
            },
        });
    } catch (error) {
        console.error('Enhance caption error:', error);
        res.status(500).json({
            success: false,
            message: 'Error enhancing caption. Please try again.',
            error: error.message,
        });
    }
};

module.exports = {
    enhanceBio,
    enhanceCaption,
};
