const Product = require('../model/Products');
const path = require('path');
const { uploadToCloud } = require('../middleware/upload');

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
    
    // For cloud storage, Cloudinary returns the full URL in file.path
    // For local storage, we need to prepend /uploads/
    const images = files.map(f => uploadToCloud ? f.path : `/uploads/${f.filename}`);
    
    const body = { ...req.body };
    // If client supplied images in body (string or array), merge them too
    const bodyImages = normalizeImagesField(body.image || body.images);
    // prefer explicit files + bodyImages merged (files appended)
    body.image = [...bodyImages, ...images];
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
 *  - replaceImages: "true" => images replaced byuploadToCloud ? f.path :  uploaded files only
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
 * Delete product by id
 */
async function deleteProductById(idValue) {
    const product = await Product.findById(idValue);
    if (!product) return null;
    
    // Delete associated images from file system (only for local storage)
    if (!uploadToCloud && product.image && product.image.length > 0) {
        const fs = require('fs');
        const path = require('path');
        
        product.image.forEach(imagePath => {
            // imagePath format: /uploads/filename.ext
            const filename = imagePath.replace('/uploads/', '');
            const fullPath = path.join(__dirname, '..', 'uploads', filename);
            
            // Delete file if it exists
            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                } catch (err) {
                    console.error(`Failed to delete image: ${fullPath}`, err);
                }
            }
        });
    } else if (uploadToCloud && product.image && product.image.length > 0) {
        // Delete from Cloudinary in production
        const cloudinary = require('cloudinary').v2;
        
        product.image.forEach(async (imageUrl) => {
            try {
                // Extract public_id from Cloudinary URL
                const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error(`Failed to delete image from Cloudinary: ${imageUrl}`, err);
            }
        });
    }
    
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