const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Customer information
  customerInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Order items with detailed product info and variant selection
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    // Number of units/strips/packs being ordered
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitType: {
      type: String,
      enum: ['strip', 'pack', 'box', 'bottle', 'unit'],
      default: 'strip'
    },
    // Variant information: quantity per unit (e.g., 25 tablets per strip)
    variant: {
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },
    // Total quantity of items (quantity * variant.quantityPerUnit)
    totalItems: {
      type: Number,
      required: true
    },
    // Price after applying variant discount
    finalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'],
      required: true
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date
  },
  
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  tracking: {
    carrier: String,
    trackingNumber: String,
    shippedAt: Date,
    deliveredAt: Date
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  cancelledAt: Date,
  cancelReason: String
}, {
  timestamps: true
});

// Indexes
OrderSchema.index({ user: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
