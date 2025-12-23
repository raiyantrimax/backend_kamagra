const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  originalPrice: {
    type: Number,
    min: 0,
    default: null
  },
  
  productCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  // Category & Classification
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  manufacturer: {
    type: String,
    trim: true
  },
  
  // Inventory
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  availability: {
    type: String,
    enum: ['In Stock', 'Out of Stock', 'Pre-Order', 'Discontinued'],
    default: 'In Stock'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'out-of-stock'],
    default: 'active',
    index: true
  },
  
  // Media
  image: [{
    type: String,
    trim: true
  }],
  
  // Short description for card/listing views
  description: {
    type: String,
    trim: true
  },
  
  // Product Variants (Quantity Options)
  unitType: {
    type: String,
    enum: ['strip', 'pack'],
    default: 'strip'
  },
  
  variants: [{
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  
  // Detailed product information sections
  overview: {
    title: {
      type: String,
      default: 'Overview'
    },
    content: {
      type: String,
      trim: true
    }
  },
  
  administration: {
    title: {
      type: String,
      default: 'Administration'
    },
    content: {
      type: String,
      trim: true
    }
  },
  
  sideEffects: {
    title: {
      type: String,
      default: 'Side Effects'
    },
    content: {
      type: String,
      trim: true
    }
  },
  
  contraindications: {
    title: {
      type: String,
      default: 'Contraindications'
    },
    content: {
      type: String,
      trim: true
    }
  },
  
  howItWorks: {
    title: {
      type: String,
      default: 'How it Works'
    },
    content: {
      type: String,
      trim: true
    }
  },
  
  tips: {
    title: {
      type: String,
      default: 'Tips'
    },
    content: {
      type: String,
      trim: true
    }
  },
  
  faq: {
    title: {
      type: String,
      default: 'FAQ'
    },
    content: {
      type: String,
      trim: true,
      required: false
    }
  },
  
  warning: {
    title: {
      type: String,
      default: 'Warning'
    },
    content: {
      type: String,
      trim: true
    }
  },
  
  // Additional flags
  isNew: {
    type: Boolean,
    default: false
  },
  
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // SEO fields
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  
  metaTitle: {
    type: String,
    trim: true
  },
  
  metaDescription: {
    type: String,
    trim: true
  },
  
  metaKeywords: [{
    type: String,
    trim: true
  }],
  
  // Analytics
  sales: {
    type: Number,
    default: 0,
    min: 0
  },
  
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ProductSchema.index({ name: 'text', description: 'text', category: 'text' });
ProductSchema.index({ price: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ sales: -1 });
ProductSchema.index({ createdAt: -1 });

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for image URLs (if images are stored as relative paths)
ProductSchema.virtual('imageUrls').get(function() {
  if (!this.image || this.image.length === 0) return [];
  return this.image.map(img => process.env.CDN_URL ? `${process.env.CDN_URL}${img}` : img);
});

// Pre-save middleware to generate slug
ProductSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Methods
ProductSchema.methods.incrementSales = function(quantity = 1) {
  this.sales += quantity;
  return this.save();
};

ProductSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

ProductSchema.methods.updateStock = function(quantity) {
  this.stock += quantity;
  if (this.stock <= 0) {
    this.stock = 0;
    this.status = 'out-of-stock';
    this.availability = 'Out of Stock';
  } else if (this.status === 'out-of-stock') {
    this.status = 'active';
    this.availability = 'In Stock';
  }
  return this.save();
};

// Static methods
ProductSchema.statics.findByCategory = function(category, options = {}) {
  return this.find({ category, status: 'active', ...options.filters })
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 10)
    .skip(options.skip || 0);
};

ProductSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, status: 'active' })
    .sort({ sales: -1 })
    .limit(limit);
};

ProductSchema.statics.findTopSelling = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ sales: -1 })
    .limit(limit);
};

ProductSchema.statics.searchProducts = function(query, options = {}) {
  return this.find({
    $text: { $search: query },
    status: 'active',
    ...options.filters
  })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

module.exports = mongoose.model('Product', ProductSchema);