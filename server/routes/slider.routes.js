const express = require('express');
const router = express.Router();
const sliderService = require('../services/slider.service');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// GET /api/sliders - Get all slider images
router.get('/', async (req, res) => {
  try {
    const sliders = await sliderService.getAllSliders();
    res.json({ success: true, sliders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/sliders - Add a new slider image (admin only)
router.post('/', authenticateUser, requireRole('admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const slider = await sliderService.createSliderWithImage(req.body, req.file);
    res.status(201).json({ success: true, slider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/sliders/:id - Update a slider image (admin only)
router.put('/:id', authenticateUser, requireRole('admin', 'super_admin'), upload.single('image'), async (req, res) => {
  try {
    const slider = await sliderService.updateSliderWithImage(req.params.id, req.body, req.file);
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });
    res.json({ success: true, slider });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/sliders/:id - Delete a slider image (admin only)
router.delete('/:id', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const slider = await sliderService.deleteSliderAndImage(req.params.id);
    if (!slider) return res.status(404).json({ success: false, message: 'Slider not found' });
    res.json({ success: true, message: 'Slider deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
