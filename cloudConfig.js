// cloudConfig.js
const cloudinary = require("cloudinary"); // no .v2
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ShareMyFood/NGO_Verification_Documents",
    allowed_formats: ["pdf", "jpg", "jpeg", "png"],
    resource_type: "auto"
  }
});

module.exports = { cloudinary, storage };
