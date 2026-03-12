// ===========================================
// Cloudinary Configuration
// ===========================================
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

/**
 * Configure Cloudinary with credentials from environment variables.
 * Cloudinary is used for storing profile pictures and post images.
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer to store files in memory (as buffer)
// This allows us to upload directly to Cloudinary without saving to disk
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} folder - The Cloudinary folder to upload to
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder = 'mini-linkedin') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' }, // Resize large images
                    { quality: 'auto' }, // Auto-optimize quality
                ],
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

module.exports = { cloudinary, upload, uploadToCloudinary };
