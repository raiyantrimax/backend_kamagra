const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');

// POST /api/upload/images - Upload multiple images
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    
    // Return array of uploaded image paths
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    
    res.status(200).json({
      message: 'Images uploaded successfully',
      images: imagePaths,
      count: imagePaths.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/upload/image - Upload single image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    const imagePath = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      image: imagePath
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
