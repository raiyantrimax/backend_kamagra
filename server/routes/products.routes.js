const express = require('express');
const router = express.Router();

const productService = require('../services/products.service');
const { upload } = require('../middleware/upload');

// POST /api/products/admin  (admin create with multiple files)
router.post('/admin', upload.array('images', 10), async (req, res) => {
  try {
    const product = await productService.createProductFromUpload(req);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products  (public create with files)
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const product = await productService.createProductFromUpload(req);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products  (list)
router.get('/', async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id  (get by id)
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products/bulk
router.post('/bulk', async (req, res) => {
  try {
    await productService.insertManyProducts(req.body);
    res.status(201).json({ message: 'Products added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id  (update with optional files and flags)
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const updated = await productService.updateProductFromUpload(req.params.id, req);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;