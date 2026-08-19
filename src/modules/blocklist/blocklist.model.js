const mongoose = require('mongoose');

const blocklistSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['ip', 'phone'], 
    required: true 
  },
  value: { 
    type: String, 
    required: true,
    unique: true 
  },
  reason: {
    type: String,
    trim: true,
  },
  responseMsg: {
    type: String,
    trim: true,
    default: '',
  },
  expiresAt: { 
    type: Date 
  }, // null or undefined means permanent block
  blockedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
}, { 
  timestamps: true 
});

// Index to quickly search if an IP or Phone is blocked
blocklistSchema.index({ type: 1, value: 1 }, { unique: true });

const Blocklist = mongoose.model('Blocklist', blocklistSchema);

module.exports = Blocklist;
