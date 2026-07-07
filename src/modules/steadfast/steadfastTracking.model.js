const mongoose = require('mongoose');

const steadfastTrackingSchema = new mongoose.Schema(
  {
    notification_type: {
      type: String,
      required: true,
      enum: ['delivery_status', 'tracking_update'],
    },
    consignment_id: {
      type: Number,
      required: true,
      index: true,
    },
    invoice: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      // Status provided in delivery_status webhook (e.g. pending, delivered, etc)
    },
    tracking_message: {
      type: String,
      required: true,
    },
    cod_amount: {
      type: Number,
    },
    delivery_charge: {
      type: Number,
    },
    updated_at_steadfast: {
      type: Date,
    },
    raw_payload: {
      type: Object, // Store the raw payload just in case we need extra fields later
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt for our own db
  }
);

module.exports = mongoose.model('SteadfastTracking', steadfastTrackingSchema);
