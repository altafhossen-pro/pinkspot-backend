
const sendResponse = require('../../utils/sendResponse');
const Settings = require('./settings.model');
const EmailSmsSettings = require('./emailSmsSettings.model');

// ─── In-Memory Cache for site-settings ────────────────────────────────────────
// site-settings এ rarely change হয়, কিন্তু প্রতিটা page load এ DB hit হয়।
// এই simple cache টা প্রতি 5 মিনিটে একবার DB এ যাবে, বাকি সময় memory থেকে দেবে।
let _siteSettingsCache = null;
let _siteSettingsCachedAt = 0;
const SITE_SETTINGS_TTL = 5 * 60 * 1000; // 5 minutes

function getSiteSettingsFromCache() {
  if (_siteSettingsCache && (Date.now() - _siteSettingsCachedAt) < SITE_SETTINGS_TTL) {
    return _siteSettingsCache;
  }
  return null;
}

function setSiteSettingsCache(data) {
  _siteSettingsCache = data;
  _siteSettingsCachedAt = Date.now();
}

function invalidateSiteSettingsCache() {
  _siteSettingsCache = null;
  _siteSettingsCachedAt = 0;
}
// ──────────────────────────────────────────────────────────────────────────────

// Get current settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update settings (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedBy = req.user._id; // Set who updated it

    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new Settings(updateData);
    } else {
      // Update existing settings
      Object.assign(settings, updateData);
    }

    await settings.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
  try {
    await Settings.deleteMany({});

    const defaultSettings = new Settings();
    await defaultSettings.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Settings reset to default successfully',
      data: defaultSettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Get loyalty settings only
exports.getLoyaltySettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Loyalty settings retrieved successfully',
      data: settings.loyaltySettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update loyalty settings only
exports.updateLoyaltySettings = async (req, res) => {
  try {
    const loyaltyData = req.body;
    const updateData = {
      'loyaltySettings': loyaltyData,
      updatedBy: req.user._id
    };

    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new Settings();
    }

    // Update only loyalty settings
    Object.assign(settings.loyaltySettings, loyaltyData);
    settings.updatedBy = req.user._id;

    await settings.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Loyalty settings updated successfully',
      data: settings.loyaltySettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Get delivery charge settings
exports.getDeliveryChargeSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Delivery charge settings retrieved successfully',
      data: settings.deliveryChargeSettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update delivery charge settings
exports.updateDeliveryChargeSettings = async (req, res) => {
  try {
    const deliveryChargeData = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new Settings();
    }

    // Update only delivery charge settings
    Object.assign(settings.deliveryChargeSettings, deliveryChargeData);
    settings.updatedBy = req.user._id;

    await settings.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Delivery charge settings updated successfully',
      data: settings.deliveryChargeSettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Get email & SMS settings
exports.getEmailSMSSettings = async (req, res) => {
  try {
    let settings = await EmailSmsSettings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new EmailSmsSettings();
      await settings.save();
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Email & SMS settings retrieved successfully',
      data: settings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update email & SMS settings
exports.updateEmailSMSSettings = async (req, res) => {
  try {
    const emailSmsData = req.body;

    let settings = await EmailSmsSettings.findOne();

    if (!settings) {
      settings = new EmailSmsSettings();
    }

    Object.assign(settings, emailSmsData);
    settings.updatedBy = req.user._id;

    await settings.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Email & SMS settings updated successfully',
      data: settings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Test email configuration
exports.testEmailConfig = async (req, res) => {
  try {
    const emailConfig = req.body;

    // Create a temporary transporter with the provided config to test it
    const nodemailer = require('nodemailer');
    const host = emailConfig.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = emailConfig.smtpPort || parseInt(process.env.SMTP_PORT) || 587;
    const user = emailConfig.smtpUser || process.env.SMTP_EMAIL;
    const pass = emailConfig.smtpPass || process.env.SMTP_PASSWORD;
    const fromEmail = emailConfig.emailFrom || process.env.EMAIL_FROM || process.env.SMTP_EMAIL;
    const fromName = emailConfig.emailFromName || process.env.EMAIL_FROM_NAME || 'Pinkspot';

    if (!user || !pass) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'SMTP User and Password are required for testing'
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // true for 465, false for 587
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const testEmailAddress = emailConfig.testEmailAddress; // Send to provided email

    if (!testEmailAddress) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Please provide an email address to send the test email to.'
      });
    }

    const mailOptions = {
      from: `"${fromName} (Test)" <${fromEmail}>`,
      to: testEmailAddress,
      subject: 'Pinkspot - Test Email Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ec4899;">Email Configuration Test Successful! 🎉</h2>
          <p>Hello Admin,</p>
          <p>If you are receiving this email, it means your SMTP configuration is working perfectly.</p>
          <br/>
          <p><strong>Config Details Used:</strong></p>
          <ul>
            <li>Host: ${host}</li>
            <li>Port: ${port}</li>
            <li>From Email: ${fromEmail}</li>
          </ul>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Test email sent successfully! Please check your inbox.'
    });

  } catch (error) {
    console.error('Test email error:', error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: 'Failed to send test email: ' + error.message
    });
  }
};

// Test SMS configuration
exports.testSmsConfig = async (req, res) => {
  try {
    const smsConfig = req.body;
    const testPhoneNumber = smsConfig.testPhoneNumber;

    if (!testPhoneNumber) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Please provide a phone number to send the test SMS to.'
      });
    }

    const apiKey = smsConfig.smsApiKey || process.env.BULKSMSBD_API_KEY;
    const senderId = smsConfig.smsSenderId || process.env.BULKSMSBD_SENDER_ID;

    if (!apiKey || !senderId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'SMS API Key and Sender ID are required for testing.'
      });
    }

    const axios = require('axios');
    const message = 'Pinkspot - Your SMS configuration is working perfectly! 🎉';
    const apiUrl = `https://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${testPhoneNumber}&senderid=${senderId}&message=${encodeURIComponent(message)}`;

    const response = await axios.get(apiUrl);

    if (response.data && response.data.response_code === 202) {
      return sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Test SMS sent successfully! Please check your phone.'
      });
    } else {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Failed to send test SMS. API response: ' + (response.data.error_message || 'Unknown error')
      });
    }

  } catch (error) {
    console.error('Test SMS error:', error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: 'Failed to send test SMS: ' + error.message
    });
  }
};

