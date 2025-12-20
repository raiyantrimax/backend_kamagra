const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// POST /api/upload/images - Upload multiple images to Cloudinary
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    
    // Upload images to Cloudinary
    const uploadPromises = req.files.map(file => {
      return cloudinary.uploader.upload(file.path, {
        folder: 'products',
        resource_type: 'auto'
      }).then(result => {
        // Delete the temporary file after uploading to Cloudinary
        fs.unlinkSync(file.path);
        return result.secure_url;
      });
    });
    
    const imageUrls = await Promise.all(uploadPromises);
    
    res.status(200).json({
      message: 'Images uploaded successfully',
      images: imageUrls,
      count: imageUrls.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/upload/image - Upload single image to Cloudinary
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products',
      resource_type: 'auto'
    });
    
    // Delete the temporary file after uploading to Cloudinary
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      image: result.secure_url
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
