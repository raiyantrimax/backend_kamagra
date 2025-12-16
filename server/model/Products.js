const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  category: { type: String, default: '' },
  brand: { type: String, default: '' },
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  image: { type: String, default: '' },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);