const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Loyalty Points Settings - All loyalty related settings in one object
  loyaltySettings: {
    coinPerItem: {
      type: Number,
      default: 1,
      min: 0,
      max: 100
    },
    coinValue: {
      type: Number,
      default: 1, // 1 coin = 1 ৳
      min: 0.1,
      max: 100
    },
    isLoyaltyEnabled: {
      type: Boolean,
      default: true
    },

    // Coin Earning Rules
    earnOnDelivery: {
      type: Boolean,
      default: true // Earn coins when order is delivered (COD)
    },
    earnOnPaymentSuccess: {
      type: Boolean,
      default: true // Earn coins when payment is successful
    },

    // Minimum Settings (no maximum limit - user can pay entire order)
    minRedeemAmount: {
      type: Number,
      default: 1 // Minimum ৳1 to redeem
    },

    // Signup bonus coins
    signupBonusCoins: {
      type: Number,
      default: 0, // Coins given to new users on signup
      min: 0
    }
  },

  // Delivery Charge Settings
  deliveryChargeSettings: {
    outsideDhaka: {
      type: Number,
      default: 150,
      min: 0
    },
    insideDhaka: {
      type: Number,
      default: 80,
      min: 0
    },
    subDhaka: {
      type: Number,
      default: 120,
      min: 0
    },
    shippingFreeRequiredAmount: {
      type: Number,
      default: 1500,
      min: 0
    }
  },

  // General Settings
  isActive: {
    type: Boolean,
    default: true
  },

  // Email & SMS Settings
  isSendOrderConfirmationEmail: {
    type: Boolean,
    default: true
  },
  isSendGuestOrderConfirmationSMS: {
    type: Boolean,
    default: false
  },

  // Affiliate Settings
  affiliateSettings: {
    // Discount for purchaser (who uses affiliate link)
    purchaserDiscountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    purchaserDiscountValue: {
      type: Number,
      default: 5, // 5% or 5 ৳
      min: 0
    },
    // Loyalty points for referrer (affiliate owner) per purchase
    referrerLoyaltyPointsPerPurchase: {
      type: Number,
      default: 10,
      min: 0
    },
    // Loyalty points for purchaser (if logged in user) per purchase
    purchaserLoyaltyPointsPerPurchase: {
      type: Number,
      default: 5,
      min: 0
    },
    // Is affiliate system enabled
    isAffiliateEnabled: {
      type: Boolean,
      default: true
    },
    // Show confirmation modal when affiliate link is used
    isConfirmationModalShowWhenUseAffiliateLink: {
      type: Boolean,
      default: true
    }
  },

  // Steadfast Courier Settings
  steadfastSettings: {
    apiKey: {
      type: String,
      default: ''
    },
    apiSecret: {
      type: String,
      default: ''
    }
  },

  // Admin who last updated
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Site Settings (General Configuration)
  siteSettings: {
    logoUrl: { type: String, default: '' },
    isVideoAutoplayEnabled: { type: Boolean, default: true },
    videoMenu: {
      isEnabled: { type: Boolean, default: false },
      name: { type: String, default: 'Videos' },
      url: { type: String, default: '/videos' },
      backgroundColor: { type: String, default: '#FF0000' },
      textColor: { type: String, default: '#FFFFFF' },
      tailwindClasses: { type: String, default: '' }
    },
    topHeroBanner: {
      type: { type: String, enum: ['image', 'video'], default: 'image' },
      image: { type: String, default: '' },
      videoUrl: { type: String, default: '' },
      title: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      buttonText: { type: String, default: '' },
      link: { type: String, default: '' },
      isActive: { type: Boolean, default: true }
    },
    storeFeatures: {
      backgroundColor: { type: String, default: '#FF1493' },
      textColor: { type: String, default: '#FFFFFF' },
      iconColor: { type: String, default: '#FFFFFF' },
      features: [{
        icon: { type: String, default: 'Star' },
        title: { type: String, default: '' },
        subtitle: { type: String, default: '' }
      }]
    }
  },

  // Order Source Colors for Dashboard Table Highlight
  orderSourceColors: {
    website: { type: String, default: '' },
    facebook: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    'walk-in': { type: String, default: '' },
    instagram: { type: String, default: '' },
    manual: { type: String, default: '' },
    other: { type: String, default: '' }
  }
}, {
  timestamps: true,
});

// Ensure only one settings document exists
settingsSchema.index({}, { unique: true });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
