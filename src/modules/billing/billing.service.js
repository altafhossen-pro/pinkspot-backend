const { Product } = require('../product/product.model');

/**
 * Get all products for the billing system
 * 
 * @param {Object} queryOptions 
 * @returns {Promise<Object>}
 */
const getProductsForBilling = async (queryOptions = {}) => {
  const { search = '', status = '', limit = 50, page = 1 } = queryOptions;
  
  const query = {};
  
  // Basic filters
  if (status) {
    query.status = status;
  }
  
  // Search by title or sku
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { 'variants.sku': { $regex: search, $options: 'i' } },
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug status isActive totalStock priceRange basePrice variants category createdAt featuredImage'),
    Product.countDocuments(query)
  ]);
  
  return {
    products,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single product details for billing
 * 
 * @param {String} id 
 * @returns {Promise<Object>}
 */
const getProductDetailsForBilling = async (id) => {
  const product = await Product.findById(id)
    .populate('category', 'name slug')
    .populate('subCategories', 'name slug');
    
  if (!product) {
    throw new Error('Product not found');
  }
  
  return product;
};

/**
 * Sync stock from a purchase
 * 
 * @param {Array} items 
 * @returns {Promise<Boolean>}
 */
const syncPurchaseStock = async (items) => {
  for (const item of items) {
    const { productId, variantSku, quantity } = item;
    
    if (variantSku) {
      // Update variant stock
      await Product.updateOne(
        { _id: productId, "variants.sku": variantSku },
        { $inc: { "variants.$.stockQuantity": quantity } }
      );
    }
    
    // Update total stock
    await Product.updateOne(
      { _id: productId },
      { $inc: { totalStock: quantity } }
    );
  }
  
  return true;
};

/**
 * Revert stock from a purchase
 * 
 * @param {Array} items 
 * @returns {Promise<Object>}
 */
const revertPurchaseStock = async (items) => {
  // Pre-check stock
  const failedItems = [];
  
  for (const item of items) {
    const { productId, variantSku, quantity } = item;
    const product = await Product.findById(productId);
    
    if (!product) {
      failedItems.push({ productId, reason: 'Product not found' });
      continue;
    }
    
    if (variantSku) {
      const variant = product.variants.find(v => v.sku === variantSku);
      if (!variant) {
        failedItems.push({ productId, variantSku, reason: 'Variant not found' });
      } else if (variant.stockQuantity < quantity) {
        failedItems.push({ 
          productId, 
          variantSku, 
          reason: `Insufficient variant stock. Has ${variant.stockQuantity}, trying to revert ${quantity}` 
        });
      }
    } else {
      if (product.totalStock < quantity) {
        failedItems.push({ 
          productId, 
          reason: `Insufficient product stock. Has ${product.totalStock}, trying to revert ${quantity}` 
        });
      }
    }
  }
  
  if (failedItems.length > 0) {
    return { success: false, failedItems };
  }
  
  // If pre-check passes, decrement stock
  for (const item of items) {
    const { productId, variantSku, quantity } = item;
    
    if (variantSku) {
      // Update variant stock
      await Product.updateOne(
        { _id: productId, "variants.sku": variantSku },
        { $inc: { "variants.$.stockQuantity": -quantity } }
      );
    }
    
    // Update total stock
    await Product.updateOne(
      { _id: productId },
      { $inc: { totalStock: -quantity } }
    );
  }
  
  return { success: true };
};

module.exports = {
  getProductsForBilling,
  getProductDetailsForBilling,
  syncPurchaseStock,
  revertPurchaseStock
};
