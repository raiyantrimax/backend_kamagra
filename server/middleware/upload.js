const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Check if we're using cloud storage in production
const isProduction = process.env.NODE_ENV === 'production';
const useCloudStorage = isProduction && process.env.CLOUDINARY_CLOUD_NAME;

let upload;
let uploadToCloud;

if (useCloudStorage) {
  // Cloudinary setup for production
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
  });

  upload = multer({ storage: cloudStorage });
  uploadToCloud = true;
} else {
  // Local storage for development
  const localStorage = multer.diskStorage({
    destination(req, file, cb) { cb(null, uploadDir); },
    filename(req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
  });

  upload = multer({ storage: localStorage });
  uploadToCloud = false;
}

module.exports = { upload, uploadDir, uploadToCloud };