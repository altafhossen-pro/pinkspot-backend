const billingService = require('./billing.service');

const getProducts = async (req, res) => {
  try {
    const result = await billingService.getProductsForBilling(req.query);
    
    res.status(200).json({
      success: true,
      message: 'Products fetched for billing successfully',
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Billing getProducts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await billingService.getProductDetailsForBilling(id);
    
    res.status(200).json({
      success: true,
      message: 'Product details fetched successfully',
      data: product
    });
  } catch (error) {
    console.error('Billing getProductDetails error:', error);
    res.status(404).json({
      success: false,
      message: 'Product not found',
      error: error.message
    });
  }
};

const syncPurchaseStock = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid items array'
      });
    }
    
    await billingService.syncPurchaseStock(items);
    
    res.status(200).json({
      success: true,
      message: 'Stock synced successfully'
    });
  } catch (error) {
    console.error('Billing syncPurchaseStock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync stock',
      error: error.message
    });
  }
};

const revertStock = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid items array'
      });
    }
    
    const result = await billingService.revertPurchaseStock(items);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to revert stock',
        failedItems: result.failedItems
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Stock reverted successfully'
    });
  } catch (error) {
    console.error('Billing revertStock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reverting stock',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductDetails,
  syncPurchaseStock,
  revertStock
};
