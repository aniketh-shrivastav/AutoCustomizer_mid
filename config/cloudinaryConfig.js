require("dotenv").config(); // Ensure environment variables are loaded
const cloudinary = require("cloudinary").v2;

// Validate Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn("⚠️  Cloudinary credentials not found in environment variables.");
  console.warn("   Product image uploads will fail. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

module.exports = cloudinary;
