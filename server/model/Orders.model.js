const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: Number
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
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

// Pre-save to generate order number
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
