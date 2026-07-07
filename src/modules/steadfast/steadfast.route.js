const express = require('express');
const steadfastController = require('./steadfast.controller');
const verifyToken = require('../../middlewares/verifyToken');
const verifyTokenAdmin = require('../../middlewares/verifyTokenAdmin');
const router = express.Router();

// Webhook endpoint (public, but auth is validated inside using webhook token)
router.post('/webhook', steadfastController.handleWebhook);

// Get tracking history (Admin only)
router.get('/tracking/:invoice', verifyToken, verifyTokenAdmin, steadfastController.getTrackingHistory);

module.exports = router;
