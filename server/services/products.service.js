const Product = require('../model/Products'); // adjust path if your model file name/location differs
const path = require('path');

function normalizeImagesField(images) {
    if (!images) return [];
    if (typeof images === 'string') {
        try { return JSON.parse(images); }
        catch (e) { return [images]; }
    }
    if (!Array.isArray(images)) return [images];
    return images;
}

async function getAllProducts() {
    return Product.find().lean();
}

async function getProductById(id) {
    if (!id) return null;
    if (/^[0-9]+$/.test(String(id))) {
        const byNum = await Product.findOne({ id: Number(id) }).lean();
        if (byNum) return byNum;
    }
    return Product.findById(id).lean();
}

async function createProduct(data) {
    if (data.id) data.id = Number(data.id);
    data.images = normalizeImagesField(data.images);
    const product = new Product(data);
    return product.save();
}

/**
 * Handle multipart/form-data create where files are uploaded via multer.
 * Accepts an Express `req` object (req.files, req.body).
 */
async function createProductFromUpload(req) {
    const files = req.files || [];
    const images = files.map(f => `/uploads/${f.filename}`);
    const body = { ...req.body };
    // If client supplied images in body (string or array), merge them too
    const bodyImages = normalizeImagesField(body.images);
    // prefer explicit files + bodyImages merged (files appended)
    body.images = [...bodyImages, ...images];
    // remove any helper fields if present
    delete body.existingImages;
    delete body.replaceImages;
    delete body.removeAllImages;
    return createProduct(body);
}

async function insertManyProducts(products) {
    return Product.insertMany(products);
}

/**
 * Update product by id (idValue may be numeric id or mongo _id).
 * `update` is a plain object.
 */
async function updateProductById(idValue, update) {
    if (update && update.id) update.id = Number(update.id);
    if (update && update.images) update.images = normalizeImagesField(update.images);

    if (/^[0-9]+$/.test(String(idValue))) {
        return Product.findOneAndUpdate({ id: Number(idValue) }, update, { new: true });
    }
    return Product.findByIdAndUpdate(idValue, update, { new: true });
}

/**
 * Handle multipart/form-data update where files may be uploaded and helper flags can control behavior.
 * Accepts `idValue` and Express `req`.
 * Flags in req.body:
 *  - existingImages: JSON string or array of image paths to keep
 *  - replaceImages: "true" => images replaced by uploaded files only
 *  - removeAllImages: "true" => clear all images
 */
async function updateProductFromUpload(idValue, req) {
    const newImages = (req.files || []).map(f => `/uploads/${f.filename}`);

    // parse existingImages
    let existingImages = [];
    if (req.body.existingImages) {
        existingImages = normalizeImagesField(req.body.existingImages);
    }

    const replaceImages = String(req.body.replaceImages || '').toLowerCase() === 'true';
    const removeAllImages = String(req.body.removeAllImages || '').toLowerCase() === 'true';

    const updatePayload = { ...req.body };
    // remove helper fields
    delete updatePayload.existingImages;
    delete updatePayload.replaceImages;
    delete updatePayload.removeAllImages;

    if (removeAllImages) {
        updatePayload.images = [];
    } else if (replaceImages) {
        updatePayload.images = newImages;
    } else {
        if (newImages.length > 0 || existingImages.length > 0) {
            updatePayload.images = [...existingImages, ...newImages];
        } else if (updatePayload.images) {
            updatePayload.images = normalizeImagesField(updatePayload.images);
        }
    }

    return updateProductById(idValue, updatePayload);
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    createProductFromUpload,
    insertManyProducts,
    updateProductById,
    updateProductFromUpload
};