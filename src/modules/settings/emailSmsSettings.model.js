const mongoose = require('mongoose');

const emailSmsSettingsSchema = new mongoose.Schema({
  // SMTP Configuration
  smtpHost: {
    type: String,
    default: ''
  },
  smtpPort: {
    type: Number,
    default: 587
  },
  smtpUser: {
    type: String,
    default: ''
  },
  smtpPass: {
    type: String,
    default: ''
  },
  emailFrom: {
    type: String,
    default: ''
  },
  emailFromName: {
    type: String,
    default: ''
  },
  
  // SMS Configuration
  smsApiKey: {
    type: String,
    default: ''
  },
  smsSenderId: {
    type: String,
    default: '8809648904634' // Default for BulkSMS BD
  },

  // Toggle configurations
  isSendOrderConfirmationEmail: {
    type: Boolean,
    default: true
  },
  isSendGuestOrderConfirmationSMS: {
    type: Boolean,
    default: false
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const EmailSmsSettings = mongoose.model('EmailSmsSettings', emailSmsSettingsSchema);

module.exports = EmailSmsSettings;
