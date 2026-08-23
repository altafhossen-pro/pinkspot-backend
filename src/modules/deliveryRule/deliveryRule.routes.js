const express = require('express');
const router = express.Router();
const deliveryRuleController = require('./deliveryRule.controller');
const verifyToken = require('../../middlewares/verifyToken');
const verifyTokenAdmin = require('../../middlewares/verifyTokenAdmin');

router.get('/', deliveryRuleController.getRules);
router.put('/', verifyToken, verifyTokenAdmin, deliveryRuleController.updateRules);

module.exports = router;
