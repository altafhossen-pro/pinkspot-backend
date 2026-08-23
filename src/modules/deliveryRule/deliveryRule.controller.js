const DeliveryRule = require('./deliveryRule.model');
const sendResponse = require('../../utils/sendResponse');

exports.getRules = async (req, res) => {
  try {
    let rule = await DeliveryRule.findOne();
    if (!rule) {
      rule = await DeliveryRule.create({ excludedCategoriesForFreeShipping: [] });
    }
    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Delivery rules retrieved successfully',
      data: rule
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

exports.updateRules = async (req, res) => {
  try {
    const { excludedCategoriesForFreeShipping } = req.body;
    let rule = await DeliveryRule.findOne();
    if (!rule) {
      rule = new DeliveryRule();
    }
    if (excludedCategoriesForFreeShipping !== undefined) {
      rule.excludedCategoriesForFreeShipping = excludedCategoriesForFreeShipping;
    }
    await rule.save();
    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Delivery rules updated successfully',
      data: rule
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
