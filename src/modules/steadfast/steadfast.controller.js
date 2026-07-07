const Settings = require('../settings/settings.model');
const { Order } = require('../order/order.model');
const SteadfastTracking = require('./steadfastTracking.model');
const mongoose = require('mongoose');

exports.handleWebhook = async (req, res) => {
  try {
    // 1. Authenticate Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Get settings to verify token
    const settings = await Settings.findOne();
    const expectedToken = settings?.steadfastSettings?.webhookToken;

    if (!expectedToken || token !== expectedToken) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized webhook token' });
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
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
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
    if (notification_type === 'delivery_status') {
      // Find Order by invoice (could be orderId or _id)
      let query = { orderId: invoice };
      if (mongoose.Types.ObjectId.isValid(invoice)) {
        query = { $or: [{ orderId: invoice }, { _id: invoice }] };
      }

      const order = await Order.findOne(query);

      if (order) {
        let orderUpdated = false;
        const normalizedStatus = status ? status.toLowerCase() : '';

        // Status Map
        // We only modify the main order status for 'delivered' or 'cancelled'.
        // For 'partial_delivered', user requested to just store it in history (which we did above) and let admin handle manually.
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
        } else if (normalizedStatus === 'cancelled' && order.status !== 'cancelled') {
          order.status = 'cancelled';
          if (!order.statusTimestamps) order.statusTimestamps = {};
          order.statusTimestamps.cancelled = new Date();
          orderUpdated = true;
        }

        if (orderUpdated) {
          await order.save();
        }
      }
    }

    // 5. Respond with Success
    return res.status(200).json({
      status: 'success',
      message: 'Webhook received successfully.'
    });

  } catch (error) {
    console.error('Steadfast Webhook Error:', error);
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
