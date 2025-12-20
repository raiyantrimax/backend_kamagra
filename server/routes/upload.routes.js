const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const fs = require('fs');

// POST /api/upload/images - Upload multiple images and convert to base64
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    
    // Convert images to base64
    const base64Images = req.files.map(file => {
      const fileBuffer = fs.readFileSync(file.path);
      const base64String = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
      
      // Delete the temporary file after converting to base64
      fs.unlinkSync(file.path);
      
      return base64String;
    });
    
    res.status(200).json({
      message: 'Images uploaded successfully',
      images: base64Images,
      count: base64Images.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/upload/image - Upload single image and convert to base64
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64String = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
    
    // Delete the temporary file after converting to base64
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      image: base64String
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
