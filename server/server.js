// ===========================================
// Express Server - Main Entry Point
// ===========================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
// path was required at the top
const connectDB = require('./config/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ===========================================
// Middleware
// ===========================================

// Enable CORS for all origins (adjust in production)
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// ===========================================
// API Routes
// ===========================================
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// ===========================================
// Health Check Endpoint
// ===========================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Mini LinkedIn API is running!',
        timestamp: new Date().toISOString(),
    });
});

// ===========================================
// Serve Frontend Pages (SPA-like routing)
// ===========================================
app.get('*', (req, res) => {
    // For any non-API route, serve the appropriate HTML file
    const page = req.path.slice(1) || 'index'; // Remove leading slash
    const filePath = path.join(__dirname, '..', 'public', `${page}.html`);

    res.sendFile(filePath, (err) => {
        if (err) {
            // If the file doesn't exist, serve index.html
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
        }
    });
});

// ===========================================
// Global Error Handler
// ===========================================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// ===========================================
// Start Server
// ===========================================
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start listening for requests
        app.listen(PORT, () => {
            console.log(`\n🚀 Mini LinkedIn Server is running!`);
            console.log(`📡 API: http://localhost:${PORT}/api`);
            console.log(`🌐 App: http://localhost:${PORT}`);
            console.log(`📋 Health: http://localhost:${PORT}/api/health\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
