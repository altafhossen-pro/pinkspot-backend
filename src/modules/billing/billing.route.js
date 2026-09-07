const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');

// All routes here are protected by the billingAuth middleware which is applied in index.js
router.get('/products', billingController.getProducts);
router.get('/products/:id', billingController.getProductDetails);
router.post('/purchases/sync-stock', billingController.syncPurchaseStock);
router.post('/purchases/revert-stock', billingController.revertStock);

module.exports = router;
