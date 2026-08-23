const mongoose = require('mongoose');

const deliveryRuleSchema = new mongoose.Schema({
  excludedCategoriesForFreeShipping: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('DeliveryRule', deliveryRuleSchema);