// Get affiliate settings
exports.getAffiliateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Affiliate settings retrieved successfully',
      data: settings.affiliateSettings || {}
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update affiliate settings
exports.updateAffiliateSettings = async (req, res) => {
  try {
    const affiliateData = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new Settings();
    }

    // Update only affiliate settings
    Object.assign(settings.affiliateSettings, affiliateData);
    settings.updatedBy = req.user._id;

    await settings.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Affiliate settings updated successfully',
      data: settings.affiliateSettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Get steadfast settings
exports.getSteadfastSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings();
    }

    // Generate webhookToken if it doesn't exist
    if (!settings.steadfastSettings || !settings.steadfastSettings.webhookToken) {
      const crypto = require('crypto');
      if (!settings.steadfastSettings) {
        settings.steadfastSettings = {};
      }
      settings.steadfastSettings.webhookToken = crypto.randomBytes(32).toString('hex');
      await settings.save();
    } else if (settings.isModified()) {
      await settings.save();
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Steadfast settings retrieved successfully',
      data: settings.steadfastSettings || {}
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update steadfast settings
exports.updateSteadfastSettings = async (req, res) => {
  try {
    const steadfastData = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new Settings();
    }

    // Update only steadfast settings
    Object.assign(settings.steadfastSettings, steadfastData);
    settings.updatedBy = req.user._id;

    await settings.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Steadfast settings updated successfully',
      data: settings.steadfastSettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Get site settings
exports.getSiteSettings = async (req, res) => {
  try {
    // Cache hit — DB query এড়িয়ে যাও
    const cached = getSiteSettingsFromCache();
    if (cached) {
      return sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Site settings retrieved successfully',
        data: cached
      });
    }

    // Cache miss — DB থেকে fetch করো এবং cache এ রাখো
    let settings = await Settings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    const siteData = settings.siteSettings || {};
    setSiteSettingsCache(siteData);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Site settings retrieved successfully',
      data: siteData
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update site settings
exports.updateSiteSettings = async (req, res) => {
  try {
    const siteData = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new Settings();
    }

    // Update only site settings
    if (!settings.siteSettings) {
      settings.siteSettings = {};
    }
    Object.assign(settings.siteSettings, siteData);
    settings.updatedBy = req.user._id;

    await settings.save();

    // Cache invalidate করো — পরের request এ fresh data যাবে DB থেকে
    invalidateSiteSettingsCache();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Site settings updated successfully',
      data: settings.siteSettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Get telegram settings
exports.getTelegramSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Telegram settings retrieved successfully',
      data: settings.telegramSettings || {}
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Update telegram settings
exports.updateTelegramSettings = async (req, res) => {
  try {
    const telegramData = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    if (!settings.telegramSettings) {
      settings.telegramSettings = {};
    }
    Object.assign(settings.telegramSettings, telegramData);
    settings.updatedBy = req.user._id;

    await settings.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Telegram settings updated successfully',
      data: settings.telegramSettings
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// Test Telegram Configuration
exports.testTelegramConfig = async (req, res) => {
  try {
    const { botToken, chatId } = req.body;

    if (!botToken || !chatId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Bot Token and Chat ID are required'
      });
    }

    const message = 'Hello! This is a test message from your Pinkspot store to confirm your Telegram configuration is working properly.';
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // Using fetch (available in Node 18+)
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    const data = await response.json();

    if (data.ok) {
      return sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Test message sent successfully!'
      });
    } else {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: data.description || 'Failed to send message'
      });
    }
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Failed to connect to Telegram API'
    });
  }
};
exports.updateGlobalProductSubtitle = async (req, res) => {
  try {
    const { text, isEnabled } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    if (!settings.siteSettings) {
      settings.siteSettings = {};
    }
    settings.siteSettings.globalProductSubtitle = { text: text || '', isEnabled: isEnabled ?? false };
    settings.updatedBy = req.user._id;
    await settings.save();

    const { Product } = require('../product/product.model');
    if (settings.siteSettings.globalProductSubtitle.isEnabled) {
      await Product.updateMany(
        { isGlobalSubtitleOn: true },
        { globalSubtitle: settings.siteSettings.globalProductSubtitle.text }
      );
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Global subtitle updated and applied to products.',
      data: settings.siteSettings.globalProductSubtitle
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

