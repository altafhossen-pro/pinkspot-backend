const { Order } = require('../../order/order.model');
const { Product } = require('../../product/product.model');
const { Category } = require('../../category/category.model');
const sendResponse = require('../../../utils/sendResponse');

// 1. Top Products by timeframe
exports.getTopProducts = async (req, res) => {
  try {
    const { timeframe = 'today' } = req.query; // today, week, month
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const topProducts = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate, $lte: now },
          isDeleted: false,
          status: { $nin: ['cancelled', 'returned'] }
        } 
      },
      { $unwind: "$items" },
      { 
        $group: {
          _id: "$items.product",
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          _id: 1,
          totalQuantitySold: 1,
          totalRevenue: 1,
          title: "$productInfo.title",
          featuredImage: "$productInfo.featuredImage",
          priceRange: "$productInfo.priceRange"
        }
      }
    ]);

    // Bottom selling products (only for week)
    let bottomProducts = [];
    if (timeframe === 'week') {
       bottomProducts = await Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startDate, $lte: now },
            isDeleted: false,
            status: { $nin: ['cancelled', 'returned'] }
          } 
        },
        { $unwind: "$items" },
        { 
          $group: {
            _id: "$items.product",
            totalQuantitySold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        { $sort: { totalQuantitySold: 1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: "$productInfo" },
        {
          $project: {
            _id: 1,
            totalQuantitySold: 1,
            totalRevenue: 1,
            title: "$productInfo.title",
            featuredImage: "$productInfo.featuredImage",
            priceRange: "$productInfo.priceRange"
          }
        }
      ]);
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Top products fetched successfully',
      data: { topProducts, bottomProducts }
    });
  } catch (error) {
    console.error('getTopProducts error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 2. Day of the week people order most
exports.getOrdersByDayOfWeek = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { isDeleted: false, status: { $nin: ['cancelled'] } } },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$createdAt" },
          total: { $ifNull: ["$steadfastCollectedAmount", "$total"] }
        }
      },
      {
        $group: {
          _id: "$dayOfWeek", // 1 (Sun) to 7 (Sat)
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Map 1-7 to Day Names
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedData = data.map(d => ({
      day: days[d._id - 1],
      orderCount: d.orderCount,
      totalRevenue: d.totalRevenue
    }));

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Orders by day of week fetched successfully',
      data: formattedData
    });
  } catch (error) {
    console.error('getOrdersByDayOfWeek error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 3. Category Performance (Fully Dynamic)
exports.getCategoryPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchQuery = { isDeleted: false, status: { $nin: ['cancelled', 'returned'] } };
    
    if (startDate && endDate) {
      matchQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const categoryPerformance = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: "$items" },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          totalOrders: { $addToSet: "$_id" } // Unique orders
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: "$categoryInfo" },
      {
        $project: {
          _id: 1,
          categoryName: "$categoryInfo.name",
          totalQuantitySold: 1,
          totalRevenue: 1,
          totalOrders: { $size: "$totalOrders" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Category performance fetched successfully',
      data: categoryPerformance
    });
  } catch (error) {
    console.error('getCategoryPerformance error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 4. Inventory Movement (Fast/Slow moving and Restock)
exports.getInventoryMovement = async (req, res) => {
  try {
    // Fast moving: High totalSold in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const productSales30Days = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo },
          isDeleted: false,
          status: { $nin: ['cancelled'] }
        } 
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          quantitySold30d: { $sum: "$items.quantity" }
        }
      }
    ]);

    const salesMap = {};
    productSales30Days.forEach(p => {
      salesMap[p._id.toString()] = p.quantitySold30d;
    });

    const allProducts = await Product.find({ isActive: true })
      .select('title totalStock variants featuredImage priceRange category')
      .populate('category', 'name')
      .lean();

    const movementData = allProducts.map(prod => {
      const sold30d = salesMap[prod._id.toString()] || 0;
      // Calculate daily velocity
      const velocityPerDay = sold30d / 30;
      
      // Calculate total current stock
      const currentStock = prod.variants?.length > 0 
        ? prod.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
        : (prod.totalStock || 0);

      // Estimated days until out of stock
      const daysUntilOOS = velocityPerDay > 0 ? (currentStock / velocityPerDay) : 999;
      
      let movementType = 'Normal';
      if (sold30d > 20) movementType = 'Fast Moving';
      if (sold30d < 5) movementType = 'Slow Moving';

      return {
        _id: prod._id,
        title: prod.title,
        featuredImage: prod.featuredImage,
        categoryName: prod.category?.name || 'Uncategorized',
        currentStock,
        sold30d,
        velocityPerDay: velocityPerDay.toFixed(2),
        daysUntilOOS: Math.round(daysUntilOOS),
        movementType,
        needsRestock: daysUntilOOS <= 14 // Restock if it will run out in 14 days
      };
    });

    // Sort fast moving
    const fastMoving = [...movementData].filter(p => p.movementType === 'Fast Moving').sort((a, b) => b.sold30d - a.sold30d).slice(0, 10);
    // Sort slow moving
    const slowMoving = [...movementData].filter(p => p.movementType === 'Slow Moving').sort((a, b) => a.sold30d - b.sold30d).slice(0, 10);
    // Needs restock
    const needsRestock = [...movementData].filter(p => p.needsRestock && p.currentStock < 50).sort((a, b) => a.daysUntilOOS - b.daysUntilOOS).slice(0, 15);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Inventory movement fetched successfully',
      data: { fastMoving, slowMoving, needsRestock }
    });
  } catch (error) {
    console.error('getInventoryMovement error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 5. Customer Retention
exports.getCustomerRetention = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Identify users who had orders BEFORE startDate
    const priorUsersAgg = await Order.aggregate([
      { $match: { createdAt: { $lt: startDate }, isDeleted: false, status: { $nin: ['cancelled'] } } },
      { $group: { _id: "$user" } }
    ]);
    const priorUsers = new Set(priorUsersAgg.map(u => u._id ? u._id.toString() : ''));

    // Look at orders in the current timeframe
    const currentOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: now }, isDeleted: false, status: { $nin: ['cancelled'] } } },
      { $group: { 
          _id: "$user",
          totalSpent: { $sum: { $ifNull: ["$steadfastCollectedAmount", "$total"] } }
        } 
      }
    ]);

    let returningRevenue = 0;
    let newRevenue = 0;
    let returningCount = 0;
    let newCount = 0;

    currentOrders.forEach(o => {
      const uStr = o._id ? o._id.toString() : '';
      if (priorUsers.has(uStr)) {
        returningRevenue += o.totalSpent;
        returningCount++;
      } else {
        newRevenue += o.totalSpent;
        newCount++;
      }
    });

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Retention stats fetched',
      data: { returningRevenue, newRevenue, returningCount, newCount }
    });
  } catch (error) {
    console.error('getCustomerRetention error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 6. Sales by Time of Day
exports.getSalesByTimeOfDay = async (req, res) => {
  try {
    const { timeframe = 'all' } = req.query;
    const now = new Date();
    let startDate = null;
    
    if (timeframe === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const matchStage = { isDeleted: false, status: { $nin: ['cancelled'] } };
    if (startDate) {
      matchStage.createdAt = { $gte: startDate, $lte: now };
    }

    const data = await Order.aggregate([
      { $match: matchStage },
      {
        $project: {
          hourOfDay: { $hour: { date: "$createdAt", timezone: "Asia/Dhaka" } }
        }
      },
      {
        $group: {
          _id: "$hourOfDay",
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Fill all 24 hours
    const hours = Array.from({length: 24}, (_, i) => ({
      hour: i,
      label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
      orders: 0
    }));

    data.forEach(d => {
      if(d._id >= 0 && d._id < 24) hours[d._id].orders = d.orderCount;
    });

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Time of day stats fetched',
      data: hours
    });
  } catch (error) {
    console.error('getSalesByTimeOfDay error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 7. Geographic Distribution
exports.getGeographicDistribution = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { isDeleted: false, status: { $nin: ['cancelled'] } } },
      {
        $group: {
          _id: { $ifNull: ["$shippingAddress.district", "$shippingAddress.city"] },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$steadfastCollectedAmount", "$total"] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    const formattedData = data.map(d => ({
      area: d._id || 'Unknown',
      orders: d.orderCount,
      revenue: d.totalRevenue
    })).filter(d => d.area !== 'Unknown');

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Geographic stats fetched',
      data: formattedData
    });
  } catch (error) {
    console.error('getGeographicDistribution error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 8. Coupon Analytics
exports.getCouponAnalytics = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { isDeleted: false, status: { $nin: ['cancelled'] }, coupon: { $ne: null } } },
      {
        $group: {
          _id: "$coupon", // Usually coupon code string in the schema
          usageCount: { $sum: 1 },
          totalDiscountGiven: { $sum: "$couponDiscount" },
          totalRevenueGenerated: { $sum: { $ifNull: ["$steadfastCollectedAmount", "$total"] } }
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 }
    ]);

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Coupon analytics fetched',
      data
    });
  } catch (error) {
    console.error('getCouponAnalytics error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 9. Order Status & Cancellation Report
exports.getOrderStatusReport = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'all') {
      startDate = new Date(0);
    }

    const matchStage = { isDeleted: false, createdAt: { $gte: startDate, $lte: now } };

    const statusData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    const formattedStatusData = allStatuses.map(status => {
      const found = statusData.find(s => s._id === status);
      return {
        _id: status,
        count: found ? found.count : 0
      };
    });

    const steadfastData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          steadfastCount: { 
            $sum: { $cond: [{ $eq: ["$isAddedIntoSteadfast", true] }, 1, 0] }
          }
        }
      }
    ]);

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Status report fetched',
      data: {
        statusBreakdown: formattedStatusData,
        steadfastCount: steadfastData[0]?.steadfastCount || 0,
        totalOrders: steadfastData[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('getOrderStatusReport error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 10. Order Source Report
exports.getOrderSourceReport = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'all') {
      startDate = new Date(0);
    }

    const matchStage = { isDeleted: false, createdAt: { $gte: startDate, $lte: now } };

    const sourceData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $ifNull: ["$orderSource", "website"] },
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$steadfastCollectedAmount", "$total"] } }
        }
      }
    ]);

    const allSources = [
      'website', 'facebook', 'whatsapp', 'phone',
      'email', 'walk-in', 'instagram', 'manual', 'other'
    ];

    const formattedData = allSources.map(source => {
      const found = sourceData.find(s => s._id === source);
      return {
        _id: source,
        count: found ? found.count : 0,
        revenue: found ? found.revenue : 0
      };
    });

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Source report fetched',
      data: formattedData
    });
  } catch (error) {
    console.error('getOrderSourceReport error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 11. Average Order Value (AOV) Trend
exports.getAovTrend = async (req, res) => {
  try {
    const { timeframe = 'year' } = req.query;
    const now = new Date();
    let startDate = new Date();
    let groupBy = {};
    
    if (timeframe === 'month') {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      groupBy = {
        year: { $year: { date: "$createdAt", timezone: "Asia/Dhaka" } },
        month: { $month: { date: "$createdAt", timezone: "Asia/Dhaka" } },
        day: { $dayOfMonth: { date: "$createdAt", timezone: "Asia/Dhaka" } }
      };
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      groupBy = {
        year: { $year: { date: "$createdAt", timezone: "Asia/Dhaka" } },
        month: { $month: { date: "$createdAt", timezone: "Asia/Dhaka" } }
      };
    }

    const aovData = await Order.aggregate([
      { $match: { isDeleted: false, status: { $nin: ['cancelled'] }, createdAt: { $gte: startDate, $lte: now } } },
      {
        $group: {
          _id: groupBy,
          avgOrderValue: { $avg: { $ifNull: ["$steadfastCollectedAmount", "$total"] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    return sendResponse({
      res, statusCode: 200, success: true, message: 'AOV Trend fetched',
      data: aovData
    });
  } catch (error) {
    console.error('getAovTrend error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 12. Top Spending Customers
exports.getTopCustomers = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { isDeleted: false, status: { $nin: ['cancelled', 'returned'] }, user: { $ne: null } } },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: { $ifNull: ["$steadfastCollectedAmount", "$total"] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          orderCount: 1,
          name: "$userInfo.name",
          email: "$userInfo.email",
          phone: "$userInfo.phone",
          avatar: "$userInfo.avatar"
        }
      }
    ]);

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Top customers fetched',
      data
    });
  } catch (error) {
    console.error('getTopCustomers error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 13. Product Return / Refund Analytics
exports.getReturnAnalytics = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { isDeleted: false, status: 'returned' } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          returnCount: { $sum: "$items.quantity" },
          lostRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      { $sort: { returnCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          _id: 1,
          returnCount: 1,
          lostRevenue: 1,
          title: "$productInfo.title",
          featuredImage: "$productInfo.featuredImage"
        }
      }
    ]);

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Return analytics fetched',
      data
    });
  } catch (error) {
    console.error('getReturnAnalytics error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};

// 14. Recent Live Activity Feed
exports.getRecentActivity = async (req, res) => {
  try {
    const recentOrders = await Order.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderId total steadfastCollectedAmount items status createdAt shippingAddress user guestInfo orderNotes shippingCost')
      .populate('user', 'name phone email')
      .populate('items.product', 'title featuredImage')
      .lean();

    const formatted = recentOrders.map(o => {
      const name = o.shippingAddress?.name || o.user?.name || o.guestInfo?.name || 'A Customer';
      const phone = o.shippingAddress?.phone || o.user?.phone || o.guestInfo?.phone || '';
      const itemCount = o.items ? o.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
      const amount = o.steadfastCollectedAmount || o.total || 0;
      return {
        _id: o._id,
        orderId: o.orderId,
        name,
        phone,
        itemCount,
        amount,
        status: o.status,
        time: o.createdAt,
        items: o.items || [],
        shippingAddress: o.shippingAddress || null,
        notes: o.orderNotes || '',
        deliveryCharge: o.shippingCost || 0
      };
    });

    return sendResponse({
      res, statusCode: 200, success: true, message: 'Recent activity fetched',
      data: formatted
    });
  } catch (error) {
    console.error('getRecentActivity error:', error);
    return sendResponse({ res, statusCode: 500, success: false, message: 'Server Error' });
  }
};
