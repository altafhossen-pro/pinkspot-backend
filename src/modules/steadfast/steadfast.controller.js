const fs = require('fs');
const path = require('path');
const Settings = require('../settings/settings.model');
const { Order } = require('../order/order.model');
const SteadfastTracking = require('./steadfastTracking.model');
const mongoose = require('mongoose');

// Helper for file logging
const logSteadfastWebhook = (message) => {
  try {
    const logDir = path.join(__dirname, '../../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'steadfast_webhook.log');
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    console.error('Error writing to steadfast webhook log:', err);
  }
};

// Helper for Telegram
const sendTelegramAlert = async (settings, message) => {
  try {
    if (!settings || !settings.telegramSettings) return;
    const { botToken, chatId } = settings.telegramSettings;
    if (!botToken || !chatId) return;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });
  } catch (err) {
    console.error('Error sending telegram alert:', err);
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    // Get settings
    const settings = await Settings.findOne();
    const isDebugLogEnabled = settings?.telegramSettings?.enableDebugLogOnSteadfastCallback;
    const isSuccessMsgEnabled = settings?.telegramSettings?.enableSuccessMsgOnSteadfastCallback;

    if (isDebugLogEnabled) {
      logSteadfastWebhook(`Received Webhook Request. Payload: ${JSON.stringify(req.body)}`);
    }

    // 1. Authenticate Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errMsg = 'Missing or invalid Authorization header';
      if (isDebugLogEnabled) logSteadfastWebhook(`Auth Error: ${errMsg}`);
      sendTelegramAlert(settings, `🚨 <b>Steadfast Webhook Error</b>\n${errMsg}`);
      return res.status(401).json({ status: 'error', message: errMsg });
    }

    const token = authHeader.split(' ')[1];
    const expectedToken = settings?.steadfastSettings?.webhookToken;

    if (!expectedToken || token !== expectedToken) {
      const errMsg = 'Unauthorized webhook token';
      if (isDebugLogEnabled) logSteadfastWebhook(`Auth Error: ${errMsg}`);
      sendTelegramAlert(settings, `🚨 <b>Steadfast Webhook Error</b>\n${errMsg}`);
      return res.status(401).json({ status: 'error', message: errMsg });
    }

    // 2. Parse Payload
    const payload = req.body;
    const {
      notification_type,
      consignment_id,
      invoice,
      status,
      tracking_message,
      cod_amount,
      delivery_charge,
      updated_at
    } = payload;

    if (!notification_type || !consignment_id || !invoice) {
      const errMsg = 'Missing required fields';
      if (isDebugLogEnabled) logSteadfastWebhook(`Validation Error: ${errMsg}`);
      sendTelegramAlert(settings, `🚨 <b>Steadfast Webhook Error</b>\n${errMsg}\nPayload: ${JSON.stringify(payload)}`);
      return res.status(400).json({ status: 'error', message: errMsg });
    }

    // 3. Store Tracking History
    await SteadfastTracking.create({
      notification_type,
      consignment_id,
      invoice,
      status,
      tracking_message,
      cod_amount,
      delivery_charge,
      updated_at_steadfast: updated_at ? new Date(updated_at) : new Date(),
      raw_payload: payload
    });

    // 4. Update Order Status if delivery_status
    let orderUpdateMsg = 'No order status change required.';
    if (notification_type === 'delivery_status') {
      let query = { orderId: invoice };
      if (mongoose.Types.ObjectId.isValid(invoice)) {
        query = { $or: [{ orderId: invoice }, { _id: invoice }] };
      }

      const order = await Order.findOne(query);

      if (order) {
        let orderUpdated = false;
        const normalizedStatus = status ? status.toLowerCase() : '';

        if (normalizedStatus === 'delivered' && order.status !== 'delivered') {
          order.status = 'delivered';
          if (order.paymentStatus === 'pending') {
            order.paymentStatus = 'paid';
          }
          if (typeof cod_amount === 'number' || typeof cod_amount === 'string') {
            const finalAmount = (Number(cod_amount) || 0) - (Number(delivery_charge) || 0);
            order.steadfastCollectedAmount = finalAmount;
          }
          if (!order.statusTimestamps) order.statusTimestamps = {};
          order.statusTimestamps.delivered = new Date();
          orderUpdated = true;
          orderUpdateMsg = 'Order marked as Delivered.';
        } else if (normalizedStatus === 'cancelled' && order.status !== 'cancelled') {
          order.status = 'cancelled';
          if (!order.statusTimestamps) order.statusTimestamps = {};
          order.statusTimestamps.cancelled = new Date();
          orderUpdated = true;
          orderUpdateMsg = 'Order marked as Cancelled.';
        }

        if (orderUpdated) {
          await order.save();
        }
      } else {
        orderUpdateMsg = `Order with invoice ${invoice} not found in database.`;
      }
    }

    if (isDebugLogEnabled) logSteadfastWebhook(`Successfully Processed: ${invoice}. ${orderUpdateMsg}`);
    
    if (isSuccessMsgEnabled) {
      const msg = `📦 <b>New Steadfast Callback</b>
<b>Invoice:</b> ${invoice}
<b>Type:</b> ${notification_type}
<b>Status:</b> ${status || 'N/A'}
<b>Message:</b> ${tracking_message || 'N/A'}
<b>System Update:</b> ${orderUpdateMsg}`;
      sendTelegramAlert(settings, msg);
    }

    // 5. Respond with Success
    return res.status(200).json({
      status: 'success',
      message: 'Webhook received successfully.'
    });

  } catch (error) {
    console.error('Steadfast Webhook Error:', error);
    
    const settings = await Settings.findOne();
    const isDebugLogEnabled = settings?.telegramSettings?.enableDebugLogOnSteadfastCallback;
    
    if (isDebugLogEnabled) logSteadfastWebhook(`Server Error: ${error.message}`);
    sendTelegramAlert(settings, `🚨 <b>Steadfast Webhook Internal Error</b>\n${error.message}`);
    
    // Even on error processing internally, returning 500 so Steadfast knows it failed.
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error processing webhook'
    });
  }
};

exports.getTrackingHistory = async (req, res) => {
  try {
    const { invoice } = req.params;
    
    // Find all tracking updates for this invoice, sorted by latest first
    const trackingHistory = await SteadfastTracking.find({ invoice })
      .sort({ updated_at_steadfast: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Tracking history retrieved successfully',
      data: trackingHistory
    });
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching tracking history'
    });
  }
};
