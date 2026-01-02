const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
  name: {
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
    trim: true
  },
  
  subject: {
    type: String,
    trim: true
  },
  
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved', 'closed'],
    default: 'new',
    index: true
  },
  
  replied: {
    type: Boolean,
    default: false
  },
  
  replyMessage: {
    type: String,
    trim: true
  },
  
  repliedAt: {
    type: Date
  },
  
  repliedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', ContactSchema);
