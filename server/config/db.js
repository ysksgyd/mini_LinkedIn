// ===========================================
// Database Configuration - MongoDB Connection
// ===========================================
const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string from environment variables.
 * Uses Mongoose for Object Data Modeling (ODM).
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
