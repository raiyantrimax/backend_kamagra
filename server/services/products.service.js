const Product = require('../model/Products');
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

function parseNestedFields(data) {
    const nestedFields = ['overview', 'administration', 'sideEffects', 'contraindications', 'howItWorks', 'tips', 'faq', 'warning', 'address', 'rating'];
    nestedFields.forEach(field => {
        if (data[field] && typeof data[field] === 'string') {
            try {
                data[field] = JSON.parse(data[field]);
            } catch (e) {
                // Keep as string if not valid JSON
            }
        }
    });
    return data;
}

async function getAllProducts() {
    return Product.find().lean();
}

async function getProductById(id) {
    if (!id) return null;
    return Product.findById(id).lean();
}

async function createProduct(data) {
    data = parseNestedFields(data);
    data.image = normalizeImagesField(data.image || data.images);
    delete data.images; // Use 'image' field as per schema
    
    // Parse numeric fields
    if (data.price) data.price = Number(data.price);
    if (data.originalPrice) data.originalPrice = Number(data.originalPrice);
    if (data.stock) data.stock = Number(data.stock);
    
    // Parse boolean fields
    if (data.isNew !== undefined) data.isNew = data.isNew === 'true' || data.isNew === true;
    if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;
    
    // Parse array fields
    if (data.metaKeywords && typeof data.metaKeywords === 'string') {
        try {
            data.metaKeywords = JSON.parse(data.metaKeywords);
        } catch (e) {
            data.metaKeywords = data.metaKeywords.split(',').map(k => k.trim());
        }
    }
    
    const product = new Product(data);
    return product.save();
}

/**
 * Handle multipart/form-data create where files are uploaded via multer.
 * Accepts an Express `req` object (req.files, req.body).
 */
async function createProductFromUpload(req) {
    const files = req.files || [];
    const fs = require('fs');
    const cloudinary = require('cloudinary').v2;
    
    // Upload files to Cloudinary
    const cloudinaryUrls = [];
    for (const file of files) {
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'products',
                resource_type: 'auto'
            });
            cloudinaryUrls.push(result.secure_url);
            // Delete the temporary file after uploading
            fs.unlinkSync(file.path);
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            // Delete temp file even on error
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    }
    
    const body = { ...req.body };
    // If client supplied images in body (string or array), merge them too
    const bodyImages = normalizeImagesField(body.image || body.images);
    // prefer explicit files + bodyImages merged (files appended)
    body.image = [...bodyImages, ...cloudinaryUrls];
    delete body.images;
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
 * Update product by id (idValue is mongo _id).
 * `update` is a plain object.
 */
async function updateProductById(idValue, update) {
    update = parseNestedFields(update);
    
    if (update.image || update.images) {
        update.image = normalizeImagesField(update.image || update.images);
        delete update.images;
    }
    
    // Parse numeric fields
    if (update.price) update.price = Number(update.price);
    if (update.originalPrice) update.originalPrice = Number(update.originalPrice);
    if (update.stock) update.stock = Number(update.stock);
    
    // Parse boolean fields
    if (update.isNew !== undefined) update.isNew = update.isNew === 'true' || update.isNew === true;
    if (update.isFeatured !== undefined) update.isFeatured = update.isFeatured === 'true' || update.isFeatured === true;
    
    // Parse array fields
    if (update.metaKeywords && typeof update.metaKeywords === 'string') {
        try {
            update.metaKeywords = JSON.parse(update.metaKeywords);
        } catch (e) {
            update.metaKeywords = update.metaKeywords.split(',').map(k => k.trim());
        }
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
    const fs = require('fs');
    const cloudinary = require('cloudinary').v2;
    
    // Upload files to Cloudinary
    const newImages = [];
    for (const file of (req.files || [])) {
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'products',
                resource_type: 'auto'
            });
            newImages.push(result.secure_url);
            // Delete the temporary file after uploading
            fs.unlinkSync(file.path);
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            // Delete temp file even on error
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    }

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
        updatePayload.image = [];
    } else if (replaceImages) {
        updatePayload.image = newImages;
    } else {
        if (newImages.length > 0 || existingImages.length > 0) {
            updatePayload.image = [...existingImages, ...newImages];
        } else if (updatePayload.image || updatePayload.images) {
            updatePayload.image = normalizeImagesField(updatePayload.image || updatePayload.images);
        }
    }
    delete updatePayload.images;

    return updateProductById(idValue, updatePayload);
}

/**
 * Delete product by id.
 */
async function deleteProductById(idValue) {
    // Images are stored on Cloudinary - could add cleanup logic here if needed
    return Product.findByIdAndDelete(idValue);
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    createProductFromUpload,
    insertManyProducts,
    updateProductById,
    updateProductFromUpload,
    deleteProductById
};