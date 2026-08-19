const express = require('express');
const router = express.Router();
const blocklistController = require('./blocklist.controller');
const verifyToken = require('../../middlewares/verifyToken');
const verifyTokenAdmin = require('../../middlewares/verifyTokenAdmin');
const { checkPermission } = require('../../middlewares/checkPermission');

// Apply protection and authorization to all routes in this file
// Only admins or superadmins can manage blocklist
router.use(verifyToken);
router.use(verifyTokenAdmin);

// We can use the 'order' or 'settings' permission here, or just rely on Admin token
router.post('/block', checkPermission('order', 'update'), blocklistController.blockEntity);
router.delete('/unblock/:value', checkPermission('order', 'update'), blocklistController.unblockEntity);
router.get('/', checkPermission('order', 'read'), blocklistController.getAllBlocks);

module.exports = router;
