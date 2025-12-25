const Slider = require('../model/Slider');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

async function getAllSliders() {
  return Slider.find().sort({ order: 1, createdAt: -1 });
}

async function getSliderById(id) {
  return Slider.findById(id);
}

async function createSlider(data) {
  const slider = new Slider(data);
  return slider.save();
}

async function updateSlider(id, data) {
  return Slider.findByIdAndUpdate(id, data, { new: true });
}

async function deleteSlider(id) {
  return Slider.findByIdAndDelete(id);
}

async function uploadSliderImage(file) {
  if (!file) throw new Error('No image file provided');
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'sliders',
    resource_type: 'auto'
  });
  fs.unlinkSync(file.path);
  return result.secure_url;
}

async function deleteSliderImageByUrl(imageUrl) {
  if (!imageUrl) return;
  // Extract public_id from URL
  const parts = imageUrl.split('/');
  const fileName = parts[parts.length - 1];
  const publicId = 'sliders/' + fileName.split('.')[0];
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    // Ignore errors if image not found
  }
}

async function createSliderWithImage(data, file) {
  if (file) {
    data.image = await uploadSliderImage(file);
  }
  const slider = new Slider(data);
  return slider.save();
}

async function updateSliderWithImage(id, data, file) {
  const slider = await Slider.findById(id);
  if (!slider) return null;
  // If new image, delete old one from Cloudinary
  if (file) {
    await deleteSliderImageByUrl(slider.image);
    data.image = await uploadSliderImage(file);
  }
  Object.assign(slider, data);
  await slider.save();
  return slider;
}

async function deleteSliderAndImage(id) {
  const slider = await Slider.findById(id);
  if (!slider) return null;
  await deleteSliderImageByUrl(slider.image);
  await slider.deleteOne();
  return slider;
}

module.exports = {
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  uploadSliderImage,
  deleteSliderImageByUrl,
  createSliderWithImage,
  updateSliderWithImage,
  deleteSliderAndImage,
};
